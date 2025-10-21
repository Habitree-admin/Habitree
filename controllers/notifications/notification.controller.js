const Notification = require('../../models/notifications/notification.model');
const { sendNotificationToTopic } = require('../../util/fcm');


/**
 * Renderiza la vista de notificaciones con los datos obtenidos de la base.
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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


/**
 * Envía una notificación push a un canal específico usando FCM.
 * @param {import('express').Request} req - Objeto de solicitud HTTP con canal, título y mensaje.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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


/**
 * Crea una notificación en la base de datos y la envía por FCM.
 * @param {import('express').Request} req - Objeto de solicitud HTTP con datos de la notificación.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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


/**
 * Renderiza el formulario de edición para una notificación específica.
 * @param {import('express').Request} req - Objeto de solicitud HTTP con el ID de la notificación.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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

/**
 * Cambia el estado activo/inactivo de una notificación.
 * @param {import('express').Request} req - Objeto de solicitud HTTP con ID y estado actual.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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


/**
 * Cambia el contenido de una notificación y la reenvía.
 * @param {import('express').Request} req - Objeto de solicitud HTTP con ID y estado actual.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 */
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
