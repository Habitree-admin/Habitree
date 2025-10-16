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
    WHERE u.IDUser = ?;
    `,
    [userId]
  );
  return rows;
};

const postCompleteMissionUser = async (IDUser, IDMission) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log(`Starting mission completion for User: ${IDUser}, Mission: ${IDMission}`);

    // 1. Verificar si el usuario ya completó esta misión
    const [existingMission] = await connection.execute(
      "SELECT * FROM userMissions WHERE IDUser = ? AND IDMission = ?",
      [IDUser, IDMission]
    );

    if (existingMission.length > 0) {
      throw new Error("El usuario ya completó esta misión");
    }
    console.log("✅ Mission not completed before");

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
    console.log("✅ Mission exists and is available");

    // 3. Verificar que el usuario existe
    const [user] = await connection.execute(
      "SELECT IDUser FROM user WHERE IDUser = ?",
      [IDUser]
    );

    if (user.length === 0) {
      throw new Error("El usuario no existe");
    }
    console.log("✅ User exists");

    // 4. Insertar registro en userMissions (status = 1 = completed)
    const [userMissionResult] = await connection.execute(
      "INSERT INTO userMissions (IDUser, IDMission, status) VALUES (?, ?, 1)",
      [IDUser, IDMission]
    );
    console.log("✅ UserMission inserted with ID:", userMissionResult.insertId);

    // 5. Obtener todas las rewards de la misión
    const [rewards] = await connection.execute(
      `SELECT r.IDReward, r.name, r.description, r.type, r.value
       FROM rewards r
       INNER JOIN missionRewards mr ON r.IDReward = mr.IDReward
       WHERE mr.IDMission = ? AND r.available = 1`,
      [IDMission]
    );
    console.log(`Found ${rewards.length} rewards for mission ${IDMission}`);

    // 6. Insertar rewards en userRewards para cada reward de la misión
    const userRewards = [];
    for (const reward of rewards) {
      try {
        const [insertResult] = await connection.execute(
          "INSERT INTO userRewards (IDUser, IDReward) VALUES (?, ?)",
          [IDUser, reward.IDReward]
        );
        
        console.log(`✅ Reward ${reward.IDReward} inserted with ID: ${insertResult.insertId}`);
        
        userRewards.push({
          IDUserReward: insertResult.insertId,
          IDReward: reward.IDReward,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          value: reward.value
        });
      } catch (rewardError) {
        // Si hay error (por ejemplo, reward duplicada), continúa con la siguiente
        console.log(`❌ Warning: Could not insert reward ${reward.IDReward} for user ${IDUser}:`, rewardError.message);
      }
    }

    // 7. Verificar si el usuario tiene un árbol, si no, crearlo
    const [existingTree] = await connection.execute(
      "SELECT IDTree, level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    if (existingTree.length === 0) {
      // Crear árbol inicial con la experiencia de la misión
      await connection.execute(
        "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
        [IDUser, mission[0].experience]
      );
      console.log("✅ New tree created for user");
    } else {
      // 8. Actualizar experiencia del árbol del usuario
      await connection.execute(
        "UPDATE tree SET level = level + ? WHERE IDUser = ?",
        [mission[0].experience, IDUser]
      );
      console.log("✅ Tree level updated");
    }

    // 9. Obtener el nuevo nivel del árbol
    const [updatedTree] = await connection.execute(
      "SELECT level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    await connection.commit();
    console.log("✅ Transaction committed successfully");

    // Retornar información de la misión completada
    return {
      success: true,
      message: "Misión completada exitosamente",
      data: {
        IDMission,
        IDUser,
        experienceGained: mission[0].experience,
        newTreeLevel: updatedTree[0].level,
        rewardsObtained: userRewards,
        totalRewards: rewards.length
      }
    };

  } catch (error) {
    await connection.rollback();
    console.log("❌ Transaction rolled back due to error:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};


module.exports = { getAllMissions,getUserMission, postCompleteMissionUser, getUserMissions };


