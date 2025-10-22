const Notification = require('../../models/notifications/notification.model');
const { sendNotificationToTopic } = require('../../util/fcm');


/**
 * Retrieves all notifications from the database and renders the notifications view.
 */
exports.getNotifications = async (req, res) => {
    const notifications = await Notification.fetchAll();
    res.render('notifications/notifications', { 
        title: 'Notifications', 
        notifications,
        csrfToken: req.csrfToken()
    });
};

// Gets the add notification modal
exports.getAddNotification = (req, res) => {
    //Render the view for adding a new notification
    //Save the CSRF token to include it in the form for security
    res.render('notifications/addNotifications', { csrfToken: req.csrfToken() });
}


//New endpoint to send notification by channel (topic)
exports.sendPushNotification = async (req, res) => {
    const { canal, titulo, mensaje } = req.body;
    try {
        // Send the notification by FCM topic
        await sendNotificationToTopic(canal, titulo, mensaje);
        res.status(200).json({ success: true, message: 'Notificación enviada por canal' });
    } catch (err) {
        console.error('Error al enviar push:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};


// Make the notification in the database and send it
exports.createNotification = async (req, res) => {
    const { canal, titulo, mensaje, category } = req.body;
    try {
        // Save the notification in the database with the new fields
        await Notification.create(titulo, mensaje, canal, category);
        console.log('Success: Notificación creada en la base de datos');

        // Send the notification
        await sendNotificationToTopic(canal, titulo, mensaje);
        console.log('Success: Notificación enviada por FCM');

        // Redirect to the notifications list
        res.redirect('/notifications');
    } catch (err) {
        console.error('Error al crear/enviar notificación:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getNotificationEditor = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await Notification.fetchById(id);

        if (!rows || rows.length === 0) {
            return res.status(404).send("Notificación no encontrada");
        }

        const notification = rows[0];

        // Pass all fields including title and channel
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

// Make the POST request to add a new notification
exports.postAddNotification = async (req, res) => {
    const { titulo, mensaje, canal, category } = req.body;
    try {
        // Call the model function with the new fields
        await Notification.add(titulo, mensaje, canal, category);
        // Redirect to the notifications list
        res.redirect('/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al agregar la notificación");
    }
};

exports.postDelete = (req, res) => {
    const { id, currentState } = req.body;

    // If the current state is 'deactivate' (i.e., it is active), change it to 0.
    // If the current state is 'activate' (i.e., it is inactive), change it to 1.
    const newIsActive = currentState === 'deactivate' ? 0 : 1;

    try {
        // Call the model function with the new numeric value
        Notification.updateIsActive(id, newIsActive);
        
        res.redirect('/notifications');
        
        console.log(`Success: Notificación ${id} actualizada a isActive = ${newIsActive}`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar la notificación");
    }
};

exports.postUpdate = async (req, res) => {
  const { id, canal, titulo, mensaje, category } = req.body;
  try {
    await Notification.update(titulo, mensaje, canal, category, id);
    console.log("Success update");

    await sendNotificationToTopic(canal, titulo, mensaje);
    console.log("Success: Notificación enviada por FCM");

    res.redirect('/notifications');
  } catch (error) {
    console.error("Error al actualizar la notificación:", error);
    res.status(500).send("Error al actualizar la notificación");
  }
};
