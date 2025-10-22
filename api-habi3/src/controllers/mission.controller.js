const missionService = require("../services/mission.service");

/**
 * This function gets all missions for a specific user
 * 
 * getMissions gets all available missions by user
 */
const getMissions = async (req, res) => {
  try {
    const { id } = req.params;
    const missions = await missionService.getAllMissions(id);
    res.json(missions);
  } catch (err) {
    res.status(500).json({
      error: "Error fetching missions",
      details: err.message,
    });
  }
};

/**
 * This function gets missions completed by a user
 * 
 * getUserMission returns the missions completed by a user
 */
const getUserMission = async (req, res) => {
  try {
    const userMission = await missionService.getUserMission();
    res.json(userMission);
  } catch (err) {
    res.status(500).json({
      error: "Error fetching missions",
      details: err.message,
    });
  }
};

/**
 * This function gets all missions for a specific user with the old database structure
 * 
 * getUserMissions gets all missions completed by a users
 */
const getUserMissions = async (req, res) => {
  try {
    const { id } = req.params;
    const userMission = await missionService.getUserMissions(id);

    res.json({
      success: true,
      userId: id,
      missions: userMission
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching missions",
      details: err.message,
    });
  }
};

/**
 * This function marks a mission as completed for a user
 * 
 * postCompleteMission returns if the mission completed succesfully and how many experience and coins a user gets
 */
const postCompleteMission = async (req, res) => {
  try {
    const { IDMission, IDUser } = req.body;

    // make sure the request is filled correctly
    if (!IDMission || !IDUser) {
      return res.status(400).json({
        success: false,
        message: "IDMission e IDUser son requeridos",
        data: null
      });
    }

    // error handling
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
    let message = "Internal server error";

    // Error handling
    if (err.message.includes("mission already completed")) {
      statusCode = 409; // Conflict
      message = err.message;
    } else if (err.message.includes("mission doesnt exist")) {
      statusCode = 404; // Not Found
      message = err.message;
    } else if (err.message.includes("mission not available")) {
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