const express = require("express");
const router = express.Router();
const { getUsers } = require("../controllers/users.controller");
const { getLogin } = require("../controllers/users.controller");
const { postSignup } = require("../controllers/users.controller");
const { getStats } = require("../controllers/users.controller");
const { editUser } = require("../controllers/users.controller");
const { changepasswd } = require("../controllers/users.controller");
const { getMissionsSummary } = require("../controllers/users.controller");
const { getUserRewards } = require("../controllers/users.controller");
const { getLoginGoogle } = require("../controllers/users.controller");
const { getLeaderboard } = require("../controllers/users.controller");
const { getInventory } = require("../controllers/users.controller");
const { useItem } = require("../controllers/users.controller");

// GET /api/users
router.get("/", getUsers);
router.post("/login", getLogin);
router.post("/login/google", getLoginGoogle);
router.get("/stats/:id", getStats);
router.post("/signup", postSignup)
router.put("/edit/:id", editUser);
router.patch("/changepasswd/:id", changepasswd)
router.get("/stats2/:id", getMissionsSummary)
router.get("/rewards/:id", getUserRewards)
router.get("/leaderboard", getLeaderboard)
router.get("/inventory/:id", getInventory)
router.post("/useitem", useItem);


module.exports = router;