// eslint-disable-next-line no-undef
const db = require('../../util/database');
// eslint-disable-next-line no-undef
module.exports = class notification {
    //Constructor of the class. It is used to create a new object, work with the properties of the model are defined
    constructor(IDNotification, dateCreated, description, category, isActive) {
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
    
    //Function to add a new notification using a title, message, channel and category from the form
    static add(titulo, mensaje, canal, category) {
        return db.execute(`INSERT INTO notification
            (dateCreated, titulo, description, canal, category, isActive)
            VALUES (NOW(), ?, ?, ?, ?, 1)`,
            [titulo, mensaje, canal, category]);
    }

    //Function to update the isActive status of a notification
    static updateIsActive(id, newIsActive) {
        return db.execute(`UPDATE notification
             SET isActive = ?
             WHERE idNotification = ?`,
            [newIsActive, id]);
    }
    
    //Function to update all the information of a notification
    static update(titulo, mensaje, canal, category, id) {
  return db.execute(
    `UPDATE notification
     SET titulo = ?, description = ?, canal = ?, category = ?
     WHERE idNotification = ?`,
    [titulo, mensaje, canal, category, id]
  );
}

    //Function to fetch a notification by the ID
    static fetchById(id) {
        return db.execute('SELECT * FROM notification WHERE IDNotification = ?', [id]);
    }
    
    //Function to create a new notification (updated with the new fields)
    static create(titulo, mensaje, canal, category) {
        return db.execute(
            'INSERT INTO notification (dateCreated, titulo, description, canal, category, isActive) VALUES (NOW(), ?, ?, ?, ?, 1)',
            [titulo, mensaje, canal, category]
        );
    }
}