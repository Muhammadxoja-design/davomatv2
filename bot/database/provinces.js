// Province methods for all database adapters

// SQLite
function addProvinceMethods(db) {
  // Create province
  db.createProvince = function(province) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO provinces (id, name, created_by)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, province.name, province.created_by || null);
    return this.getProvinceById(id);
  };

  // Get province by ID
  db.getProvinceById = function(id) {
    return this.db.prepare('SELECT * FROM provinces WHERE id = ?').get(id);
  };

  // Get all provinces
  db.getAllProvinces = function() {
    return this.db.prepare('SELECT * FROM provinces ORDER BY name').all();
  };

  // Update province
  db.updateProvince = function(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE provinces SET ${fields} WHERE id = ?`);
    stmt.run(...values);
    return this.getProvinceById(id);
  };

  // Delete province
  db.deleteProvince = function(id) {
    const stmt = this.db.prepare('DELETE FROM provinces WHERE id = ?');
    stmt.run(id);
    return { success: true };
  };

  return db;
}

export default { addProvinceMethods };
