const db = require('../config/db');
const s3Service = require('./s3-service');
const { getEmbedding } = require('./embedding-service');
const textExtractorService = require('./text-extracter-service');
const { countTokens } = require('./../utils/token-counter');
const usageModel = require('../models/usage');

const processPdf = async (documentId, s3Key) => {
  console.log(`Starting to process document ${documentId} with S3 key ${s3Key}`);
  
  try {
    const docInfo = await db.query(
      `SELECT d.id, d.subject_id, s.user_id 
       FROM subject_documents d
       JOIN subjects s ON d.subject_id = s.id
       WHERE d.id = $1`,
      [documentId]
    );
    
    if (docInfo.rows.length === 0) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    const userId = docInfo.rows[0].user_id;
    console.log(`Processing document for user ${userId}`);
    
    let inputTokens = 0;
    let outputTokens = 0;
    const startTime = Date.now();
    
    console.log(`Downloading file from S3: ${s3Key}`);
    const fileBuffer = await s3Service.getFile(s3Key);
    console.log(`File downloaded successfully, size: ${fileBuffer.length} bytes`);
    
    console.log(`Extracting text using Document AI`);
    const text = await textExtractorService.extractTextWithDocumentAI(fileBuffer);
    console.log(`Text extraction complete, extracted ${text.length} characters`);
    
    inputTokens += countTokens(text);
    console.log(`Document text contains ${inputTokens} tokens`);
    
    const chunks = splitTextIntoChunks(text);
    console.log(`Text split into ${chunks.length} chunks`);
    
    const dbClient = await db.getClient();
    
    try {
      await dbClient.query('BEGIN');
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const chunkTokens = countTokens(chunk.text);
        console.log(`Chunk ${i+1}: ${chunkTokens} tokens`);
        
        const embedding = await getEmbedding(chunk.text);
        const embeddingStr = "[" + embedding.join(",") + "]";
        console.log(`Generated embedding for chunk ${i+1}`);
        
        outputTokens += embedding.length;
        
        await dbClient.query(
          `INSERT INTO document_chunks 
           (document_id, chunk_text, metadata, embedding, chunk_index)
           VALUES ($1, $2, $3, $4, $5)`,
          [documentId, chunk.text, JSON.stringify(chunk.metadata), embeddingStr, i]
        );
        console.log(`Saved chunk ${i+1} to database`);
      }
      
      await dbClient.query(
        `UPDATE subject_documents
         SET embedding_status = 'completed'
         WHERE id = $1`,
        [documentId]
      );
      console.log(`Updated document status to completed`);
      
      await dbClient.query('COMMIT');
      console.log(`Committed transaction, all chunks saved`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      await usageModel.recordUsage({
        user_id: userId,
        model: 'document-processing',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        duration_ms: duration,
        timestamp: new Date()
      });
      
      console.log(`Recorded usage: ${inputTokens} input tokens, ${outputTokens} output tokens, ${duration}ms`);
      
    } catch (error) {
      await dbClient.query('ROLLBACK');
      console.error(`Error saving chunks to database: ${error.message}`);
      
      await db.query(
        `UPDATE subject_documents
         SET embedding_status = 'failed'
         WHERE id = $1`,
        [documentId]
      );
      console.log(`Marked document as failed`);
      
      throw error;
    } finally {
      dbClient.release();
    }
    
    console.log(`Document ${documentId} processing complete`);
    return true;
    
  } catch (error) {
    console.error(`Failed to process document ${documentId}: ${error.message}`);
    throw error;
  }
};

const splitTextIntoChunks = (text, options = {}) => {
  const { 
    minSize = 300,
    maxSize = 500,
    overlap = 50
  } = options;
  
  const sections = splitByHeadings(text);
  
  const chunks = [];
  
  for (const section of sections) {
    if (countTokens(section.text) <= maxSize) {
      chunks.push({
        text: section.text,
        metadata: { 
          heading: section.heading,
          page: section.page
        }
      });
      continue;
    }
    
    const paragraphs = section.text.split(/\n\s*\n/);
    let currentChunk = "";
    let chunkMetadata = { 
      heading: section.heading,
      page: section.page
    };
    
    for (const para of paragraphs) {
      if (countTokens(currentChunk + para) > maxSize && currentChunk) {
        chunks.push({
          text: currentChunk,
          metadata: chunkMetadata
        });
        
        const words = currentChunk.split(' ');
        const overlapText = words.slice(-overlap/4).join(' ');
        currentChunk = overlapText + " " + para;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + para;
      }
    }
    
    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        metadata: chunkMetadata
      });
    }
  }
  
  return chunks;
};

const splitByHeadings = (text) => {
  const headingPattern = /(?:\n|^)(#{1,6} .+|\d+\.\s+.+|Chapter \d+|Section \d+(\.\d+)*)/g;
  const sections = [];
  let lastIndex = 0;
  let lastHeading = null;
  let currentPage = 1;
  
  const pageMatches = text.matchAll(/\f|\[Page (\d+)\]/g);
  const pageMap = new Map();
  
  for (const match of pageMatches) {
    if (match[1]) {
      currentPage = parseInt(match[1]);
    } else {
      currentPage++;
    }
    pageMap.set(match.index, currentPage);
  }
  
  const getPageForPosition = (pos) => {
    let nearestPage = 1;
    let nearestPos = 0;
    
    for (const [position, page] of pageMap.entries()) {
      if (position <= pos && position > nearestPos) {
        nearestPos = position;
        nearestPage = page;
      }
    }
    
    return nearestPage;
  };
  
  const matches = text.matchAll(headingPattern);
  for (const match of matches) {
    if (lastIndex > 0) {
      sections.push({
        heading: lastHeading,
        text: text.substring(lastIndex, match.index),
        page: getPageForPosition(lastIndex)
      });
    }
    
    lastHeading = match[0].trim();
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    sections.push({
      heading: lastHeading,
      text: text.substring(lastIndex),
      page: getPageForPosition(lastIndex)
    });
  }
  
  return sections;
};

module.exports = {
  processPdf,
  splitTextIntoChunks
};