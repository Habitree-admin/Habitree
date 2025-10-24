const express = require('express');
const router = express.Router();
const isAuth = require('../../util/is-auth');
const ModifyRewardController = require('../../controllers/Rewards/MoodifyReward.controller');


/**
Collect reward for ID (to load data into modal)
*/

router.get('/:id', isAuth, ModifyRewardController.getRewardById);

/**
Edit existing reward
*/
router.post('/edit/:id', isAuth, ModifyRewardController.editReward);

module.exports = router;
