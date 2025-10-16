const express = require("express");
const router = express.Router();
const { getShopItemsForUser } = require("../controllers/shop.controller");
const { buyShopItem } = require("../controllers/shop.controller");
// GET /api/users
router.get("/:id", getShopItemsForUser );
router.post("/buy", buyShopItem)


module.exports = router;