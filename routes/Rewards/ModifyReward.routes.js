const express = require('express');
const router = express.Router();
const isAuth = require('../../util/is-auth');
const ModifyRewardController = require('../../controllers/Rewards/MoodifyReward.controller');

// Obtener recompensa por ID (para cargar datos al modal)
router.get('/:id', isAuth, ModifyRewardController.getRewardById);

// Editar recompensa existente
router.post('/edit/:id', isAuth, ModifyRewardController.editReward);

module.exports = router;
