const userService = require("../services/users.service");

const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener usuarios",
      details: err.message,
    });
  }
};


const getLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que vengan datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    // Llamar al servicio
    const user = await userService.getLoginUser(email, password);

    // Respuesta exitosa
    res.json({
      success: true,
      message: "✅ Login exitoso",
      user,
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: "❌ Credenciales inválidas",
      details: err.message, // opcional
    });
  }
};

const getLoginGoogle = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar que venga el correo
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    // Llamar al servicio
    const user = await userService.getLoginUserGoogle(email);

    // Filtrar manualmente los campos que deseas retornar
    const responseUser = {
      userId: user.id,
      name: user.name,
      email: user.email,
      coins: user.coins
    };

    // Enviar respuesta limpia
    res.json({
      success: true,
      message: "✅ Login exitoso",
      user: responseUser,
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: "❌ Credenciales inválidas",
      details: err.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const id = req.params.id; 
    const passkeys = await userService.getStatsUser(id);
    res.json(passkeys);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining user credcentials",
      details: err.message,
    });
  }
};

const postSignup = async (req, res) => {
  try {
    const {name, email, gender, dateOfBirth, coins, password} = req.body;
    const rows = await userService.postSignupUser(name, email, gender, dateOfBirth, coins, password);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener usuarios",
      details: err.message,
    });
  }
};

const editUser = async (req, res) => {
  try {
    const {name, email, gender, dateOfBirth} = req.body;
    const { id } = req.params;
    const rows = await userService.editUserInfo(id, name, email, gender, dateOfBirth);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener usuarios",
      details: err.message,
    });
  }
};

const changepasswd = async (req, res) => {
  try {
    const {password} = req.body;
    const { id } = req.params;
    const rows = await userService.changeUserPassword(id, password);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener usuarios",
      details: err.message,
    });
  }
};

const getMissionsSummary = async (req, res) => {
  try {
    const id = req.params.id; 
    const summary = await userService.getMissionsSummaryByUser(id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining missions summary",
      details: err.message,
    });
  }
};

const getUserRewards = async (req, res) => {
  try {
    const id = req.params.id; 
    const rewards = await userService.getUserRewardsById(id);
    res.json(rewards);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining user rewards",
      details: err.message,
    });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await userService.getLeaderboardS();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener leaderboard",
      details: err.message
    });
  }
};

const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await userService.getInventoryByUser(id);

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (err) {
    console.error("❌ Error en getInventory:", err);
    res.status(500).json({
      success: false,
      message: "Error al obtener inventario",
      details: err.message
    });
  }
};

const useItem = async (req, res) => {
  try {
    const { IDUser, IDItem } = req.body;

    if (!IDUser || !IDItem) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros: IDUser o IDItem",
      });
    }

    const result = await userService.useItemByUser(IDUser, IDItem);

    res.status(200).json({
      success: true,
      message: "Item usado correctamente",
      data: result,
    });
  } catch (err) {
    console.error("Error en useItem:", err);
    res.status(500).json({
      success: false,
      message: "Error al usar el ítem",
      details: err.message,
    });
  }
};

const getActiveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const activeItem = await userService.getActiveItemByUser(id);

    if (!activeItem) {
      return res.status(404).json({
        success: false,
        message: "El usuario no tiene un ítem activo."
      });
    }

    res.status(200).json({
      success: true,
      data: activeItem
    });
  } catch (err) {
    console.error("❌ Error en getActiveItem:", err);
    res.status(500).json({
      success: false,
      message: "Error al obtener ítem activo del usuario",
      details: err.message
    });
  }
};

module.exports = { getUsers, getLogin, postSignup, getStats, editUser, 
                    changepasswd, getMissionsSummary, getUserRewards, 
                    getLoginGoogle, getLeaderboard, getInventory, useItem,
                    getActiveItem};