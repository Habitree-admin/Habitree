const express = require("express");
const router = express.Router();
const { getQuizzes } = require("../controllers/quizzes.controller");
const { getQuiz } = require("../controllers/quizzes.controller");
const { postCompleteQuiz } = require("../controllers/quizzes.controller");

// GET /api/missions
router.get("/user/:id", getQuizzes); //con id de usuario

router.get("/:id", getQuiz); //con id de quiz

router.post("/complete", postCompleteQuiz);

module.exports = router;