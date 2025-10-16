const db = require("../../../util/database");

const getAllQuizzes = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT 
        q.IDQuiz,
        q.responseVerification,
        q.category,
        q.description AS quizDescription,
        q.dateOfCreation,
        q.available,
        q.experience,
        uq.status AS userStatus,

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
        ir.extraCoins AS impactExtraCoins,

        ques.IDQuestion,
        ques.question,
        ques.answer,
        ques.wrongAnswers

    FROM quiz q
    LEFT JOIN userQuizzes uq 
        ON q.IDQuiz = uq.IDQuiz AND uq.IDUser = ?
    LEFT JOIN quizRewards qr 
        ON q.IDQuiz = qr.IDQuiz
    LEFT JOIN rewards r 
        ON qr.IDReward = r.IDReward
    LEFT JOIN monetaryReward mon 
        ON r.IDReward = mon.IDReward
    LEFT JOIN statusReward sr 
        ON r.IDReward = sr.IDReward
    LEFT JOIN boostReward br 
        ON r.IDReward = br.IDReward
    LEFT JOIN impactReward ir 
        ON r.IDReward = ir.IDReward
    LEFT JOIN question ques
        ON q.IDQuiz = ques.IDQuiz
    ORDER BY q.IDQuiz, r.IDReward, ques.IDQuestion
    `,
    [userId]
  );

  const quizzesMap = {};

  rows.forEach(row => {
    const quizId = row.IDQuiz;
    
    if (!quizzesMap[quizId]) {
      quizzesMap[quizId] = {
        IDQuiz: row.IDQuiz,
        responseVerification: row.responseVerification,
        category: row.category,
        quizDescription: row.quizDescription,
        dateOfCreation: row.dateOfCreation,
        available: row.available,
        experience: row.experience,
        isCompleted: row.userStatus || 0,
        rewards: [],
        questions: []
      };
    }

    if (row.IDReward) {
      const existingReward = quizzesMap[quizId].rewards.find(r => r.IDReward === row.IDReward);
      
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

        quizzesMap[quizId].rewards.push(reward);
      }
    }

    // Agregar preguntas con wrongAnswers
    if (row.IDQuestion) {
      const existingQuestion = quizzesMap[quizId].questions.find(q => q.IDQuestion === row.IDQuestion);
      
      if (!existingQuestion) {
        const question = {
          IDQuestion: row.IDQuestion,
          question: row.question,
          answer: row.answer,
          wrongAnswers: row.wrongAnswers
        };

        quizzesMap[quizId].questions.push(question);
      }
    }
  });

  return Object.values(quizzesMap);
};

// Obtener UN quiz específico con sus preguntas (para resolverlo)
const getQuizById = async (quizId) => {
  const [rows] = await db.execute(
    `
    SELECT 
        q.IDQuiz,
        q.responseVerification,
        q.category,
        q.description AS quizDescription,
        q.dateOfCreation,
        q.available,
        q.experience,

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
        ir.extraCoins AS impactExtraCoins,

        ques.IDQuestion,
        ques.question,
        ques.answer,
        ques.wrongAnswers

    FROM quiz q
    LEFT JOIN quizRewards qr 
        ON q.IDQuiz = qr.IDQuiz
    LEFT JOIN rewards r 
        ON qr.IDReward = r.IDReward
    LEFT JOIN monetaryReward mon 
        ON r.IDReward = mon.IDReward
    LEFT JOIN statusReward sr 
        ON r.IDReward = sr.IDReward
    LEFT JOIN boostReward br 
        ON r.IDReward = br.IDReward
    LEFT JOIN impactReward ir 
        ON r.IDReward = ir.IDReward
    LEFT JOIN question ques
        ON q.IDQuiz = ques.IDQuiz
    WHERE q.IDQuiz = ?
    ORDER BY r.IDReward, ques.IDQuestion
    `,
    [quizId]
  );

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  
  const quiz = {
    IDQuiz: firstRow.IDQuiz,
    responseVerification: firstRow.responseVerification,
    category: firstRow.category,
    quizDescription: firstRow.quizDescription,
    dateOfCreation: firstRow.dateOfCreation,
    available: firstRow.available,
    experience: firstRow.experience,
    rewards: [],
    questions: []
  };

  rows.forEach(row => {
    if (row.IDReward) {
      const existingReward = quiz.rewards.find(r => r.IDReward === row.IDReward);
      
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

        quiz.rewards.push(reward);
      }
    }

    if (row.IDQuestion) {
      const existingQuestion = quiz.questions.find(q => q.IDQuestion === row.IDQuestion);
      
      if (!existingQuestion) {
        const question = {
          IDQuestion: row.IDQuestion,
          question: row.question,
          answer: row.answer,
          wrongAnswers: row.wrongAnswers
        };

        quiz.questions.push(question);
      }
    }
  });

  return quiz;
};

const postCompleteQuizUser = async (IDUser, IDQuiz) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`Starting quiz completion for User: ${IDUser}, Quiz: ${IDQuiz}`);

    // 1. Verificar si el usuario ya completó este quiz
    const [existingQuiz] = await connection.execute(
      "SELECT * FROM userQuizzes WHERE IDUser = ? AND IDQuiz = ?",
      [IDUser, IDQuiz]
    );

    if (existingQuiz.length > 0) {
      throw new Error("El usuario ya completó este quiz");
    }
    console.log("✅ Quiz not completed before");

    // 2. Verificar que el quiz existe y obtener su experiencia
    const [quiz] = await connection.execute(
      "SELECT experience, available FROM quiz WHERE IDQuiz = ?",
      [IDQuiz]
    );

    if (quiz.length === 0) {
      throw new Error("El quiz no existe");
    }

    if (!quiz[0].available) {
      throw new Error("El quiz no está disponible");
    }
    console.log("✅ Quiz exists and is available");

    // 3. Verificar que el usuario existe
    const [user] = await connection.execute(
      "SELECT IDUser FROM user WHERE IDUser = ?",
      [IDUser]
    );

    if (user.length === 0) {
      throw new Error("El usuario no existe");
    }
    console.log("✅ User exists");

    // 4. Insertar registro en userQuizzes (status = 1 = completed)
    const [userQuizResult] = await connection.execute(
      "INSERT INTO userQuizzes (IDUser, IDQuiz, status) VALUES (?, ?, 1)",
      [IDUser, IDQuiz]
    );
    console.log("✅ UserQuiz inserted with ID:", userQuizResult.insertId);

    // 5. Obtener todas las rewards del quiz
    const [rewards] = await connection.execute(
      `SELECT r.IDReward, r.name, r.description, r.type, r.value
       FROM rewards r
       INNER JOIN quizRewards qr ON r.IDReward = qr.IDReward
       WHERE qr.IDQuiz = ? AND r.available = 1`,
      [IDQuiz]
    );
    console.log(`Found ${rewards.length} rewards for quiz ${IDQuiz}`);

    // 6. Insertar rewards en userRewards
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
        console.log(`❌ Warning: Could not insert reward ${reward.IDReward} for user ${IDUser}:`, rewardError.message);
      }
    }

    // 7. Verificar si el usuario tiene un árbol, si no, crearlo
    const [existingTree] = await connection.execute(
      "SELECT IDTree, level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    if (existingTree.length === 0) {
      // Crear árbol inicial con la experiencia del quiz
      await connection.execute(
        "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
        [IDUser, quiz[0].experience]
      );
      console.log("✅ New tree created for user");
    } else {
      // 8. Actualizar experiencia del árbol
      await connection.execute(
        "UPDATE tree SET level = level + ? WHERE IDUser = ?",
        [quiz[0].experience, IDUser]
      );
      console.log("✅ Tree level updated");
    }

    // 9. Obtener nuevo nivel del árbol
    const [updatedTree] = await connection.execute(
      "SELECT level FROM tree WHERE IDUser = ?",
      [IDUser]
    );

    await connection.commit();
    console.log("✅ Transaction committed successfully");

    return {
      success: true,
      message: "Quiz completado exitosamente",
      data: {
        IDQuiz,
        IDUser,
        experienceGained: quiz[0].experience,
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


module.exports = { getAllQuizzes, getQuizById, postCompleteQuizUser};


