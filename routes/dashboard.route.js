const express = require("express")
const router = express.Router()
const isAuth = require('../util/is-auth');
const dashboardController = require("../controllers/dashboard.controller")



router.get("/", isAuth, dashboardController.getDashboard)

module.exports = router
