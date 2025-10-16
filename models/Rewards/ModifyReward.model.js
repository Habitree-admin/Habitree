const db = require('../../util/database');

module.exports = class ModifyReward {
  /**
   * Obtener recompensa por su ID
   */
  static fetchById(id) {
    return db.execute('SELECT * FROM rewards WHERE IDReward = ?', [id]);
  }

  /**
   * Actualizar recompensa existente
   */
  static update(id, data) {
    return db.execute(
      'UPDATE rewards SET name=?, description=?, type=?, available=?, value=? WHERE IDReward=?',
      [data.name, data.description, data.type, data.available, data.value, id]
    );
  }
};
