const Notification = require('../../models/notifications/notification.model');
const { sendNotificationToTopic } = require('../../util/fcm');


exports.getNotifications = async (req, res) => {
    const notifications = await Notification.fetchAll();
    res.render('notifications/notifications', { 
        title: 'Notifications', 
        notifications,
        csrfToken: req.csrfToken()
    });
};

exports.getAddNotification = (req, res) => {
    // Renderizado del formulario de Add Notification
    // Guarda el token generado en la variable csrfToken y se lo pasa a la vista
    res.render('notifications/addNotifications', { csrfToken: req.csrfToken() });
}


// Nuevo endpoint para enviar notificación por canal (topic)
exports.sendPushNotification = async (req, res) => {
    const { canal, titulo, mensaje } = req.body;
    try {
        // Envía la notificación por FCM topic
        await sendNotificationToTopic(canal, titulo, mensaje);
        res.status(200).json({ success: true, message: 'Notificación enviada por canal' });
    } catch (err) {
        console.error('Error al enviar push:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};


// Crear notificación en la base de datos y envia
exports.createNotification = async (req, res) => {
    const { canal, titulo, mensaje, category } = req.body;
    try {
        // Guarda la notificación en la base de datos con los nuevos campos
        await Notification.create(titulo, mensaje, canal, category);
        console.log('Success: Notificación creada en la base de datos');
        
        // Envía la notificación 
        await sendNotificationToTopic(canal, titulo, mensaje);
        console.log('Success: Notificación enviada por FCM');
        
        // Redirige a la lista de notificaciones
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

        // Pasa todos los campos incluyendo titulo y canal
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

exports.postAddNotification = async (req, res) => {
    const { titulo, mensaje, canal, category } = req.body;
    try {
        // Llama a la función Add del model con los nuevos campos
        await Notification.add(titulo, mensaje, canal, category);
        // Redirige a la lista de notificaciones
        res.redirect('/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al agregar la notificación");
    }
};

exports.postDelete = (req, res) => {
    const { id, currentState } = req.body;
    
    // Si el estado actual es 'deactivate' (es decir, está activo), lo cambia a 0.
    // Si el estado actual es 'activate' (es decir, está inactivo), lo cambia a 1.
    const newIsActive = currentState === 'deactivate' ? 0 : 1;

    try {
        // Llama a la función del modelo con el nuevo valor numérico
        Notification.updateIsActive(id, newIsActive);
        
        res.redirect('/notifications');
        
        console.log(`Success: Notificación ${id} actualizada a isActive = ${newIsActive}`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar la notificación");
    }
};

exports.postUpdate = (req, res) => {
    const { id, titulo, description, canal, category } = req.body;
    try {
        // Actualiza con todos los campos nuevos
        Notification.update(titulo, description, canal, category, id);
        console.log("Success update");
        res.redirect('/notifications');
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar la notificación");
    }
}