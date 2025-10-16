const express = require("express")
const router = express.Router()
const isAuth = require('../../util/is-auth');
const leaguesController = require("../../controllers/leagues/leagues.controller")

router.get("/", isAuth, leaguesController.getLeagues);

router.get("/add-league", isAuth, leaguesController.getAddLeague);

// Endpoint usado por el cliente para obtener el HTML del modal via fetch
router.get('/add-modal', isAuth, leaguesController.getAddLeagueModal);

router.get('/edit-modal', leaguesController.getEditLeagueModal);

router.post("/add", isAuth, leaguesController.postAddLeague);

router.post("/editName", isAuth, leaguesController.postEditLeagueName);
router.post("/editLevel", isAuth, leaguesController.postEditLeagueLevel);

router.post('/delete', isAuth, leaguesController.deleteLeague);

module.exports = router