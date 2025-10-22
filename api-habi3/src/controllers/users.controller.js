const userService = require("../services/users.service");
const tokenService = require('../services/token.service');

/**
 * This function gets all users
 * 
 * getUsers returns all users from the database with decrypted data
 */
const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining users",
      details: err.message,
    });
  }
};

/**
 * This function handles traditional login and generates JWT tokens
 * 
 * getLoginJWT returns access token and refresh token for authenticated user, and user info to use on mobile apps
 */
const getLoginJWT = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // check request body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing credentials',
            });
        }

        const user = await userService.getLoginUser(email, password);
        const accessToken = tokenService.generateAccessToken(user);
        const { refreshToken, expiresAt } = await tokenService.generateRefreshToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            user,
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: expiresAt.getTime()
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials',
            details: err.message,
        });
    }
};

/**
 * This function handles google login and generates JWT tokens
 * 
 * getLoginJWT returns access token and refresh token for authenticated user, and user info to use on mobile apps
 */
const getLoginGoogleJWT = async (req, res) => {
    try {
        const { email } = req.body;
        
        // check request body
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Missing credentials',
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
            message: 'Login successful',
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
        console.error('Error in Google login:', err.message);
        res.status(401).json({
            success: false,
            message: 'Invalid credentials',
            details: err.message,
        });
    }
};

/**
 * This function handles traditional login without token
 * 
 * getLogin returns user info to use on mobile apps after authentication
 */
const getLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
      });
    }

    const user = await userService.getLoginUser(email, password);

    res.json({
      success: true,
      message: "Login successful",
      user,
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
      details: err.message,
    });
  }
};

/**
 * This function handles google login without token
 * 
 * getLoginGoogle returns user info to use on mobile apps after authentication
 */
const getLoginGoogle = async (req, res) => {
  try {
    const { email } = req.body;

    // check request body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
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
      message: "Login successful",
      user: responseUser,
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
      details: err.message,
    });
  }
};

/**
 * This function gets user stats
 * 
 * getStats returns user stats like name, email, xp
 */
const getStats = async (req, res) => {
  try {
    const id = req.params.id; 
    const passkeys = await userService.getStatsUser(id);
    res.json(passkeys);
  } catch (err) {
    res.status(500).json({
      error: "Error obtaining user credentials",
      details: err.message,
    });
  }
};

/**
 * This function registers a new user in the application
 * 
 * postSignup returns the userId after completing signup
 */
const postSignup = async (req, res) => {
  try {
    const { name, email, gender, dateOfBirth, coins, password } = req.body;

    // check request body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email field is required.",
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
      message: "Error registering user",
      details: err.message,
    });
  }
};

/**
 * This function updates user information
 * 
 * editUser returns the number of affected rows after updating the user
 */
const editUser = async (req, res) => {
  try {
    const {name, email, gender, dateOfBirth} = req.body;
    const { id } = req.params;
    const rows = await userService.editUserInfo(id, name, email, gender, dateOfBirth);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Error updating user",
      details: err.message,
    });
  }
};

/**
 * This function changes the users password
 * 
 * changepasswd returns the number of affected rows after updating the password
 */
const changepasswd = async (req, res) => {
  try {
    const {password} = req.body;
    const { id } = req.params;
    const rows = await userService.changeUserPassword(id, password);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Error changing password",
      details: err.message,
    });
  }
};

/**
 * This function gets missions summary for a user
 * 
 * getMissionsSummary returns total values grouped by mission category for the user
 */
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

/**
 * This function gets all rewards obtained from a user
 * 
 * getUserRewards returns all rewards obtained by the user
 */
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

/**
 * This function gets the top users of the application based on xp
 * 
 * getLeaderboard returns top 10 users ordered by xp
 */
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await userService.getLeaderboardS();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error obtaining leaderboard",
      details: err.message
    });
  }
};

/**
 * This function gets the user inventory
 * 
 * getInventory returns all items that the user has bought thorugh the shop
 */
const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await userService.getInventoryByUser(id);

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (err) {
    console.error("Error in getInventory:", err);
    res.status(500).json({
      success: false,
      message: "Error obtaining inventory",
      details: err.message
    });
  }
};

/**
 * This function equips and item to the user
 * 
 * useItem returns if item was equipped successfully or unsuccessfully
 */
const useItem = async (req, res) => {
  try {
    const { IDUser, IDItem } = req.body;

    // check request body
    if (!IDUser || IDItem === undefined || IDItem === null) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters: IDUser or IDItem",
      });
    }

    const result = await userService.useItemByUser(IDUser, IDItem);

    res.status(200).json({
      success: true,
      message: "Item used successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error in useItem:", err);
    res.status(500).json({
      success: false,
      message: "Error using item",
      details: err.message,
    });
  }
};

/**
 * This function gets the active item the user is using
 * 
 * getActiveItem returns name and the signedurl of the item that the user has active
 */
const getActiveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const activeItem = await userService.getActiveItemByUser(id);

    if (!activeItem) {
      return res.status(404).json({
        success: false,
        message: "User has no active item."
      });
    }

    res.status(200).json({
      success: true,
      data: activeItem
    });
  } catch (err) {
    console.error("❌ Error in getActiveItem:", err);
    res.status(500).json({
      success: false,
      message: "Error obtaining user active item",
      details: err.message
    });
  }
};

/**
 * This function refreshes an expired access token
 * 
 * refreshToken returns new access token and if the refresh token is expired also returns a new refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // check request body
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing refresh token',
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
        console.error('Error refreshing token:', err.message);
        res.status(401).json({
            success: false,
            message: '❌ Invalid or expired refresh token',
            details: err.message,
        });
    }
};

/**
 * This function logs out a user by invalidating refresh token
 * 
 * logout returns session was closed successfully or unsuccessfully
 */
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // check request body
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing refresh token',
            });
        }

        await tokenService.invalidateRefreshToken(refreshToken);
        res.json({
            success: true,
            message: '✅ Session closed successfully',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error closing session',
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
    logout, 
    getActiveItem
};