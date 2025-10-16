const missionService = require("../services/mission.service");

const getMissions = async (req, res) => {
  try {
    const { id } = req.params;; // ejemplo: leer de query
    const missions = await missionService.getAllMissions(id);
    res.json(missions);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener misiones",
      details: err.message,
    });
  }
};


const getUserMission = async (req, res) => {
  try {
    const userMission = await missionService.getUserMission();
    res.json(userMission);
  } catch (err) {
    res.status(500).json({
      error: "Error al misisiones del usuario",
      details: err.message,
    });
  }
};


const getUserMissions = async (req, res) => {
  try {
    const { id } = req.params; // ← ahora sacamos el ID de la URL
    const userMission = await missionService.getUserMissions(id);

    res.json({
      success: true,
      userId: id,
      missions: userMission
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener misiones del usuario",
      details: err.message,
    });
  }
};

const postCompleteMission = async (req, res) => {
  try {
    const { IDMission, IDUser } = req.body;

    // Validar que se enviaron los campos requeridos
    if (!IDMission || !IDUser) {
      return res.status(400).json({
        success: false,
        message: "IDMission e IDUser son requeridos",
        data: null
      });
    }

    // Validar que son números válidos
    if (isNaN(IDMission) || isNaN(IDUser)) {
      return res.status(400).json({
        success: false,
        message: "IDMission e IDUser deben ser números válidos",
        data: null
      });
    }

    const result = await missionService.postCompleteMissionUser(IDUser, IDMission);
    
    res.status(200).json(result);
    
  } catch (err) {
    let statusCode = 500;
    let message = "Error interno del servidor";

    // Manejar errores específicos
    if (err.message.includes("ya completó esta misión")) {
      statusCode = 409; // Conflict
      message = err.message;
    } else if (err.message.includes("no existe")) {
      statusCode = 404; // Not Found
      message = err.message;
    } else if (err.message.includes("no está disponible")) {
      statusCode = 400; // Bad Request
      message = err.message;
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      data: null
    });
  }
};


module.exports = { getMissions, getUserMission, postCompleteMission, getUserMissions};