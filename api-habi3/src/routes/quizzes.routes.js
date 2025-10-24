const express = require("express");
const router = express.Router();
const { getQuizzes } = require("../controllers/quizzes.controller");
const { getQuiz } = require("../controllers/quizzes.controller");
const { postCompleteQuiz } = require("../controllers/quizzes.controller");
const authMiddleware = require('../utils/tokenmiddleware');

// GET /api/missions
router.get("/user/:id", authMiddleware, getQuizzes); //con id de usuario

router.get("/:id", authMiddleware, getQuiz); //con id de quiz

router.post("/complete",  authMiddleware, postCompleteQuiz);

module.exports = router;