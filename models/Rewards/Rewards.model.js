const db = require('../../util/database');

 /**
   * This file collect the data of rewards from the database
  */

// Class Reward
module.exports = class Reward {

    constructor(name, description, type, available, value) {
        this.name = name;
        this.description = description;
        this.type = type;        // monetary / nonMonetary
        this.available = available; // 0 / 1
        this.value = value;      // It can be number or code
    }

    /**
     * Save new reward
     */
    save() {
        return db.execute(
            'INSERT INTO rewards (name, description, type, available, value) VALUES (?, ?, ?, ?, ?)',
            [this.name, this.description, this.type, this.available, this.value]
        );
    }

    /**
     * 
     * This function allows the user to consult all the rewards in the database
     * 
     * This function returns all the rewards from the data base
     * 
     */
    static fetchAll() {

        //this return a promise that resolves with an array of rewards where `available = 1`
        return db.execute('SELECT * FROM rewards WHERE available = 1'); 
    }

    /**
     * Returns a reward for ID
     * @param {number} id
     * @returns {Promise}
     */
    static fetchById(id) {
        return db.execute('SELECT * FROM rewards WHERE IDReward = ?', [id]);
    }

    /**
     * Update existing reward 
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