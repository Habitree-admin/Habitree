const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = 'aes-256-cbc';

/**
 * Encripta un texto usando AES-256-CBC
 * @param {string} text - Texto a encriptar
 * @returns {string} - Texto encriptado en formato "iv:encryptedData"
 */
function encrypt(text) {
    if (!text || text === null || text === undefined) return null;
    
    try {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Retorna iv:encrypted para poder desencriptar después
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Error al encriptar:', error);
        throw error;
    }
}

/**
 * Desencripta un texto encriptado con la función encrypt
 * @param {string} encryptedText - Texto encriptado en formato "iv:encryptedData"
 * @returns {string} - Texto desencriptado
 */
function decrypt(encryptedText) {
    if (!encryptedText || encryptedText === null || encryptedText === undefined) return null;
    
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            // Si no tiene el formato correcto, asumimos que es texto plano (para compatibilidad)
            return encryptedText;
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = parts[1];
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Error al desencriptar:', error);
        // Si falla la desencriptación, retorna el valor original (puede ser texto plano)
        return encryptedText;
    }
}

/**
 * Verifica si un texto está encriptado
 * @param {string} text 
 * @returns {boolean}
 */
function isEncrypted(text) {
    if (!text) return false;
    const parts = String(text).split(':');
    return parts.length === 2 && parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0]);
}

/**
 * Encripta un objeto de datos de usuario
 * @param {Object} userData - Objeto con datos del usuario
 * @returns {Object} - Objeto con datos encriptados
 */
function encryptUserData(userData) {
    return {
        name: userData.name ? encrypt(userData.name) : null,
        email: userData.email ? encrypt(userData.email.toLowerCase()) : null,
        gender: userData.gender ? encrypt(userData.gender) : null,
        dateOfBirth: userData.dateOfBirth ? encrypt(userData.dateOfBirth) : null,
        // No encriptar password, coins, etc. - ya tienen su propio manejo
        password: userData.password,
        coins: userData.coins,
        deleted: userData.deleted,
        IDRol: userData.IDRol
    };
}

/**
 * Desencripta un objeto de datos de usuario
 * @param {Object} encryptedData - Objeto con datos encriptados
 * @returns {Object} - Objeto con datos desencriptados
 */
function decryptUserData(encryptedData) {
    if (!encryptedData) return null;
    
    return {
        ...encryptedData,
        name: encryptedData.name ? decrypt(encryptedData.name) : null,
        email: encryptedData.email ? decrypt(encryptedData.email) : null,
        gender: encryptedData.gender ? decrypt(encryptedData.gender) : null,
        dateOfBirth: encryptedData.dateOfBirth ? decrypt(encryptedData.dateOfBirth) : null
    };
}

/**
 * Desencripta un array de usuarios
 * @param {Array} users - Array de usuarios con datos encriptados
 * @returns {Array} - Array de usuarios con datos desencriptados
 */
function decryptUsersArray(users) {
    if (!Array.isArray(users)) return [];
    return users.map(user => decryptUserData(user));
}

module.exports = {
    encrypt,
    decrypt,
    isEncrypted,
    encryptUserData,
    decryptUserData,
    decryptUsersArray
};