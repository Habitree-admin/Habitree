const express = require("express");
const router = express.Router();
const IndicatorController = require("../../controllers/indicators/indicators.controller");

// Obtener todos los indicadores
router.get("/", IndicatorController.getIndicators);

module.exports = router;