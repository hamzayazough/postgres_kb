const db = require('../config/db');

const messageModel = {
  findBySubjectId: async (subjectId) => {
    const res = await db.query(
      "SELECT * FROM messages WHERE subject_id = $1 ORDER BY creation_date",
      [subjectId]
    );
    return res.rows;
  },
  
  findById: async (id) => {
    const res = await db.query(
      "SELECT * FROM messages WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  },
  
  create: async (subjectId, role, content, embedding) => {
    const embeddingStr = "[" + embedding.join(",") + "]";
    
    const res = await db.query(
      `INSERT INTO messages (subject_id, role, content, embedding, creation_date)
       VALUES ($1, $2, $3, $4::vector(1536), CURRENT_TIMESTAMP)
       RETURNING *`,
      [subjectId, role, content, embeddingStr]
    );
    return res.rows[0];
  },
  
  update: async (id, content) => {
    // Note: We don't update the embedding here as that would require regenerating it
    // If that's needed, it should be handled at the resolver level
    const res = await db.query(
      `UPDATE messages
       SET content = $2
       WHERE id = $1
       RETURNING *`,
      [id, content]
    );
    return res.rows[0];
  },
  
  delete: async (id) => {
    const res = await db.query(
      "DELETE FROM messages WHERE id = $1 RETURNING *",
      [id]
    );
    return res.rows[0];
  },
  
  search: async (subjectId, embedding) => {
    const embeddingStr = "[" + embedding.join(",") + "]";
    
    const res = await db.query(
      `SELECT id, role, content, creation_date
       FROM messages
       WHERE subject_id = $1
       ORDER BY embedding <-> $2::vector(1536)
       LIMIT 5;`,
      [subjectId, embeddingStr]
    );
    return res.rows;
  }
};

module.exports = messageModel;