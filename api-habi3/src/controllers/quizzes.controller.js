const quizzesService = require("../services/quizzes.service");

const getQuizzes = async (req, res) => {
  try {
    const { id } = req.params;; // ejemplo: leer de query
    const quizzes = await quizzesService.getAllQuizzes(id);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining the quizzes",
      details: err.message,
    });
  }
};

const getQuiz = async (req, res) => {
  try {
    const { id } = req.params; // quizId
    const quiz = await quizzesService.getQuizById(id);
    
    if (!quiz) {
      return res.status(404).json({
        error: "Quiz not found"
      });
    }
    
    res.json(quiz);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining the quiz",
      details: err.message,
    });
  }
};

const postCompleteQuiz = async (req, res) => {
  try {
    const { IDQuiz, IDUser } = req.body;

    // Validar que se enviaron los campos requeridos
    if (!IDQuiz || !IDUser) {
      return res.status(400).json({
        success: false,
        message: "IDQuiz e IDUser son requeridos",
        data: null
      });
    }

    // Validar que son números válidos
    if (isNaN(IDQuiz) || isNaN(IDUser)) {
      return res.status(400).json({
        success: false,
        message: "IDQuiz e IDUser deben ser números válidos",
        data: null
      });
    }

    const result = await quizzesService.postCompleteQuizUser(IDUser, IDQuiz);
    
    res.status(200).json(result);
    
  } catch (err) {
    let statusCode = 500;
    let message = "Error interno del servidor";

    // Manejar errores específicos
    if (err.message.includes("ya completó este quiz")) {
      statusCode = 409; // Conflict
      message = err.message;
    } else if (err.message.includes("no existe")) {
      statusCode = 404; // Not Found
      message = err.message;
    } else if (err.message.includes("no está disponible")) {
      statusCode = 400; // Bad Request
      message = err.message;
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      data: null
    });
  }
};



module.exports = {getQuizzes, getQuiz, postCompleteQuiz};