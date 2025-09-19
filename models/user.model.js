// eslint-disable-next-line no-undef
  const db = require("../util/database");
  const bcrypt = require("bcryptjs");


  module.exports = class Usuario {
    //class constructor
    constructor(
      my_name,
      my_email,
      my_password,
      my_gender,
      my_dateOfBirth, 
  
    ) {
      this.name = my_name;
      this.email = my_email;
      this.password = my_password;
      this.gender = my_gender;
      this.dateOfBirth = my_dateOfBirth;
    }

    static async save(data) {
        try {
            const [result] = await db.execute(
                "INSERT INTO user (name, email, gender, dateOfBirth, coins, password, deleted, IDRol) VALUES (?,?,?,?,?,?,?,?)",
                [data.name, data.email, data.gender, data.dateOfBirth, 0, data.password, 0, 1]
            );

            const userId = result.insertId;

            // Insertar en tree vinculado a ese usuario
            await db.execute(
                "INSERT INTO tree (IDUser, level) VALUES (?, ?)",
                [userId, 1] // Por defecto nivel 1
            );

        } catch (err) {
            throw err;
        }
    }

    // Método para obtener todos los usuarios
    static async fetchAll() {
        try {
            const [rows] = await db.execute("SELECT IDUser, name, email, gender, dateOfBirth FROM user WHERE deleted = 0");
            return rows;
        } catch (err) {
            throw err;
        }
    }
   
    static fetchOne(email) {
        return db.execute("SELECT * FROM user WHERE email=?", [
            email,
        ]);
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
};
    