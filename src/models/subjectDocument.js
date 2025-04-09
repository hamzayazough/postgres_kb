const db = require('../config/db');
const s3Service = require('../services/s3-service');

const subjectDocumentModel = {
  findBySubjectId: async (subjectId) => {
    const res = await db.query(
      `SELECT id, filename, upload_date, file_size, embedding_status, document_type
       FROM subject_documents
       WHERE subject_id = $1
       ORDER BY upload_date DESC`,
      [subjectId]
    );
    return res.rows;
  },

  findById: async (id) => {
    const res = await db.query(
      `SELECT id, subject_id, filename, s3_key, upload_date, file_size, 
       embedding_status, document_type
       FROM subject_documents
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  delete: async (id, userId) => {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // First verify the document belongs to a subject owned by this user
      const authCheck = await client.query(
        `SELECT d.id, d.s3_key
         FROM subject_documents d
         JOIN subjects s ON d.subject_id = s.id
         WHERE d.id = $1 AND s.user_id = $2`,
        [id, userId]
      );
      
      if (authCheck.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      const document = authCheck.rows[0];
      
      // Delete from S3 
      await s3Service.deleteFile(document.s3_key);
      
      // Delete from database
      const result = await client.query(
        'DELETE FROM subject_documents WHERE id = $1 RETURNING id',
        [id]
      );
      
      await client.query('COMMIT');
      
      return { id: result.rows[0].id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = subjectDocumentModel;