const db = require('../../util/database');

// Clase mission
module.exports = class Mission{

    constructor(IDMission,responseVerification,category,description,dateOfCreation,available,experience){

        this.IDMission = IDMission;
        this.responseVerification = responseVerification;
        this.category = category; 
        this.description = description; 
        this.dateOfCreation = dateOfCreation;
        this.available = available;
        this.experience = experience; 

    } 

//Guardar el registro de una mision 

    save(){
 
        const currentDate = new Date();
        return db.execute(
            'INSERT INTO mission (IDMission,responseVerification,category,description,dateOfCreation,available,experience) VALUES(?,?,?,?,?,?,?)',
            [this.IDMission, this.responseVerification, this.category, this.description, currentDate, this.available, this.experience]
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
            'UPDATE mission SET responseVerification=?, category=?, description=?, available=?, experience=? WHERE IDMission=?',
            [
                data.responseVerification,
                data.category,
                data.description,
                data.available,
                data.experience,
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


}
