const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const s3Service = require('../../services/s3-service');
const { authMiddleware } = require('../middlewares/auth');
const db = require('../../config/db');
const { startProcessingQueue } = require('../../services/file-processing-job-queue');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/uploads/document/:subjectId
router.post('/document/:subjectId', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { subjectId } = req.params;
  const file = req.file;
  
  console.log(`Document upload request received for subject ${subjectId}, file: ${file.originalname}`);
  
  try {
    // Check if subject exists and belongs to user
    const subjectCheck = await db.query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, req.user.id]
    );
    
    if (subjectCheck.rows.length === 0) {
      console.log(`Subject not found or access denied: ${subjectId} for user ${req.user.id}`);
      return res.status(404).json({ error: 'Subject not found or access denied' });
    }
    
    // Generate unique key for S3
    const s3Key = `documents/${req.user.id}/${subjectId}/${uuidv4()}-${file.originalname}`;
    console.log(`Generated S3 key: ${s3Key}`);
    
    // Upload to S3
    console.log(`Uploading file to S3, size: ${file.size} bytes`);
    await s3Service.uploadFile(s3Key, file.buffer, file.mimetype);
    console.log(`File uploaded to S3 successfully`);
    
    // Record in database with 'pending' status
    const docResult = await db.query(
      `INSERT INTO subject_documents
       (subject_id, filename, s3_key, file_size, document_type, embedding_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, filename, upload_date, file_size, embedding_status`,
      [subjectId, file.originalname, s3Key, file.size, getDocumentType(file.originalname), 'pending']
    );
    console.log(`Document record created in database with ID: ${docResult.rows[0].id}`);
    
    // Trigger document processing queue
    console.log(`Triggering document processing queue`);
    startProcessingQueue(0); // Start processing immediately (0 minute interval)
    
    // Return success response to client
    res.status(201).json({
      document: docResult.rows[0],
      message: 'Document uploaded successfully and queued for processing'
    });
    
    console.log(`Document upload request completed successfully`);
  } catch (error) {
    console.error(`Error uploading document: ${error.message}`);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/uploads/documents/:subjectId
router.get('/documents/:subjectId', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { subjectId } = req.params;
  console.log(`Getting documents for subject ${subjectId}`);
  
  try {
    // Check if subject exists and belongs to user
    const subjectCheck = await db.query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, req.user.id]
    );
    
    if (subjectCheck.rows.length === 0) {
      console.log(`Subject not found or access denied: ${subjectId}`);
      return res.status(404).json({ error: 'Subject not found or access denied' });
    }
    
    // Get all documents for this subject
    const docResult = await db.query(
      `SELECT id, filename, upload_date, file_size, embedding_status, document_type
       FROM subject_documents
       WHERE subject_id = $1
       ORDER BY upload_date DESC`,
      [subjectId]
    );
    
    console.log(`Found ${docResult.rows.length} documents for subject ${subjectId}`);
    
    res.status(200).json({
      documents: docResult.rows
    });
  } catch (error) {
    console.error(`Error fetching documents: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// DELETE /api/uploads/document/:documentId
router.delete('/document/:documentId', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { documentId } = req.params;
  console.log(`Delete request received for document ${documentId}`);
  
  try {
    // Get document info and verify ownership
    const docResult = await db.query(
      `SELECT d.id, d.s3_key, d.subject_id
       FROM subject_documents d
       JOIN subjects s ON d.subject_id = s.id
       WHERE d.id = $1 AND s.user_id = $2`,
      [documentId, req.user.id]
    );
    
    if (docResult.rows.length === 0) {
      console.log(`Document not found or access denied: ${documentId}`);
      return res.status(404).json({ error: 'Document not found or access denied' });
    }
    
    const document = docResult.rows[0];
    
    // Delete from S3
    console.log(`Deleting document from S3: ${document.s3_key}`);
    await s3Service.deleteFile(document.s3_key);
    
    // Delete chunks
    console.log(`Deleting document chunks from database`);
    await db.query(
      'DELETE FROM document_chunks WHERE document_id = $1',
      [documentId]
    );
    
    // Delete from database
    console.log(`Deleting document record from database`);
    await db.query(
      'DELETE FROM subject_documents WHERE id = $1',
      [documentId]
    );
    
    res.status(200).json({
      message: 'Document deleted successfully'
    });
    
    console.log(`Document ${documentId} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting document: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Helper to determine document type
function getDocumentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'word',
    'docx': 'word',
    'txt': 'text',
    'md': 'markdown'
  };
  
  return typeMap[ext] || 'unknown';
}

module.exports = router;