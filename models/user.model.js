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


    /**
     * 
     * This function allows to fetch an individual user by its email
     * to use this function in the login
     * 
     * This function returns the user data
     * 
     */
    static async fetchOne(email) {
       
        const emailToFind = email.toLowerCase();
        const [rows] = await db.execute("SELECT * FROM user WHERE deleted = 0");
        
        //Search matching email
        const matchedUser = rows.find(row => {
            const decryptedEmail = decrypt(row.email);
            return decryptedEmail && decryptedEmail.toLowerCase() === emailToFind;
        });
        
        if (!matchedUser) {
            return [[]];  //didnt find a user
        }
        
        // Decrypt and return data 
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

    /**
         
     this function updates user fields in the database
     this function encrypts fields then runs the update
     *
     */
    static async update(id, data) {
        // encrypt fields before updating
        const encryptedName = encrypt(data.name);
        const encryptedGender = encrypt(data.gender);
        const encryptedDateOfBirth = encrypt(data.dateOfBirth);
        
        return db.execute(
            "UPDATE user SET name=?, email=?, gender=?, dateOfBirth=? WHERE IDUser=?",
            [encryptedName, data.email.toLowerCase(), encryptedGender, encryptedDateOfBirth, id]
        );
    }

    /** 
   
     this function performs a logical delete for a user
     this function sets the deleted flag to 1 for the given user id
    *
    */
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

    /**
     
     this function checks if an email exists for another user
     this function queries the user table excluding the given user id
     *
     */
    static async checkEmailExists(email, excludeUserId) {
        return db.execute(
            "SELECT IDUser FROM user WHERE email = ? AND deleted = 0 AND IDUser <> ?",
            [email.toLowerCase(), excludeUserId]
        );
    }
};