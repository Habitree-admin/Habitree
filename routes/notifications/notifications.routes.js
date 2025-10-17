const express = require("express")
const router = express.Router()
const isAuth = require('../../util/is-auth');
const notificationController = require("../../controllers/notifications/notification.controller")



router.get("/", isAuth, notificationController.getNotifications)

router.get("/add-modal", isAuth, notificationController.getAddNotification);

router.get("/edit/:id", isAuth, notificationController.getNotificationEditor);

router.post("/add", isAuth, notificationController.postAddNotification);

router.post("/delete", isAuth, notificationController.postDelete);

router.post("/update", isAuth, notificationController.postUpdate);

router.post("/create", isAuth, notificationController.createNotification);


module.exports = router


