const db = require('../config/db');

const subjectModel = {
  findByUserId: async (userId) => {
    const res = await db.query(
      "SELECT * FROM subjects WHERE user_id = $1 ORDER BY creation_date DESC", 
      [userId]
    );
    return res.rows;
  },
  
  findById: async (id) => {
    const res = await db.query(
      "SELECT * FROM subjects WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  },
  
  create: async (userId, name) => {
    const res = await db.query(
      "INSERT INTO subjects (user_id, name, creation_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *",
      [userId, name]
    );
    return res.rows[0];
  },
  
  update: async (id, updates) => {
    const { name, is_enabled } = updates;
    
    // If disabling the subject, set the disabled_date
    let query;
    let params;
    
    if (is_enabled === false) {
      query = `
        UPDATE subjects 
        SET name = $2, is_enabled = $3, disabled_date = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING *
      `;
      params = [id, name, is_enabled];
    } else {
      query = `
        UPDATE subjects 
        SET name = $2, is_enabled = $3
        WHERE id = $1 
        RETURNING *
      `;
      params = [id, name, is_enabled];
    }
    
    const res = await db.query(query, params);
    return res.rows[0];
  },
  
  delete: async (userId, name) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const deleteRes = await client.query(
        "DELETE FROM subjects WHERE user_id = $1 AND name = $2 RETURNING *",
        [userId, name]
      );
      
      if (deleteRes.rows.length === 0) {
        throw new Error("Subject not found");
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Get enabled/disabled subjects
  findEnabledByUserId: async (userId) => {
    const res = await db.query(
      "SELECT * FROM subjects WHERE user_id = $1 AND is_enabled = true ORDER BY creation_date DESC", 
      [userId]
    );
    return res.rows;
  },
  
  findDisabledByUserId: async (userId) => {
    const res = await db.query(
      "SELECT * FROM subjects WHERE user_id = $1 AND is_enabled = false ORDER BY creation_date DESC", 
      [userId]
    );
    return res.rows;
  }
};

module.exports = subjectModel;