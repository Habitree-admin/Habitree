const Notification = require('../models/notifications/notification.model');

exports.getDashboard = async (req, res) => {
    res.render('../views/dashboard.ejs', { title: 'Dashboard' });
};