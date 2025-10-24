const db = require("../../../util/database");
const bcrypt = require("bcrypt");
const AWS = require("aws-sdk");
const { encrypt, decrypt, encryptUserData, decryptUserData, decryptUsersArray } = require("../../../util/encryption");

// aws sdk setup
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

/**
 * This function gets all users from database
 * 
 * getAllUsers returns all users with decrypted personal data
 */
const getAllUsers = async () => {
  const [rows] = await db.execute("SELECT * FROM user");
  // Decrypt all users
  return decryptUsersArray(rows);
};

/**
 * This function logins a user with email and password
 * 
 * getLoginUser returns user data after validating encrypted email and hashed password
 */
const getLoginUser = async (email, password) => {
  const emailToFind = email.toLowerCase();
  
  // gets users
  const [rows] = await db.execute(
    "SELECT IDUser, name AS name, email, gender, dateOfBirth, coins, password FROM user WHERE deleted = 0"
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  // Decrypt email until finding a match
  let matchedUser = null;
  for (const row of rows) {
    const decryptedEmail = decrypt(row.email);
    if (decryptedEmail && decryptedEmail.toLowerCase() === emailToFind) {
      matchedUser = row;
      break;
    }
  }

  if (!matchedUser) {
    throw new Error("User not found");
  }

  // Compare password with bcrypt
  const isMatch = await bcrypt.compare(password, matchedUser.password);

  if (!isMatch) {
    throw new Error("Incorrect password");
  }

  // Decrypt user
  const user = decryptUserData(matchedUser);

  // Return user data
  return {
    userId: user.IDUser,
    name: user.name,
    email: user.email,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    coins: user.coins
  };
};

/**
 * This function logins a user with google by its email
 * 
 * getLoginUserGoogle returns user data after validating encrypted email without password check
 */
const getLoginUserGoogle = async (email) => {
  try {
    const emailToFind = email.toLowerCase();
    
    // get users
    const [rows] = await db.execute(
      "SELECT IDUser, name, email, gender, dateOfBirth, coins FROM user WHERE deleted = 0"
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    // Decrypt email until finding a match
    let matchedUser = null;
    for (const row of rows) {
      const decryptedEmail = decrypt(row.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToFind) {
        matchedUser = row;
        break;
      }
    }

    if (!matchedUser) {
      throw new Error("User not found");
    }

    // Decrypt user
    const user = decryptUserData(matchedUser);

    // Return user data
    return {
      userId: user.IDUser,
      name: user.name,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      coins: user.coins
    };
  } catch (error) {
    console.error('Error in getLoginUserGoogle:', error.message);
    throw error;
  }
};

/**
 * This function gets user stats
 * 
 * getStatsUser returns user coins and xp with user info
 */
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
  
  // Decrypt data
  return decryptUsersArray(rows);
};

/**
 * This function registers a new user in the database
 * 
 * postSignupUser returns userId after encrypting personal data, hashing password
 */
const postSignupUser = async (name, email, gender, dateOfBirth, coins, password) => {
  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Verify email doesn't exist (requires decrypting all)
    const emailToCheck = email.toLowerCase();
    const [existingUsers] = await db.execute(
      "SELECT email FROM user WHERE deleted = 0"
    );
    
    for (const user of existingUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToCheck) {
        throw new Error("Email is already registered");
      }
    }

    // Encrypt sensitive data (including email)
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

    // Insert into tree linked to that user
    await db.execute(
      "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
      [userId, 1]
    );

    return { userId };
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * This function updates user information
 * 
 * editUserInfo returns affected rows after encrypting and updating user personal data
 */
const editUserInfo = async (id, name, email, gender, dateOfBirth) => {
  try {
    // Verify email doesn't exist in another user
    const emailToCheck = email.toLowerCase();
    const [existingUsers] = await db.execute(
      "SELECT IDUser, email FROM user WHERE deleted = 0 AND IDUser <> ?",
      [id]
    );
    
    for (const user of existingUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === emailToCheck) {
        throw new Error("Email is already registered for another user");
      }
    }

    // Encrypt data before updating
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

/**
 * This function changes user password
 * 
 * changeUserPassword returns affected rows after hashing and updating new password
 */
const changeUserPassword = async (id, password) => {
  try {
    // Hash new password
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

/**
 * This function gets missions summary grouped by category (water, consumption, energy, etc.)
 * 
 * getMissionsSummaryByUser returns total values for each mission category completed by the user
 */
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

/**
 * This function gets all rewards obtained by a user
 * 
 * getUserRewardsById returns all rewards obtained by the user
 */
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

/**
 * This function gets the top users of the application based on xp
 * 
 * getLeaderboardS returns top 10 users ordered by xp with league info and decrypted names
 */
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

  // Decrypt names
  return decryptUsersArray(rows);
};

/**
 * This function gets the user inventory
 * 
 * getInventoryByUser returns all items of the user inventory with signedUrls from the s3 buckets
 */
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

/**
 * This function uses/equips an item to the user
 * 
 * useItemByUser returns if item was equipped successfully, updates inventory status and the item column in the users tablee
 */
const useItemByUser = async (idUser, idItem) => {
  if (idItem === 0) {
    console.log(`Unequipping item for user ${idUser}`);
    
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
    throw new Error("Item does not exist in user inventory");
  }

  const [rows] = await db.execute(
    `SELECT image_name FROM shop WHERE IDItem = ?`,
    [idItem]
  );

  if (rows.length === 0) {
    throw new Error("Item does not exist in shop");
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

/**
 * This function gets the active item for a user
 * 
 * getActiveItemByUser returns active item with signedURL or null if no item is equipped
 */
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