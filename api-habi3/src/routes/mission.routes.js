const express = require("express");
const router = express.Router();
const { getMissions } = require("../controllers/mission.controller");
const { getUserMissions } = require("../controllers/mission.controller");
const { getUserMission } = require("../controllers/mission.controller");
const { postCompleteMission } = require("../controllers/mission.controller");

// GET /api/missions
router.get("/:id", getMissions);

//GET /api/userMissions

router.get("/user", getUserMission );
router.get("/user/:id", getUserMissions);
router.post("/complete", postCompleteMission);


module.exports = router;