const db = require('../config/db');

const questionCardModel = {
  findBySubjectId: async (subjectId) => {
    const res = await db.query(
      "SELECT * FROM question_cards WHERE subject_id = $1 ORDER BY date DESC",
      [subjectId]
    );
    
    return res.rows.map(row => ({
      ...row,
      options: row.options
    }));
  },
  
  findById: async (id) => {
    const res = await db.query(
      "SELECT * FROM question_cards WHERE id = $1",
      [id]
    );
    
    if (res.rows.length === 0) {
      return null;
    }
    
    const card = res.rows[0];
    return {
      ...card,
      options: card.options
    };
  },
  
  create: async (subjectId, question, options, date = null) => {
    const cardDate = date || new Date().toISOString();
    
    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
    
    const res = await db.query(
      `INSERT INTO question_cards (subject_id, question, options, date)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING *`,
      [subjectId, question, optionsJson, cardDate]
    );
    
    const card = res.rows[0];
    return {
      ...card,
      options: card.options
    };
  },
  
  update: async (id, question, options) => {
    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
    
    const res = await db.query(
      `UPDATE question_cards 
       SET question = $2, options = $3::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, question, optionsJson]
    );
    
    const card = res.rows[0];
    return {
      ...card,
      options: card.options
    };
  },
  
  delete: async (id) => {
    const res = await db.query(
      "DELETE FROM question_cards WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (res.rows.length === 0) {
      return null;
    }
    
    const card = res.rows[0];
    return {
      ...card,
      options: card.options
    };
  }
};

module.exports = questionCardModel;