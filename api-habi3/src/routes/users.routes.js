const express = require("express");
const router = express.Router();
const { getUsers } = require("../controllers/users.controller");
const { getLoginJWT } = require("../controllers/users.controller");
const { postSignup } = require("../controllers/users.controller");
const { getStats } = require("../controllers/users.controller");
const { editUser } = require("../controllers/users.controller");
const { changepasswd } = require("../controllers/users.controller");
const { getMissionsSummary } = require("../controllers/users.controller");
const { getUserRewards } = require("../controllers/users.controller");
const { getLoginGoogleJWT } = require("../controllers/users.controller");
const { getLeaderboard } = require("../controllers/users.controller");
const { getInventory } = require("../controllers/users.controller");
const { useItem } = require("../controllers/users.controller");
const { refreshToken } = require("../controllers/users.controller");
const { logout } = require("../controllers/users.controller");
const { getActiveItem } = require("../controllers/users.controller");

// GET /api/users
router.get("/", getUsers);
router.post("/login", getLoginJWT);
router.post("/login/google", getLoginGoogleJWT);
router.post('/refresh-token', refreshToken);
router.get("/stats/:id", getStats);
router.post("/signup", postSignup)
router.put("/edit/:id", editUser);
router.patch("/changepasswd/:id", changepasswd)
router.get("/stats2/:id", getMissionsSummary)
router.get("/rewards/:id", getUserRewards)
router.get("/leaderboard", getLeaderboard)
router.get("/inventory/:id", getInventory)
router.post("/useitem", useItem);
router.post('/users/logout', logout);
router.get("/activeitem/:id", getActiveItem)


module.exports = router;