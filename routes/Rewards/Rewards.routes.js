const express = require("express");
const router = express.Router();
const isAuth = require('../../util/is-auth');
const RewardController = require("../../controllers/Rewards/Rewards.controller");

// Collect all rewards
router.get("/", isAuth, RewardController.getRewards);

// Add a new reward
router.post("/", isAuth, RewardController.postRewards);

// Collect reward for ID(to edit)
router.get("/:id", isAuth, RewardController.getRewardById);

// Edit reward
router.post("/edit/:id", isAuth, RewardController.editReward);

// Erase reward
router.delete("/:id", isAuth, RewardController.deleteReward);

module.exports = router;