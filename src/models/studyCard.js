const db = require('../config/db');

const studyCardModel = {
  findBySubjectId: async (subjectId) => {
    const res = await db.query(
      "SELECT * FROM study_cards WHERE subject_id = $1 ORDER BY date DESC",
      [subjectId]
    );
    return res.rows;
  },
  
  findById: async (id) => {
    const res = await db.query(
      "SELECT * FROM study_cards WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  },
  
  create: async (subjectId, title, content, date = null) => {
    const cardDate = date || new Date().toISOString();
    
    const res = await db.query(
      `INSERT INTO study_cards (subject_id, title, content, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [subjectId, title, content, cardDate]
    );
    return res.rows[0];
  },
  
  update: async (id, title, content) => {
    const res = await db.query(
      `UPDATE study_cards 
       SET title = $2, content = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, title, content]
    );
    return res.rows[0];
  },
  
  delete: async (id) => {
    const res = await db.query(
      "DELETE FROM study_cards WHERE id = $1 RETURNING *",
      [id]
    );
    return res.rows[0];
  }
};

module.exports = studyCardModel;