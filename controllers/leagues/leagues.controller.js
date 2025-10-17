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

exports.postEditLeagueName = async (req, res) => {
    const { nameA, name } = req.body;
    try {
        await leaguesModel.cambiarNombreLiga(nameA, name);
        res.redirect('/leagues');
    } catch (err) {
        console.error('Error al cambiar nombre de liga:', err);
        res.status(500).send('Error al cambiar nombre de liga');
    }
};

exports.postEditLeagueLevel = async (req, res) => {
    const { nameA, lvl } = req.body;
    try {
        await leaguesModel.cambiarMinLevelLiga(nameA, parseInt(lvl, 10));
        res.redirect('/leagues');
    } catch (err) {
        console.error('Error al cambiar min level de liga:', err);
        res.status(500).send('Error al cambiar min level de liga');
    }
};

// Eliminar liga
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