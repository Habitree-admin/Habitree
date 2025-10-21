const db = require("../util/database");
const bcrypt = require("bcryptjs");
const { encrypt, decrypt, encryptUserData, decryptUserData, decryptUsersArray } = require("../util/encryption");

module.exports = class Usuario {
    constructor(my_name, my_email, my_password, my_gender, my_dateOfBirth) {
        this.name = my_name;
        this.email = my_email;
        this.password = my_password;
        this.gender = my_gender;
        this.dateOfBirth = my_dateOfBirth;
    }

    static async fetchOne(email) {
       
        const emailToFind = email.toLowerCase();
        const [rows] = await db.execute("SELECT * FROM user WHERE deleted = 0");
        
        // Buscar el usuario con el email coincidente
        const matchedUser = rows.find(row => {
            const decryptedEmail = decrypt(row.email);
            return decryptedEmail && decryptedEmail.toLowerCase() === emailToFind;
        });
        
        if (!matchedUser) {
            return [[]]; // No encontrado
        }
        
        // Desencriptar y retornar
        return [[decryptUserData(matchedUser)]];
    }

    static async save(data) {
        try {
            // Encriptar TODOS los datos sensibles (incluyendo email)
            const encryptedData = encryptUserData(data);
            
            const [result] = await db.execute(
                "INSERT INTO user (name, email, gender, dateOfBirth, coins, password, deleted, IDRol) VALUES (?,?,?,?,?,?,?,?)",
                [
                    encryptedData.name,
                    encryptedData.email,
                    encryptedData.gender,
                    encryptedData.dateOfBirth,
                    0,
                    data.password, // Ya viene hasheado con bcrypt
                    0,
                    1
                ]
            );

            const userId = result.insertId;

            // Insertar en tree vinculado a ese usuario
            await db.execute(
                "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
                [userId, 1]
            );

            return userId;
        } catch (err) {
            throw err;
        }
    }

    static async fetchAll() {
        try {
            const [rows] = await db.execute(
                "SELECT IDUser, name, email, gender, dateOfBirth FROM user WHERE deleted = 0"
            );
            
            // Desencriptar todos los usuarios
            return decryptUsersArray(rows);
        } catch (err) {
            throw err;
        }
    }

    static async fetchById(id) {
        const [rows] = await db.execute(
            "SELECT IDUser, name, email, gender, dateOfBirth FROM user WHERE IDUser=? AND deleted=0",
            [id]
        );
        
        // Desencriptar el usuario
        return [decryptUsersArray(rows)];
    }

    static async update(id, data) {
        // Encriptar los datos antes de actualizar (NO el email)
        const encryptedName = encrypt(data.name);
        const encryptedGender = encrypt(data.gender);
        const encryptedDateOfBirth = encrypt(data.dateOfBirth);
        
        return db.execute(
            "UPDATE user SET name=?, email=?, gender=?, dateOfBirth=? WHERE IDUser=?",
            [encryptedName, data.email.toLowerCase(), encryptedGender, encryptedDateOfBirth, id]
        );
    }

    static async softDelete(id) {
        return db.execute(
            "UPDATE user SET deleted = 1 WHERE IDUser = ?",
            [id]
        );
    }

    static async getRolByUserId(idUsuario) {
        return db.execute(
            `SELECT r.rol
            FROM user u
            JOIN rol r ON u.IDRol = r.IDRol
            WHERE u.IDUser = ?`,
            [idUsuario]
        );
    }

    static async checkEmailExists(email, excludeUserId) {
        // Buscar email sin encriptar
        return db.execute(
            "SELECT IDUser FROM user WHERE email = ? AND deleted = 0 AND IDUser <> ?",
            [email.toLowerCase(), excludeUserId]
        );
    }
};