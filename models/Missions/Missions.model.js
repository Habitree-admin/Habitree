const db = require('../../util/database');

// Clase mission
module.exports = class Mission{

    constructor(IDMission,responseVerification,category,description,dateOfCreation,available,experience,value){

        this.IDMission = IDMission;
        this.responseVerification = responseVerification;
        this.category = category; 
        this.description = description; 
        this.dateOfCreation = dateOfCreation;
        this.available = available;
        this.experience = experience; 
        this.value = value || 0;

    } 

//Guardar el registro de una mision 

    save(){
 
        const currentDate = new Date();
        return db.execute(
            'INSERT INTO mission (IDMission,responseVerification,category,description,dateOfCreation,available,experience,value) VALUES(?,?,?,?,?,?,?,?)',
            [this.IDMission, this.responseVerification, this.category, this.description, currentDate, this.available, this.experience, this.value]
        );
    }


    /**
     * Devuelve todas las misiones.
     * @returns {Promise}
     */
    static fetchAll() {
    // Solo misiones activas (borrado lógico)
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
