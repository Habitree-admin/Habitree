// leagues.model.js
// eslint-disable-next-line no-undef
const db = require('../../util/database');


/**
 * Creates a league
 * 
 * Calls a procedure in the dataBase, creates a new league and reorganizes the users
 * 
 */
async function createLeagueViaProcedure({ name, lvl}, connection) {
    const procName = 'InsertarLiga'; 
    const params = [name, lvl];
    try {
        if (connection) {
            const [result] = await connection.execute(`CALL ${procName}(?, ?)`, params);
            return result;
        } else {
            const [result] = await db.execute(`CALL ${procName}(?, ?)`, params);
            return result;
        }
    } catch (err) {
        throw err;
    }
}


/**
 * This function returns all registered leagues
 *
 * @class League
 * @typedef {League}
 */
class League {
    constructor(ID_league, league, min_level){
        this.ID_league = ID_league;
        this.league = league;
        this.min_level = min_level; 
    } 

  
    static fetchAll() {
        return db.execute('SELECT * FROM Leagues');
    }
}

async function cambiarNombreLiga(nombre_actual, nombre_nuevo) {
    return db.execute('CALL CambiarNombreLiga(?, ?)', [nombre_actual, nombre_nuevo]);
}

async function cambiarMinLevelLiga(nombre_liga, nuevo_min_level) {
    return db.execute('CALL CambiarMinLevelLiga(?, ?)', [nombre_liga, nuevo_min_level]);
}

/**
 *
 * This function allows the user to delete a league available in the database
 *
 * This function calls a procedure on the data base that uses the league name
 *
 */
async function deleteLeagueByName(leagueName) {
    try {
        const [rows] = await db.query(`CALL EliminarLigaCompleta(?)`, [leagueName]);

        if (Array.isArray(rows) && rows[0] && rows[0][0] && rows[0][0].mensaje) {
            return { success: true, message: rows[0][0].mensaje };
        }

        return { success: true, message: 'League deleted successfully' };
    } catch (err) {
        console.error("Error en deleteLeagueByName:", err);
        throw err;
    }
}

module.exports = {
    League,
    createLeagueViaProcedure,
    cambiarNombreLiga,
    cambiarMinLevelLiga,
    deleteLeagueByName
};

