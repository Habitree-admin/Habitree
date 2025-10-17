const shopService = require("../services/shop.service");

const getShopItemsForUser = async (req, res) => {
  try {
    const { id } = req.params;

    const items = await shopService.getShopItemsForUser(id);

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error("❌ Error in getShopItemsForUser:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching shop items"
    });
  }
};

const buyShopItem = async (req, res) => {
  try {
    const { IDUser, IDItem } = req.body;

    if (!IDUser || !IDItem) {
      return res.status(400).json({
        success: false,
        message: "IDUser and IDItem are required"
      });
    }

    const result = await shopService.buyShopItemForUser(IDUser, IDItem);

    res.status(201).json({
      success: true,
      message: "Item purchased successfully",
      data: result
    });
  } catch (error) {
    console.error("Error in buyShopItem:", error);
    res.status(500).json({
      success: false,
      message: "Error purchasing item"
    });
  }
};

module.exports = { getShopItemsForUser, buyShopItem };