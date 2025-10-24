const quizzesService = require("../services/quizzes.service");

/**
 * This function gets all quizzes for a specific user
 * 
 * getQuizzes returns all quizzes by user, completed or not completed
 */
const getQuizzes = async (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = await quizzesService.getAllQuizzes(id);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining the quizzes",
      details: err.message,
    });
  }
};

/**
 * This function gets a quiz by ID
 * 
 * getQuiz returns all the data from a quiz by its ID, like its questions, and answers to those questions
 */
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

/**
 * This function marks a quiz as completed for a user
 * 
 * postCompleteQuiz returns the quiz was completed succesfully or unsuccessfully
 */
const postCompleteQuiz = async (req, res) => {
  try {
    const { IDQuiz, IDUser } = req.body;

    // check request body
    if (!IDQuiz || !IDUser) {
      return res.status(400).json({
        success: false,
        message: "IDQuiz and IDUser are required",
        data: null
      });
    }

    // error handling
    if (isNaN(IDQuiz) || isNaN(IDUser)) {
      return res.status(400).json({
        success: false,
        message: "IDQuiz and IDUser must be numbers",
        data: null
      });
    }

    const result = await quizzesService.postCompleteQuizUser(IDUser, IDQuiz);
    
    res.status(200).json(result);
    
  } catch (err) {
    let statusCode = 500;
    let message = "Internal server error";

    // Error handling
    if (err.message.includes("Quiz already completed")) {
      statusCode = 409; // Conflict
      message = err.message;
    } else if (err.message.includes("Quiz doesnt exist")) {
      statusCode = 404; // Not Found
      message = err.message;
    } else if (err.message.includes("Quiz not available")) {
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