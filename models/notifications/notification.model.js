// eslint-disable-next-line no-undef
const db = require('../../util/database');

// eslint-disable-next-line no-undef
module.exports = class notification {

    //Constructor de la clase. Sirve para crear un nuevo objeto, y en él se definen las propiedades del modelo
    constructor(IDNotification ,dateCreated,description,category,isActive) {
        this.IDNotification = IDNotification;
        this.dateCreated = dateCreated;
        this.description = description;
        this.category = category;
        this.isActive = isActive;
        
    }


    /**
     * Retrieves all notifications from the database.
     */
    static fetchAll() {
        return db.execute('SELECT * FROM notification');
    }

    //Funcion para añadir una nueva notificación tomando la descripción y categoria del formulario
    static add(description, category) {
        return db.execute(`INSERT INTO notification 
            (dateCreated, description, category, isActive)
            VALUES (NOW(), ?,?, 1)`, 
            [description, category]);
    }

    static updateIsActive(id,newIsActive) {
        return db.execute(`UPDATE notification
             SET isActive = ?
             WHERE idNotification = ?`
            ,[newIsActive,id]);
    }

    static update(description,category,id) {
        return db.execute(`UPDATE notification
             SET description = ?, category = ?
             WHERE idNotification = ?`
            ,[description,category,id]);
    }

    static fetchById(id) {
        return db.execute('SELECT * FROM notification WHERE IDNotification = ?',[id]);
    }

    // Método para crear una nueva notificación
    static create(description, category) {
        return db.execute(
            'INSERT INTO notification (description, category, dateCreated, isActive) VALUES (?, ?, NOW(), 1)',
            [description, category]
        );
    }
}