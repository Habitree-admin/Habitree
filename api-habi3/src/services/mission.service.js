const db = require("../../../util/database");

const getAllMissions = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT 
        m.IDMission,
        m.category,
        m.description AS missionDescription,
        m.experience,
        um.status AS userStatus,

        r.IDReward,
        r.name AS rewardName,
        r.description AS rewardDescription,
        r.type AS rewardType,
        r.value AS rewardValue,

        mon.type AS monetaryType,
        mon.value AS monetaryValue,
        mon.dateReceived,
        mon.expiresAt,
        sr.name AS statusRewardName,
        br.extraCoins AS boostExtraCoins,
        ir.extraCoins AS impactExtraCoins

    FROM mission m
    LEFT JOIN userMissions um 
        ON m.IDMission = um.IDMission AND um.IDUser = ?
    LEFT JOIN missionRewards mrw 
        ON m.IDMission = mrw.IDMission
    LEFT JOIN rewards r 
        ON mrw.IDReward = r.IDReward
    LEFT JOIN monetaryReward mon 
        ON r.IDReward = mon.IDReward
    LEFT JOIN statusReward sr 
        ON r.IDReward = sr.IDReward
    LEFT JOIN boostReward br 
        ON r.IDReward = br.IDReward
    LEFT JOIN impactReward ir 
        ON r.IDReward = ir.IDReward
    ORDER BY m.IDMission, r.IDReward
    `,
    [userId]
  );

  console.log('Raw rows from DB:', rows.length); // Debug

  // Objeto para agrupar misiones
  const missionsMap = {};

  rows.forEach(row => {
    const missionId = row.IDMission;
    
    // Si la misión no existe, la creamos
    if (!missionsMap[missionId]) {
      missionsMap[missionId] = {
        IDMission: row.IDMission,
        category: row.category,
        missionDescription: row.missionDescription,
        experience: row.experience,
        isCompleted: row.userStatus || 0,
        rewards: []
      };
    }

    // Solo procesamos rewards que existan
    if (row.IDReward) {
      // Verificamos si este reward ya está en la lista
      const existingReward = missionsMap[missionId].rewards.find(r => r.IDReward === row.IDReward);
      
      if (!existingReward) {
        const reward = {
          IDReward: row.IDReward,
          name: row.rewardName,
          description: row.rewardDescription,
          type: row.rewardType,
          value: row.rewardValue,
          monetary: row.monetaryType ? {
            type: row.monetaryType,
            value: row.monetaryValue,
            dateReceived: row.dateReceived,
            expiresAt: row.expiresAt,
          } : null,
          statusReward: row.statusRewardName ? {
            name: row.statusRewardName
          } : null,
          boostReward: row.boostExtraCoins ? {
            extraCoins: row.boostExtraCoins
          } : null,
          impactReward: row.impactExtraCoins ? {
            extraCoins: row.impactExtraCoins
          } : null
        };

        missionsMap[missionId].rewards.push(reward);
      }
    }
  });

  const result = Object.values(missionsMap);
  console.log('Final result length:', result.length); // Debug
  console.log('Sample mission:', JSON.stringify(result[0], null, 2)); // Debug
  
  return result;
};

const getUserMission = async() => {
    const [rows] = await db.execute(`
SELECT 
    u.IDUser,
    u.name AS userName,
    m.IDMission,
    m.category AS missionCategory,
    m.description AS missionDescription,
    m.experience AS missionExperience,
    r.IDReward,
    r.name AS rewardName,
    r.type AS rewardType,
    r.value AS rewardValue,
    e.IDEvidence,
    e.dateOfSubmission,
    e.validation AS evidenceValidated,
    n.IDNotification,
    n.description AS notificationDescription
FROM userMission um
JOIN user u ON um.IDUser = u.IDUser
JOIN mission m ON um.IDMission = m.IDMission
JOIN evidence e ON um.IDEvidence = e.IDEvidence
JOIN notification n ON um.IDNotification = n.IDNotification
LEFT JOIN missionRewards mr ON m.IDMission = mr.IDMission
LEFT JOIN rewards r ON mr.IDReward = r.IDReward;
`);
    return rows; 
};

const getUserMissions = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT 
        u.IDUser,
        u.name AS userName,
        m.IDMission,
        m.category AS missionCategory,
        m.description AS missionDescription,
        m.experience AS missionExperience,
        r.IDReward,
        r.name AS rewardName,
        r.type AS rewardType,
        r.value AS rewardValue,
        e.IDEvidence,
        e.dateOfSubmission,
        e.validation AS evidenceValidated,
        n.IDNotification,
        n.description AS notificationDescription
    FROM userMission um
    JOIN user u ON um.IDUser = u.IDUser
    JOIN mission m ON um.IDMission = m.IDMission
    JOIN evidence e ON um.IDEvidence = e.IDEvidence
    JOIN notification n ON um.IDNotification = n.IDNotification
    LEFT JOIN missionRewards mr ON m.IDMission = mr.IDMission
    LEFT JOIN rewards r ON mr.IDReward = r.IDReward
    WHERE u.IDUser = ? AND m.available = 1;
    `,
    [userId]
  );
  return rows;
};

const postCompleteMissionUser = async (IDUser, IDMission) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Verificar si el usuario ya completó esta misión
    const [existingMission] = await connection.execute(
      "SELECT * FROM userMissions WHERE IDUser = ? AND IDMission = ?",
      [IDUser, IDMission]
    );

    if (existingMission.length > 0) {
      throw new Error("El usuario ya completó esta misión");
    }

    // 2. Verificar que la misión existe y obtener su experiencia
    const [mission] = await connection.execute(
      "SELECT experience, available FROM mission WHERE IDMission = ?",
      [IDMission]
    );

    if (mission.length === 0) {
      throw new Error("La misión no existe");
    }

    if (!mission[0].available) {
      throw new Error("La misión no está disponible");
    }

    // 3. Verificar que el usuario existe
    const [user] = await connection.execute(
      "SELECT IDUser, coins FROM user WHERE IDUser = ?",
      [IDUser]
    );

    if (user.length === 0) {
      throw new Error("El usuario no existe");
    }

    // 4. Insertar registro en userMissions (status = 1 = completed)
    await connection.execute(
      "INSERT INTO userMissions (IDUser, IDMission, status) VALUES (?, ?, 1)",
      [IDUser, IDMission]
    );

    // 5. Obtener todas las rewards de la misión
    const [rewards] = await connection.execute(
      `SELECT r.IDReward, r.name, r.description, r.type, r.value
       FROM rewards r
       INNER JOIN missionRewards mr ON r.IDReward = mr.IDReward
       WHERE mr.IDMission = ? AND r.available = 1`,
      [IDMission]
    );

    // 6. Insertar rewards en userRewards y sumar coins si es monetary
    const userRewards = [];
    let totalCoinsAdded = 0;

    for (const reward of rewards) {
      try {
        // Insertar en userRewards
        const [insertResult] = await connection.execute(
          "INSERT INTO userRewards (IDUser, IDReward) VALUES (?, ?)",
          [IDUser, reward.IDReward]
        );
        
        userRewards.push({
          IDUserReward: insertResult.insertId,
          IDReward: reward.IDReward,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          value: reward.value
        });

        // Normalizar el tipo para comparación
        const rewardType = reward.type ? String(reward.type).trim().toLowerCase() : '';
        const rewardValue = parseInt(reward.value) || 0;

        // Si la recompensa es de tipo "monetary", sumar el value a las coins del usuario
        if (rewardType === "monetary" && rewardValue > 0) {
          await connection.execute(
            "UPDATE user SET coins = coins + ? WHERE IDUser = ?",
            [rewardValue, IDUser]
          );
          
          totalCoinsAdded += rewardValue;
        }

      } catch (rewardError) {
        // Si hay error (por ejemplo, reward duplicada), continúa con la siguiente
        continue;
      }
    }

    // 7. Verificar si el usuario tiene un árbol, si no, crearlo
    const [existingTree] = await connection.execute(
      "SELECT IDTree, level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    if (existingTree.length === 0) {
      await connection.execute(
        "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
        [IDUser, mission[0].experience]
      );
    } else {
      await connection.execute(
        "UPDATE tree SET level = level + ? WHERE IDUser = ?",
        [mission[0].experience, IDUser]
      );
    }

    // 8. Obtener el nuevo nivel del árbol
    const [updatedTree] = await connection.execute(
      "SELECT level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    // 9. Obtener las coins actualizadas del usuario
    const [updatedUser] = await connection.execute(
      "SELECT coins FROM user WHERE IDUser = ?",
      [IDUser]
    );

    await connection.commit();

    return {
      success: true,
      message: "Misión completada exitosamente",
      data: {
        IDMission,
        IDUser,
        experienceGained: mission[0].experience,
        newTreeLevel: updatedTree[0].level,
        rewardsObtained: userRewards,
        totalRewards: rewards.length,
        coinsAdded: totalCoinsAdded,
        currentCoins: updatedUser[0].coins
      }
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


module.exports = { getAllMissions,getUserMission, postCompleteMissionUser, getUserMissions };


