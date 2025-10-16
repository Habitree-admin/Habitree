const express = require("express")
const router = express.Router()
const isAuth = require('../../util/is-auth');
const MissionController = require("../../controllers/Missions/Missions.controller")

// Obtener todas las misiones
router.get("/missions", isAuth, MissionController.getMissions)
// Registrar nueva misión
router.post("/missions", isAuth, MissionController.postMissions)
// Obtener misión por ID (para edición)
router.get("/missions/:id", isAuth, MissionController.getMissionById)
// Editar misión
router.post("/missions/edit/:id", isAuth, MissionController.editMission)
// Eliminar misión
router.delete("/missions/:id", isAuth, MissionController.deleteMission)

module.exports = router
