const express = require("express");
const router = express.Router();
const { getShopItemsForUser } = require("../controllers/shop.controller");
const { buyShopItem } = require("../controllers/shop.controller");
const authMiddleware = require('../utils/tokenmiddleware');

// GET /api/users
router.get("/:id", authMiddleware, getShopItemsForUser );
router.post("/buy", authMiddleware, buyShopItem)


module.exports = router;