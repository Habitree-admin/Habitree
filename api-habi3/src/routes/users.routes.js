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
const authMiddleware = require('../utils/tokenmiddleware');

// GET /api/users
router.post("/login", getLoginJWT);
router.post("/login/google", getLoginGoogleJWT);
router.post('/refresh-token', refreshToken);
router.get("/stats/:id", authMiddleware, getStats);
router.post("/signup", postSignup)
router.put("/edit/:id", authMiddleware, editUser);
router.patch("/changepasswd/:id", authMiddleware,changepasswd)
router.get("/stats2/:id", authMiddleware, getMissionsSummary)
router.get("/rewards/:id", authMiddleware, getUserRewards)
router.get("/leaderboard", authMiddleware, getLeaderboard)
router.get("/inventory/:id", authMiddleware, getInventory)
router.post("/useitem", authMiddleware, useItem);
router.post('/users/logout', logout);
router.get("/activeitem/:id", authMiddleware, getActiveItem)


module.exports = router;