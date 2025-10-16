const express = require("express");
const router = express.Router();
const RewardController = require("../../controllers/Rewards/Rewards.controller");

// Obtener todas las recompensas
router.get("/", RewardController.getRewards);

// Registrar nueva recompensa
router.post("/", RewardController.postRewards);

// Obtener recompensa por ID (para ediciÃ³n)
router.get("/:id", RewardController.getRewardById);

// Editar recompensa
router.post("/edit/:id", RewardController.editReward);

// Eliminar recompensa
router.delete("/:id", RewardController.deleteReward);

module.exports = router;