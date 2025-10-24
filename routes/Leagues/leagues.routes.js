const express = require("express")
const router = express.Router()
const isAuth = require('../../util/is-auth');
const leaguesController = require("../../controllers/leagues/leagues.controller")

router.get("/", isAuth, leaguesController.getLeagues);

router.get("/add-league", isAuth, leaguesController.getAddLeague);

// Endpoint usado por el cliente para obtener el HTML del modal via fetch
router.get('/add-modal', isAuth, leaguesController.getAddLeagueModal);

router.get('/edit-modal', isAuth, leaguesController.getEditLeagueModal);

router.post("/add", isAuth, leaguesController.postAddLeague);

// Route to edit the name of a league, Check the user credential with middlware isAuth and send to controller
router.post("/editName", isAuth, leaguesController.postEditLeagueName);

// Route to edit the level of a league, Check the user credential with middlware isAuth and send to controller
router.post("/editLevel", isAuth, leaguesController.postEditLeagueLevel);

/**
 * This is the route to delete the league
 */
router.post('/delete', isAuth, leaguesController.deleteLeague);

module.exports = router