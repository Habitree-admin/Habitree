const express = require('express');
const router = express.Router();
const ModifyRewardController = require('../../controllers/Rewards/MoodifyReward.controller');

// Obtener recompensa por ID (para cargar datos al modal)
router.get('/:id', ModifyRewardController.getRewardById);

// Editar recompensa existente
router.post('/edit/:id', ModifyRewardController.editReward);

module.exports = router;
