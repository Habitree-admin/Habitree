const Notification = require('../../models/notifications/notification.model');
const { sendNotificationToTopic } = require('../../util/fcm');

/**

this function allows administrators to view all created notifications in the web panel of the application

getNotifications retrieves all notifications from database and renders them in the administrative panel view
*
 */

/**
 * Retrieves all notifications from the database and renders the notifications view.
 */
exports.getNotifications = async (req, res) => {
    
    // fetch all notifications from database
    const notifications = await Notification.fetchAll();
    
    // render notifications view with data and CSRF token
    res.render('notifications/notifications', { 
        title: 'Notifications', 
        notifications,
        csrfToken: req.csrfToken()
    });
};

/**
 
This function displays the form to create new notifications from the web panel of the application

getAddNotification renders the add notification form view with CSRF token
*
 */

exports.getAddNotification = (req, res) => {

    // render add notification form with CSRF token for security
    res.render('notifications/addNotifications', { csrfToken: req.csrfToken() });
}


/**
 
This function allows sending instant push notifications to users by channel without saving to database

sendPushNotification sends notifications directly via Firebase FCM by topic without persistence
*
 */

// send instant push notification via FCM topic
exports.sendPushNotification = async (req, res) => {
    
    // extract notification data from request body
    const { canal, titulo, mensaje } = req.body;
    try {
        
        // send notification via Firebase FCM topic
        await sendNotificationToTopic(canal, titulo, mensaje);
        
        // return success response
        res.status(200).json({ success: true, message: 'Notificación enviada por canal' });
    } catch (err) {
        console.error('Error al enviar push:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};


/**
 
This function allows creating and sending complete notifications from the web panel saving them to database

createNotification saves notification to database and sends it via Firebase FCM by topic
*
 */

// create notification in database and send via FCM
exports.createNotification = async (req, res) => {
    
    // extract notification data from request body
    const { canal, titulo, mensaje, category } = req.body;
    try {
        
        // save notification to database with all fields
        await Notification.create(titulo, mensaje, canal, category);
        console.log('Success: Notification created in database');
        
        // send notification via Firebase FCM topic
        await sendNotificationToTopic(canal, titulo, mensaje);
        console.log('Success: Notification sent via FCM');
        
        // redirect to notifications list
        res.redirect('/notifications');
    } catch (err) {
        console.error('Error al crear/enviar notificación:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 
 * This function bring and show the information of a notification
 * 
 * getNotificationEditor handles GET requests to show de pop-up
 */
exports.getNotificationEditor = async (req, res) => {
    const { id } = req.params;

    try {
        // Consult in the DB the selected notification
        const [rows] = await Notification.fetchById(id);

        if (!rows || rows.length === 0) {
            return res.status(404).send("Notificación no encontrada");
        }

        const notification = rows[0];

        // Pass all fields from de DB to the view
        res.render('notifications/editNotifications', {
            id: notification.IDNotification,
            titulo: notification.titulo,
            description: notification.description,
            canal: notification.canal,
            category: notification.category,
            isActive: notification.isActive ? 'Sí' : 'No',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener datos de la notificación");
    }
};

/**
 
This function processes the create notification form and saves them to database without sending

postAddNotification handles post from form to create notifications only in database
*
 */

exports.postAddNotification = async (req, res) => {
    // extract notification data from form submission
    const { titulo, mensaje, canal, category } = req.body;
    try {

        // save notification to database only (no FCM sending)
        await Notification.add(titulo, mensaje, canal, category);
        
        // Redirect to notifications list
        res.redirect('/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al agregar la notificación");
    }
};


/**
 * 
 * This function deactivate an active notification
 * 
 * postDelete handles POST requests to update de DB
 */
exports.postDelete = (req, res) => {
    const { id, currentState } = req.body;

    // If the current state is 'deactivate', change it to 0.
    // If the current state is 'activate', change it to 1.
    const newIsActive = currentState === 'deactivate' ? 0 : 1;

    try {
        // Call the model function with the new state
        Notification.updateIsActive(id, newIsActive);
        
        // Reditect to notifications page after successful changes
        res.redirect('/notifications');
        
        console.log(`Success: Notificación ${id} actualizada a isActive = ${newIsActive}`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar la notificación");
    }
};


/**
 * 
 * This function update an notification
 * 
 * postUpdate handles POST requests to update the notification content
 */
exports.postUpdate = async (req, res) => {
    // Extract the content  sent by the view
  const { id, canal, titulo, mensaje, category } = req.body;
  try {
    // Update the notificication content with the new one
    await Notification.update(titulo, mensaje, canal, category, id);
    console.log("Success update");  

    // Send the notification with the changes 
    await sendNotificationToTopic(canal, titulo, mensaje);
    console.log("Success: Notificación enviada por FCM");

    // Redirect the user after processing de changes
    res.redirect('/notifications');
  } catch (error) {
    console.error("Error al actualizar la notificación:", error);
    res.status(500).send("Error al actualizar la notificación");
  }
};
