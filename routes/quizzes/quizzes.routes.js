const express = require("express");
const router = express.Router();
const isAuth = require('../../util/is-auth');
const quizzesController = require("../../controllers/quizzes/quizzes.controller");

router.get("/quizzes", isAuth, quizzesController.getQuizzes);
router.post("/quizzes", isAuth, quizzesController.postAddQuiz);
router.delete('/quizzes/:id', isAuth, quizzesController.deleteQuiz);

module.exports = router;
