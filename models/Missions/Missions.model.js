const db = require('../../util/database');

// Clase mission
module.exports = class Mission{

    constructor(responseVerification,category,description,dateOfCreation,available,experience,value){

        this.responseVerification = responseVerification;
        this.category = category; 
        this.description = description; 
        this.dateOfCreation = dateOfCreation;
        this.available = available;
        this.experience = experience; 
        this.value = value || 0;

    } 

/**
 * This function allows the application to save new missions for the users.
 *
 * This function is responsible for storing a new mission record in the database
 * 
 */

    save(){
 
        const currentDate = new Date();

        // Runs a SQL query against the database
        return db.execute(

        //It inserts the values of the mission instance into the mission table.
            'INSERT INTO mission (responseVerification,category,description,dateOfCreation,available,experience,value) VALUES(?,?,?,?,?,?,?)',
            [ this.responseVerification, this.category, this.description, currentDate, this.available, this.experience, this.value]
        );
    }


    /**
     * Retrieves all available missions from the database.
     * Only missions with available = 1 are returned.
     */
    static fetchAll() {
    return db.execute('SELECT * FROM mission WHERE available=1');
    }

    /**
     * Devuelve una misión por su ID.
     * @param {number} id
     * @returns {Promise}
     */
    static fetchById(id) {
        return db.execute('SELECT * FROM mission WHERE IDMission = ?', [id]);
    }

    /**
     * Actualiza una misión existente.
     * @param {number} id
     * @param {object} data
     * @returns {Promise}
     */
    static update(id, data) {
        if (Object.keys(data).length === 1 && data.available !== undefined) {
            return db.execute(
                'UPDATE mission SET available=? WHERE IDMission=?',
                [data.available, id]
            );
        }
        // Actualización normal de misión
        return db.execute(
            'UPDATE mission SET responseVerification=?, category=?, description=?, available=?, experience=?, value=? WHERE IDMission=?',
            [
                data.responseVerification,
                data.category,
                data.description,
                data.available,
                data.experience,
                data.value || 0,
                id
            ]
        );
    }

    /**
     * Elimina una misión por su ID.
     */
    static deleteMissionById(id) {
    return db.execute('DELETE FROM mission WHERE IDMission = ?', [id]);
    }

    /**
     * Asigna una recompensa a una misión (inserta en missionRewards)
     * Si ya existiera una relación, eliminará las previas y añadirá la nueva (comportamiento simple uno-a-uno).
     * @param {number} missionId
     * @param {number} rewardId
     * @returns {Promise}
     */
    static async setRewardForMission(missionId, rewardId) {
        // Borrar relaciones previas
        await db.execute('DELETE FROM missionRewards WHERE IDMission = ?', [missionId]);
        // Si rewardId es falsy (null/undefined/0), no insertar
        if (!rewardId) {
            return Promise.resolve();
        }
        return db.execute('INSERT INTO missionRewards (IDMission, IDReward) VALUES(?,?)', [missionId, rewardId]);
    }


}
