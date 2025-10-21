const db = require('../../util/database');

// Clase Item
module.exports = class Item{

    constructor(name, state, category, price, image_name){

        this.name = name;
        this.state = state;
        this.category = category; 
        this.price = price; 
        this.image_name = image_name;
    } 

//Guardar el registro de una mision 

    save(){
 
        return db.execute(
            'INSERT INTO shop (name, state, category, price, image_name) VALUES(?,?,?,?,?)',
            [this.name, this.state, this.category, this.price, this.image_name]
        );
    }

        // Obtener todos los items
    static fetchAll() {
        return db.execute('SELECT * FROM shop')
    }

    // Filtrar por State
    static fetchByState(state) {
        return db.execute(
            'SELECT * FROM shop WHERE state = ?',
            [state]
        );
    }

    // Filtrar por Category
    static fetchByCategory(category) {
        return db.execute(
            'SELECT * FROM shop WHERE category = ?',
            [category]
        );
    }

    // Filtrar por Price
    static fetchByPrice(minPrice, maxPrice) {
        return db.execute(
            'SELECT * FROM shop WHERE price BETWEEN ? AND ?',
            [minPrice, maxPrice]
        );
    }

    // Filtro 
    static fetchFiltered(filters = {}) {
        let query = 'SELECT * FROM shop WHERE 1=1';
        const params = [];

        if (filters.state) {
            query += ' AND state = ?';
            params.push(filters.state);
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            query += ' AND price BETWEEN ? AND ?';
            params.push(filters.minPrice, filters.maxPrice);
        } else if (filters.minPrice !== undefined) {
            query += ' AND price >= ?';
            params.push(filters.minPrice);
        } else if (filters.maxPrice !== undefined) {
            query += ' AND price <= ?';
            params.push(filters.maxPrice);
        }

        return db.execute(query, params);
    }

    // Obtener categorías únicas
    static getUniqueCategories() {
        return db.execute(
            'SELECT DISTINCT category FROM shop ORDER BY category'
        );
    }

    // Obtener estados únicos
    static getUniqueStates() {
        return db.execute('SELECT DISTINCT state FROM shop ORDER BY state');
    }

    // Obtener rango de precios
    static getPriceRange() {
        return db.execute(
            'SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM shop'
        );
    }

    // Obtener un item por ID
    static fetchById(id) {
    return db.execute('SELECT * FROM shop WHERE IDItem = ?', [id]); 
  }

    static update(id, { name, state, category, price, image_name }) {
        return db.execute(
        `UPDATE shop
            SET name = ?, state = ?, category = ?, price = ?, image_name = ?
        WHERE IDItem = ?`,
        [name, state, category, price, image_name, id]
        );
    }

    // Para que no cambie el image_name si no se sube nueva imagen
    static updateWithoutImage(id, { name, state, category, price }) {
    return db.execute(
        `UPDATE shop
        SET name = ?, state = ?, category = ?, price = ?
        WHERE IDItem = ?`,
        [name, state, category, price, id]
    );
    }


    static getStatus(id) {
        return db.execute('SELECT state FROM shop WHERE IDItem = ?', [id]);
    }

    static activate(id) {
        return db.execute('UPDATE shop SET state = 1 WHERE IDItem = ?', [id]);
    }

    static deactivate(id) {
        return db.execute('UPDATE shop SET state = 0 WHERE IDItem = ?', [id]);
    }
}
