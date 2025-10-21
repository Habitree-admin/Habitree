const express = require("express");
const router = express.Router();
const isAuth = require('../../util/is-auth');
const RewardController = require("../../controllers/Rewards/Rewards.controller");

// Obtener todas las recompensas
router.get("/", isAuth, RewardController.getRewards);

// Registrar nueva recompensa
router.post("/", isAuth, RewardController.postRewards);

// Obtener recompensa por ID (para ediciÃ³n)
router.get("/:id", isAuth, RewardController.getRewardById);

// Editar recompensa
router.post("/edit/:id", isAuth, RewardController.editReward);

// Eliminar recompensa
router.delete("/:id", isAuth, RewardController.deleteReward);

module.exports = router;