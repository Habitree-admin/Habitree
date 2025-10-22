const db = require("../../../util/database");

/**
 * This function gets all available missions with the rewards related to the mission
 * 
 * getAllMissions returns all the missions with a left join to show the missions as completed or uncompleted for the user with their
 * related reward
 */
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
    WHERE m.available = 1
    ORDER BY m.IDMission, r.IDReward
    `,
    [userId]
  );

  // object to group missions
  const missionsMap = {};

  rows.forEach(row => {
    const missionId = row.IDMission;
    
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

    // adds rewards to the response
    if (row.IDReward) {
      
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
  
  return result;
};

/**
 * This function gets all user missions with their evidence and notifications
 * 
 * getUserMission returns completed missions by user
 */
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

/**
 * This function gets all missions from a user with its evidence and notification
 * 
 * getUserMissions returns user missions filtered by user ID including rewards, evidence and notification details
 */
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

/**
 * This function marks a mission as complete and makes all the changes required to complete a mission
 * such as adding the xp, and coins to the user, also giving the rewards to the user
 * 
 * postCompleteMissionUser returns if the mission got completed by the user and adds to the response how many xp and coins the user got, plus the rewards he got
 */
const postCompleteMissionUser = async (IDUser, IDMission) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // checks if user completed the mission
    const [existingMission] = await connection.execute(
      "SELECT * FROM userMissions WHERE IDUser = ? AND IDMission = ?",
      [IDUser, IDMission]
    );

    if (existingMission.length > 0) {
      throw new Error("The user aalready completed the mission");
    }

    // get the experience from the mission
    const [mission] = await connection.execute(
      "SELECT experience, available FROM mission WHERE IDMission = ?",
      [IDMission]
    );

    if (mission.length === 0) {
      throw new Error("the mission doesnt exists");
    }

    if (!mission[0].available) {
      throw new Error("Mission is not available");
    }

    // gets user coins
    const [user] = await connection.execute(
      "SELECT IDUser, coins FROM user WHERE IDUser = ?",
      [IDUser]
    );

    if (user.length === 0) {
      throw new Error("Cannot get user");
    }

    // Mark the mission as completed in userMissions (status = 1 === completed)
    await connection.execute(
      "INSERT INTO userMissions (IDUser, IDMission, status) VALUES (?, ?, 1)",
      [IDUser, IDMission]
    );

    // obtain all the rewards related to the mission
    const [rewards] = await connection.execute(
      `SELECT r.IDReward, r.name, r.description, r.type, r.value
       FROM rewards r
       INNER JOIN missionRewards mr ON r.IDReward = mr.IDReward
       WHERE mr.IDMission = ? AND r.available = 1`,
      [IDMission]
    );

    // update the rewards obtained from the mission to the userRewards table
    const userRewards = [];
    let totalCoinsAdded = 0;

    for (const reward of rewards) {
      try {

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

        const rewardType = reward.type ? String(reward.type).trim().toLowerCase() : '';
        const rewardValue = parseInt(reward.value) || 0;

        // if the reward is monetary adds the coins to the user
        if (rewardType === "monetary" && rewardValue > 0) {
          await connection.execute(
            "UPDATE user SET coins = coins + ? WHERE IDUser = ?",
            [rewardValue, IDUser]
          );
          
          totalCoinsAdded += rewardValue;
        }

      } catch (rewardError) {
        
        continue;
      }
    }

    // gets user tree
    const [existingTree] = await connection.execute(
      "SELECT IDTree, level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    // adds xp to user tree
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

    // get updated xp
    const [updatedTree] = await connection.execute(
      "SELECT level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    // get updated coins
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