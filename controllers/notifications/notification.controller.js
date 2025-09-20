const Notification = require('../../models/notifications/notification.model');

exports.getNotifications = async (req, res) => {
    const notifications = await Notification.fetchAll();
    res.render('notifications/notifications', { title: 'Notifications', notifications });
};

exports.getAddNotification = (req, res) => {
    res.render('notifications/addNotifications', { csrfToken: req.csrfToken() });
}

exports.getNotificationEditor = async (req, res) => {
    const { id } = req.params; // Este 'id' es el de la URL, el que se usa para buscar en la BD.

    try {
        const [rows] = await Notification.fetchById(id); // Buscas por este ID.

        if (!rows || rows.length === 0) {
            return res.status(404).send("Notificación no encontrada");
        }

        const notification = rows[0]; // Los datos de la BD.

        // Aquí estás pasando los datos. ¿Por qué el error?
        res.render('notifications/editNotifications', {
            id: notification.IDNotification, // ¿Es este el ID que quieres mostrar en el form?
            description: notification.description,
            category: notification.category,
            isActive: notification.isActive ? 'Sí' : 'No',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener datos de la notificación");
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

exports.postUpdate = (req,res)=>{
    const { id, description, category } = req.body;
    try {
        Notification.update(description,category,id)
        console.log("Success update")
        res.redirect('/notifications')
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error al eliminar la notificación");
    }
}





