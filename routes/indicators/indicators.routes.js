const express = require("express");
const router = express.Router();
const IndicatorController = require("../../controllers/indicators/indicators.controller");

/**
 Collect all indicators
*/
router.get("/", IndicatorController.getIndicators);

module.exports = router;