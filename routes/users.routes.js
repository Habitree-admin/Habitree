const express = require("express")
const router = express.Router()
const isAuth = require('../util/is-auth');
const usersController = require("../controllers/users.controller")


router.get("/", isAuth, usersController.getUsers)
router.post("/", isAuth, usersController.postUsers)
// Obtener usuario por ID (para edición)
router.get("/:id", isAuth, usersController.getUserById)
// Editar usuario
router.post("/edit/:id", isAuth, usersController.editUser)
// Borrar usuario
router.post("/delete/:id", isAuth, usersController.deleteUser)

module.exports = router;