const db = require('../../util/database');

// Clase Reward
module.exports = class Reward {

    constructor(IDReward, name, description, type, available, value) {
        this.IDReward = IDReward;
        this.name = name;
        this.description = description;
        this.type = type;        // monetary / nonMonetary
        this.available = available; // 0 / 1
        this.value = value;      // puede ser número o código
    }

    /**
     * Guarda una nueva recompensa
     */
    save() {
        return db.execute(
            'INSERT INTO rewards (IDReward, name, description, type, available, value) VALUES (?, ?, ?, ?, ?, ?)',
            [this.IDReward, this.name, this.description, this.type, this.available, this.value]
        );
    }

    /**
     * Devuelve todas las recompensas
     * @returns {Promise}
     */
    static fetchAll() {
        return db.execute('SELECT * FROM rewards WHERE available = 1'); // Muestra solo las activas
    }

    /**
     * Devuelve una recompensa por su ID
     * @param {number} id
     * @returns {Promise}
     */
    static fetchById(id) {
        return db.execute('SELECT * FROM rewards WHERE IDReward = ?', [id]);
    }

    /**
     * Actualiza una recompensa existente
     * @param {number} id
     * @param {object} data
     * @returns {Promise}
     */
    static update(id, data) {
        return db.execute(
            'UPDATE rewards SET name=?, description=?, type=?, available=?, value=? WHERE IDReward=?',
            [
                data.name,
                data.description,
                data.type,
                data.available,
                data.value,
                id
            ]
        );
    }

};