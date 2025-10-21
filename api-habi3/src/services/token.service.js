const jwt = require("jsonwebtoken");
const db = require("../../../util/database");
require("dotenv").config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;
const REFRESH_TOKEN_RENEWAL_THRESHOLD = parseInt(process.env.REFRESH_TOKEN_RENEWAL_THRESHOLD, 10);

const parseExpirationToSeconds = (expiration) => {
    const value = parseInt(expiration, 10);
    const unit = expiration.slice(-1);
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 7 * 86400;
    }
};

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.userId, email: user.email },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
};

const generateRefreshToken = async (user) => {
    const refreshToken = jwt.sign(
        { userId: user.userId, email: user.email },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES }
    );

    const expiresInSeconds = parseExpirationToSeconds(REFRESH_TOKEN_EXPIRES);
    const now = Date.now();
    const expiresAtMs = now + (expiresInSeconds * 1000);
    const expiresAt = new Date(expiresAtMs);

    await db.execute(
        'INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)',
        [user.userId, refreshToken, expiresAt]
    );

    return { refreshToken, expiresAt };
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new Error('Invalid access token');
    }
};

const verifyRefreshToken = async (token) => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
        const [rows] = await db.execute(
            'SELECT * FROM refresh_tokens WHERE userId = ? AND token = ? AND expiresAt > NOW()',
            [decoded.userId, token]
        );

        if (rows.length === 0) {
            throw new Error('Invalid or expired refresh token');
        }

        return { decoded, expiresAt: rows[0].expiresAt };
    } catch (err) {
        throw new Error('Invalid refresh token: ' + err.message);
    }
};

const invalidateRefreshToken = async (token) => {
    await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

const shouldRenewRefreshToken = (expiresAt) => {
    const now = new Date();
    const timeLeft = (new Date(expiresAt) - now) / 1000;
    return timeLeft < REFRESH_TOKEN_RENEWAL_THRESHOLD;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    invalidateRefreshToken,
    shouldRenewRefreshToken
};