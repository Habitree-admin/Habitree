const db = require('../../util/database');
 /**
   * This file collect the data of rewards from the database
  */


module.exports = class ModifyReward {
  /**
   * Collect reward for ID
   */
  static fetchById(id) {
    return db.execute('SELECT * FROM rewards WHERE IDReward = ?', [id]);
  }

  /**
   * Update existent reward
   */
  static update(id, data) {
    return db.execute(
      'UPDATE rewards SET name=?, description=?, type=?, available=?, value=? WHERE IDReward=?',
      [data.name, data.description, data.type, data.available, data.value, id]
    );
  }
};
