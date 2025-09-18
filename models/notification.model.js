// eslint-disable-next-line no-undef
const db = require('../util/database');

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



    //Este método servirá para devolver los objetos del almacenamiento persistente.
    static fetchAll() {
        return db.execute('SELECT * FROM notification');
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
}