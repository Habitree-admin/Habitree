const db = require('../../util/database');

/**
 * Collects reward data access functions for the database.
 *
 */

// Class Reward
module.exports = class Reward {

    constructor(name, description, type, available, value) {
        this.name = name;
        this.description = description;
        this.type = type;        // monetary / nonMonetary
        this.available = available; // 0 / 1
        this.value = value;      // Number or code
    }

    /**
     * Saves a new reward into the database.
     *
     */
    save() {
        return db.execute(
            'INSERT INTO rewards (name, description, type, available, value) VALUES (?, ?, ?, ?, ?)',
            [this.name, this.description, this.type, this.available, this.value]
        );
    }

    /**
     * Retrieves all available rewards from the database.
     * Returns rows where `available = 1`.
     *
     */
    static fetchAll() {
        // returns a promise that resolves with rewards where available = 1
        return db.execute('SELECT * FROM rewards WHERE available = 1'); 
    }

    /**
     * Retrieves a reward by its ID.
     * @param {number} id
     * @returns {Promise}
     *
     */
    static fetchById(id) {
        return db.execute('SELECT * FROM rewards WHERE IDReward = ?', [id]);
    }

    /**
     * Updates an existing reward by ID.
     * @param {number} id
     * @param {object} data
     * @returns {Promise}
     *
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
