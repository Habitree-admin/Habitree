const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts the received text using the aes-256-cbc algorithm
 * 
 * returns encrypted text 
 */
function encrypt(text) {
    if (!text || text === null || text === undefined) return null;
    
    try {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Error encrypting:', error);
        throw error;
    }
}

/**
 * desencrypts the received texts
 * 
 * returns decrypted text
 */
function decrypt(encryptedText) {
    if (!encryptedText || encryptedText === null || encryptedText === undefined) return null;
    
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            // if the text has not the encrypted format is plain text
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
        // if encryption fails returns plain texts
        return encryptedText;
    }
}

/**
 * Verifies if the text is encrypted
 * 
 * returns true if the text is encrypted
 */
function isEncrypted(text) {
    if (!text) return false;
    const parts = String(text).split(':');
    return parts.length === 2 && parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0]);
}

/**
 * Encrypts user data
 * 
 * returns the user data object encrypted
 */
function encryptUserData(userData) {
    return {
        // only encrypts the sensitive information
        name: userData.name ? encrypt(userData.name) : null,
        email: userData.email ? encrypt(userData.email.toLowerCase()) : null,
        gender: userData.gender ? encrypt(userData.gender) : null,
        dateOfBirth: userData.dateOfBirth ? encrypt(userData.dateOfBirth) : null,
        password: userData.password,
        coins: userData.coins,
        deleted: userData.deleted,
        IDRol: userData.IDRol
    };
}

/**
 * Decrypts user data
 * 
 * returns the user data decrypted
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
 * Decrypts user data array
 * 
 * returns the user data array encrypted
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