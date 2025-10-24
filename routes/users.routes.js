const express = require("express")
const router = express.Router()
const isAuth = require('../util/is-auth');
const usersController = require("../controllers/users.controller")


router.get("/", isAuth, usersController.getUsers)
router.post("/", isAuth, usersController.postUsers)
/**
 
 this route logs out the current user
 calls controller.logout to destroy session and redirect
 *
 */
router.get('/logout', isAuth, usersController.logout)
// Obtener usuario por ID
router.get("/:id", isAuth, usersController.getUserById)
/**
 
 this route updates a user
 posts to /edit/:id and calls controller.editUser
 *
 */
router.post("/edit/:id", isAuth, usersController.editUser)
/**
 
 this route soft-deletes a user
 posts to /delete/:id and calls controller.deleteUser
 *
 */
router.post("/delete/:id", isAuth, usersController.deleteUser)

module.exports = router;