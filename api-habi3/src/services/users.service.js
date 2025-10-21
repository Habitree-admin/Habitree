const db = require("../../../util/database");
const bcrypt = require("bcrypt");
const AWS = require("aws-sdk");
const { encrypt, decrypt, encryptUserData, decryptUserData, decryptUsersArray } = require("../../../util/encryption");

const AWS_BUCKET = process.env.AWS_BUCKET;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

AWS.config.update({
  signatureVersion: "v4",
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

const getAllUsers = async () => {
  const [rows] = await db.execute("SELECT * FROM user");
  // Desencriptar todos los usuarios
  return decryptUsersArray(rows);
};

const getLoginUser = async (email, password) => {
  const emailToFind = email.toLowerCase();
  
  // 1. Obtener TODOS los usuarios
  const [rows] = await db.execute(
    "SELECT IDUser, name AS name, email, gender, dateOfBirth, coins, password FROM user WHERE deleted = 0"
  );

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  // 2. Desencriptar cada email hasta encontrar coincidencia
  let matchedUser = null;
  for (const row of rows) {
    const decryptedEmail = decrypt(row.email);
    if (decryptedEmail && decryptedEmail.toLowerCase() === emailToFind) {
      matchedUser = row;
      break;
    }
  }

  if (!matchedUser) {
    throw new Error("Usuario no encontrado");
  }

  // 3. Comparar contraseña con bcrypt
  const isMatch = await bcrypt.compare(password, matchedUser.password);

  if (!isMatch) {
    throw new Error("Contraseña incorrecta");
  }

  // 4. Desencriptar datos del usuario
  const user = decryptUserData(matchedUser);

  // 5. Retornar datos del usuario (sin contraseña)
  return {
    userId: user.IDUser,
    name: user.name,
    email: user.email,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    coins: user.coins
  };
};

const getLoginUserGoogle = async (email) => {
  try {
    const emailToFind = email.toLowerCase();
    
    // Obtener TODOS los usuarios
    const [rows] = await db.execute(
      "SELECT IDUser, name, email, gender, dateOfBirth, coins FROM user WHERE deleted = 0"
    );

    if (rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    // Desencriptar cada email hasta encontrar coincidencia
    let matchedUser = null;
    for (const row of rows) {
      const decryptedEmail = decrypt(row.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToFind) {
        matchedUser = row;
        break;
      }
    }

    if (!matchedUser) {
      throw new Error("Usuario no encontrado");
    }

    // Desencriptar datos del usuario
    const user = decryptUserData(matchedUser);

    return {
      userId: user.IDUser,
      name: user.name,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      coins: user.coins
    };
  } catch (error) {
    console.error('Error en getLoginUserGoogle:', error.message);
    throw error;
  }
};

const getStatsUser = async (id) => {
  const [rows] = await db.execute(
    `SELECT 
        u.IDUser,
        u.name,
        u.email,
        u.coins,
        t.level AS tree_level
     FROM user u
     LEFT JOIN tree t ON u.IDUser = t.IDUser
     WHERE u.IDUser = ?`,
    [id]
  );
  
  // Desencriptar los datos
  return decryptUsersArray(rows);
};

const postSignupUser = async (name, email, gender, dateOfBirth, coins, password) => {
  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Verificar que el email no exista (requiere desencriptar todos)
    const emailToCheck = email.toLowerCase();
    const [existingUsers] = await db.execute(
      "SELECT email FROM user WHERE deleted = 0"
    );
    
    for (const user of existingUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToCheck) {
        throw new Error("El email ya está registrado");
      }
    }

    // Encriptar datos sensibles (incluyendo email)
    const encryptedData = encryptUserData({
      name,
      email: emailToCheck,
      gender,
      dateOfBirth
    });

    const [result] = await db.execute(
      "INSERT INTO user (name, email, gender, dateOfBirth, coins, password, deleted) VALUES (?,?,?,?,?,?,?)",
      [
        encryptedData.name,
        encryptedData.email,
        encryptedData.gender,
        encryptedData.dateOfBirth,
        coins,
        hashedPassword,
        0
      ]
    );

    const userId = result.insertId;

    // Insertar en tree vinculado a ese usuario
    await db.execute(
      "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
      [userId, 1]
    );

    return { userId };
  } catch (err) {
    throw new Error(err.message);
  }
};

const editUserInfo = async (id, name, email, gender, dateOfBirth) => {
  try {
    // Verificar que el email no exista en otro usuario
    const emailToCheck = email.toLowerCase();
    const [existingUsers] = await db.execute(
      "SELECT IDUser, email FROM user WHERE deleted = 0 AND IDUser <> ?",
      [id]
    );
    
    for (const user of existingUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToCheck) {
        throw new Error("El email ya está registrado en otro usuario");
      }
    }

    // Encriptar los datos antes de actualizar
    const encryptedData = encryptUserData({
      name,
      email: emailToCheck,
      gender,
      dateOfBirth
    });

    const [result] = await db.execute(
      `UPDATE user 
       SET name = ?, email = ?, gender = ?, dateOfBirth = ? 
       WHERE IDUser = ?`,
      [encryptedData.name, encryptedData.email, encryptedData.gender, encryptedData.dateOfBirth, id]
    );

    return { affectedRows: result.affectedRows };
  } catch (err) {
    throw new Error(err.message);
  }
};

const changeUserPassword = async (id, password) => {
  try {
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `UPDATE user 
       SET password = ? 
       WHERE IDUser = ?`,
      [hashedPassword, id]
    );

    return { affectedRows: result.affectedRows };
  } catch (err) {
    throw new Error(err.message);
  }
};

const getMissionsSummaryByUser = async (id) => {
  const [rows] = await db.execute(
    `SELECT 
        m.category,
        SUM(m.value) AS total_value
     FROM userMissions um
     INNER JOIN mission m ON um.IDMission = m.IDMission
     WHERE um.IDUser = ? AND um.status = 1
     GROUP BY m.category
     ORDER BY m.category`,
    [id]
  );

  const summary = {
    Awareness: "0",
    Consumption: "0",
    Energy: "0",
    Nature: "0",
    Transport: "0",
    Waste: "0",
    Water: "0"
  };

  rows.forEach(row => {
    if (row.category) {
      const normalizedCategory = row.category.charAt(0).toUpperCase() + row.category.slice(1).toLowerCase();
      if (summary.hasOwnProperty(normalizedCategory)) {
        summary[normalizedCategory] = (row.total_value || 0).toString();
      }
    }
  });

  return summary;
};

const getUserRewardsById = async (id) => {
  const [rows] = await db.execute(
    `SELECT 
        r.IDReward,
        r.name,
        r.description,
        r.type,
        r.available,
        r.value,
        ur.IDUserReward
     FROM userRewards ur
     INNER JOIN rewards r ON ur.IDReward = r.IDReward
     WHERE ur.IDUser = ? 
       AND r.type IN ('monetary', 'nonMonetary')
     ORDER BY ur.IDUserReward DESC`,
    [id]
  );
  return rows;
};

const getLeaderboardS = async () => {
  const [rows] = await db.execute(`
    SELECT 
      u.name,
      t.level,
      l.league
    FROM user u
    INNER JOIN tree t ON u.IDUser = t.IDUser
    LEFT JOIN ranking r ON t.IDTree = r.IDTree
    LEFT JOIN Leagues l ON r.ID_league = l.ID_league
    WHERE u.deleted = 0
    ORDER BY t.level DESC, u.name ASC
    LIMIT 10
  `);

  // Desencriptar los nombres
  return decryptUsersArray(rows);
};

const getInventoryByUser = async (userId) => {
  const query = `
    SELECT 
      i.IDInventory,
      i.IDUser,
      i.IDItem,
      i.Quantity,
      i.status,
      s.name AS item_name,
      s.state,
      s.category,
      s.price,
      s.image_name
    FROM inventory i
    INNER JOIN shop s ON i.IDItem = s.IDItem
    WHERE i.IDUser = ?
  `;

  const [rows] = await db.execute(query, [userId]);

  const inventoryWithUrls = await Promise.all(
    rows.map(async (item) => {
      if (!item.image_name) return { ...item, imageUrl: null };

      const params = { Bucket: AWS_BUCKET, Key: item.image_name, Expires: 3600 };
      const signedUrl = s3.getSignedUrl("getObject", params);
      return { ...item, imageUrl: signedUrl };
    })
  );

  return inventoryWithUrls;
};

const useItemByUser = async (idUser, idItem) => {
  if (idItem === 0) {
    console.log(`Desequipando item para usuario ${idUser}`);
    
    await db.execute(
      `UPDATE inventory 
       SET status = 0 
       WHERE IDUser = ? AND status = 1`,
      [idUser]
    );

    await db.execute(
      `UPDATE user 
       SET item = NULL 
       WHERE IDUser = ?`,
      [idUser]
    );

    return { idUser, idItem: 0, imageName: null };
  }

  await db.execute(
    `UPDATE inventory 
     SET status = 0 
     WHERE IDUser = ? AND status = 1`,
    [idUser]
  );

  const [updateResult] = await db.execute(
    `UPDATE inventory 
     SET status = 1 
     WHERE IDUser = ? AND IDItem = ?`,
    [idUser, idItem]
  );

  if (updateResult.affectedRows === 0) {
    throw new Error("El ítem no existe en el inventario del usuario");
  }

  const [rows] = await db.execute(
    `SELECT image_name FROM shop WHERE IDItem = ?`,
    [idItem]
  );

  if (rows.length === 0) {
    throw new Error("El ítem no existe en la tienda");
  }

  const imageName = rows[0].image_name;

  await db.execute(
    `UPDATE user 
     SET item = ? 
     WHERE IDUser = ?`,
    [imageName, idUser]
  );

  return { idUser, idItem, imageName };
};

const getActiveItemByUser = async (idUser) => {
  const [rows] = await db.execute(
    `SELECT item FROM user WHERE IDUser = ? AND deleted = 0`,
    [idUser]
  );

  if (rows.length === 0 || !rows[0].item) return null;

  const imageName = rows[0].item;

  const params = { Bucket: AWS_BUCKET, Key: imageName, Expires: 3600 };
  const signedUrl = s3.getSignedUrl("getObject", params);

  return {
    image_name: imageName,
    signedUrl
  };
};

module.exports = {
  getAllUsers,
  getLoginUser,
  postSignupUser,
  getStatsUser,
  editUserInfo,
  changeUserPassword,
  getMissionsSummaryByUser,
  getUserRewardsById,
  getLoginUserGoogle,
  getLeaderboardS,
  getInventoryByUser,
  useItemByUser,
  getActiveItemByUser
};