/**
 
This file defines notification system routes for the administrative web panel of the application

notification routes configures all HTTP endpoints for notification management including CRUD operations and FCM sending
*
 */

const express = require("express")
const router = express.Router()

// authentication middleware and notification controller imports
const isAuth = require('../../util/is-auth');
const notificationController = require("../../controllers/notifications/notification.controller")


// get all notifications for admin panel display
router.get("/", isAuth, notificationController.getNotifications)

// get add notification form view
router.get("/add-modal", isAuth, notificationController.getAddNotification);

// get edit notification form with specific notification data
router.get("/edit/:id", isAuth, notificationController.getNotificationEditor);

// create new notification in database only (no FCM sending)
router.post("/add", isAuth, notificationController.postAddNotification);

// toggle notification active status (activate/deactivate)
router.post("/delete", isAuth, notificationController.postDelete);

// update notification data and resend via FCM
router.post("/update", isAuth, notificationController.postUpdate);

// create notification in database and send via Firebase FCM
router.post("/create", isAuth, notificationController.createNotification);


module.exports = router


