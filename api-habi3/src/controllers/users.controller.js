const userService = require("../services/users.service");
const tokenService = require('../services/token.service');

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

const getLoginJWT = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan credenciales',
            });
        }

        const user = await userService.getLoginUser(email, password);
        const accessToken = tokenService.generateAccessToken(user);
        const { refreshToken, expiresAt } = await tokenService.generateRefreshToken(user);

        res.json({
            success: true,
            message: '✅ Login exitoso',
            user,
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: expiresAt.getTime()
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            message: '❌ Credenciales inválidas',
            details: err.message,
        });
    }
};

const getLoginGoogleJWT = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Faltan credenciales',
            });
        }

        const user = await userService.getLoginUserGoogle(email);
        
        if (!user || !user.userId) {
            throw new Error('User data is invalid or missing userId');
        }

        const accessToken = tokenService.generateAccessToken(user);
        const { refreshToken, expiresAt } = await tokenService.generateRefreshToken(user);

        res.json({
            success: true,
            message: '✅ Login exitoso',
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                coins: user.coins
            },
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: expiresAt.getTime()
        });
    } catch (err) {
        console.error('Error en Google login:', err.message);
        res.status(401).json({
            success: false,
            message: '❌ Credenciales inválidas',
            details: err.message,
        });
    }
};

const getLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    const user = await userService.getLoginUser(email, password);

    res.json({
      success: true,
      message: "✅ Login exitoso",
      user,
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: "❌ Credenciales inválidas",
      details: err.message,
    });
  }
};

const getLoginGoogle = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    const user = await userService.getLoginUserGoogle(email);

    const responseUser = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      coins: user.coins
    };

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
    const { name, email, gender, dateOfBirth, coins, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El campo 'email' es obligatorio.",
      });
    }

    const safeName = name ?? null;
    const safeGender = gender ?? null;
    const safeDateOfBirth = dateOfBirth ?? null;
    const safeCoins = coins ?? null;
    const safePassword = password ?? null;

    const rows = await userService.postSignupUser(
      safeName,
      email,
      safeGender,
      safeDateOfBirth,
      safeCoins,
      safePassword
    );

    res.status(201).json(rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
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
    console.error("Error en getInventory:", err);
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

    if (!IDUser || IDItem === undefined || IDItem === null) {
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


const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Falta el refresh token',
            });
        }

        const { decoded, expiresAt } = await tokenService.verifyRefreshToken(refreshToken);
        const user = { userId: decoded.userId, email: decoded.email };
        const newAccessToken = tokenService.generateAccessToken(user);
        let newRefreshToken = refreshToken;
        let newExpiresAt = expiresAt;

        if (tokenService.shouldRenewRefreshToken(expiresAt)) {
            await tokenService.invalidateRefreshToken(refreshToken);
            const { refreshToken: newToken, expiresAt: tokenExpiresAt } = await tokenService.generateRefreshToken(user);
            newRefreshToken = newToken;
            newExpiresAt = tokenExpiresAt;
        }

        res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            refreshTokenExpiresAt: newExpiresAt.getTime()
        });
    } catch (err) {
        console.error('Error al refrescar token:', err.message);
        res.status(401).json({
            success: false,
            message: '❌ Refresh token inválido o expirado',
            details: err.message,
        });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Falta el refresh token',
            });
        }

        await tokenService.invalidateRefreshToken(refreshToken);
        res.json({
            success: true,
            message: '✅ Sesión cerrada exitosamente',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión',
            details: err.message,
        });
    }
};

module.exports = { 
    getUsers, 
    getLogin, 
    postSignup, 
    getStats, 
    editUser, 
    changepasswd, 
    getMissionsSummary, 
    getUserRewards, 
    getLoginGoogle, 
    getLeaderboard, 
    getInventory, 
    useItem,
    getLoginGoogleJWT, 
    getLoginJWT, 
    refreshToken, 
    logout, getActiveItem
};