// eslint-disable-next-line no-undef
const db = require('../../util/database');
// eslint-disable-next-line no-undef
module.exports = class notification {
    
    /**
     
    This function allows creating notification model instances to handle notification data in the application
    
    Constructor initializes notification object with ID, creation date, description, category and active status properties
    *
     */
    
    // constructor to create notification object with all required properties
    constructor(IDNotification, dateCreated, description, category, isActive) {
        this.IDNotification = IDNotification;
        this.dateCreated = dateCreated;
        this.description = description;
        this.category = category;
        this.isActive = isActive;
    }
    
    /**
     
    This function allows retrieving all notifications from database to display in the administrative panel
    
    fetchAll executes SQL query to retrieve all notification records from database
    *
     */
    
    // get all notifications from database
    static fetchAll() {
        return db.execute('SELECT * FROM notification');
    }
    
    /**
     
    This function allows saving new notifications to database from the web panel form
    
    add executes INSERT SQL query to save notification with title, message, channel and category to database
    *
     */
    
    // to save new notification to database from form data
    static add(titulo, mensaje, canal, category) {
        return db.execute(`INSERT INTO notification
            (dateCreated, titulo, description, canal, category, isActive)
            VALUES (NOW(), ?, ?, ?, ?, 1)`,
            [titulo, mensaje, canal, category]);
    }
    
    /**
     
    This function allows activating or deactivating notifications from the administrative panel
    
    updateIsActive executes UPDATE SQL query to change notification active status by ID
    *
     */
    
    // update notification active status by ID
    static updateIsActive(id, newIsActive) {
        return db.execute(`UPDATE notification
             SET isActive = ?
             WHERE idNotification = ?`,
            [newIsActive, id]);
    }
    
    /**
     
    This function allows updating existing notification data from the edit panel
    
    update executes UPDATE SQL query to modify notification title, description, channel and category by ID
    *
     */
    
    // update notification data by ID
    static update(titulo, mensaje, canal, category, id) {
  return db.execute(
    `UPDATE notification
     SET titulo = ?, description = ?, canal = ?, category = ?
     WHERE idNotification = ?`,
    [titulo, mensaje, canal, category, id]
  );
}

    
    /**
     
    This function allows retrieving a specific notification to display in the edit form
    
    fetchById executes SELECT SQL query to retrieve single notification record by ID
    *
     */
    
    // get single notification by ID
    static fetchById(id) {
        return db.execute('SELECT * FROM notification WHERE IDNotification = ?', [id]);
    }
    
    /**
     
    This function allows creating and saving complete notifications to database for later sending
    
    create executes INSERT SQL query to store complete notification data with automatic timestamp and active status
    *
     */
    
    // create complete notification with automatic timestamp and active status
    static create(titulo, mensaje, canal, category) {
        return db.execute(
            'INSERT INTO notification (dateCreated, titulo, description, canal, category, isActive) VALUES (NOW(), ?, ?, ?, ?, 1)',
            [titulo, mensaje, canal, category]
        );
    }
}