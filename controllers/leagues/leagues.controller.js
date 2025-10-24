const { League, createLeagueViaProcedure } = require('../../models/Leagues/leagues.model');
const db = require('../../util/database');
const { deleteLeagueByName } = require('../../models/Leagues/leagues.model');

exports.getLeagues = async (req, res) => {
    const leagues = await League.fetchAll();
    res.render('../views/Leagues/leagues.ejs', { title: 'Leagues', leagues, csrfToken: req.csrfToken()});
}

exports.getAddLeague = (req, res) => {
    res.render('Leagues/addLeague', { csrfToken: req.csrfToken() });
}

exports.getAddLeagueModal = (req, res) => {
    res.render('Leagues/addLeague', { csrfToken: req.csrfToken() });
}

exports.getEditLeagueModal = (req, res) => {
    console.log('GET /leagues/edit-modal', req.query);
    res.render('Leagues/editLeague', {
        csrfToken: req.csrfToken(),
        leagueName: req.query.name,
        leagueLevel: req.query.level
    });
};

/**
     * Adds a new league.
     *
     * Creates a league using values from the request:
     * - name: league name (string)
     * - lvl: league level as a trimmed string (rawLvl)
     */
exports.postAddLeague = async (req, res) => {
    console.log('POST /leagues/add body:', req.body);
    const { name, lvl } = req.body;
    const rawLvl = String(lvl ?? '').trim();
    const lvlNum = parseInt(rawLvl, 10);

    if (!name || rawLvl === '' || Number.isNaN(lvlNum)) {
        return res.status(400).send('Datos inválidos: name y lvl son requeridos');
    }

    try {
        await createLeagueViaProcedure({ name, lvl: lvlNum });
        return res.redirect('/leagues');
    } catch (err) {
        console.error('Error creando liga via procedure:', err.message || err);
        return res.status(500).send('Error interno al crear liga (ver logs)');
    }
};

const leaguesModel = require('../../models/Leagues/leagues.model');
/*
This funciton change the name of a league information 

    postEditLeagueName Change the name of an available league and call the process in models
    after this redirect to leagues page on the ejs view
*/
exports.postEditLeagueName = async (req, res) => {
    // Extract the current and new names the user put from the request body
    const { nameA, name } = req.body;
    try {
        // Call the model function to change name
        await leaguesModel.cambiarNombreLiga(nameA, name);
        // Redirect to leagues page
        res.redirect('/leagues');
    } catch (err) {
        // Log and send error 
        console.error('Error al cambiar nombre de liga:', err);
        res.status(500).send('Error al cambiar nombre de liga');
    }
};
/*

This funciton change the minimum level of a league information 

    postEditLeagueLevel Change the min level of an available league and call the process in models
    after this redirect to leagues page on the ejs view
*/
exports.postEditLeagueLevel = async (req, res) => {
    // Extract the current name and new min level the user put from the request body
    const { nameA, lvl } = req.body;
    try {
        // Call the model function to change min level
        await leaguesModel.cambiarMinLevelLiga(nameA, parseInt(lvl, 10));
        // Redirect to leagues page
        res.redirect('/leagues');
    } catch (err) {
        // Log and send error
        console.error('Error al cambiar min level de liga:', err);
        res.status(500).send('Error al cambiar min level de liga');
    }
};

/**
 * This function delete the league by its name information on the ejs view
 *
 *  deleteLeague Delete an available league and renderize it in the route
 */
exports.deleteLeague = async (req, res) => {
    const { leagueName } = req.body;

    if (!leagueName) {
        return res.status(400).json({ message: 'League name is required' });
    }

    try {
        const result = await deleteLeagueByName(leagueName);
        res.json(result);
    } catch (err) {
        console.error('Error deleting league:', err);
        res.status(500).json({ success: false, message: 'Error deleting league' });
    }
};