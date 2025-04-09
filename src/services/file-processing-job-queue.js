const db = require('../config/db');
const documentProcessor = require('./document-processing-service');

let isProcessing = false;

const processNextPendingDocument = async () => {
  if (isProcessing) {
    console.log('Document processing already in progress, skipping');
    return null;
  }
  
  isProcessing = true;
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    console.log('Transaction started for processing document queue');
    
    const result = await client.query(
      `SELECT id, s3_key FROM subject_documents
       WHERE embedding_status = 'pending' 
       ORDER BY upload_date ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );
    
    if (result.rows.length === 0) {
      console.log('No pending documents found for processing');
      await client.query('COMMIT');
      isProcessing = false;
      return null;
    }
    
    const doc = result.rows[0];
    console.log(`Found pending document ${doc.id} with S3 key ${doc.s3_key}`);
    
    await client.query(
      `UPDATE subject_documents
       SET embedding_status = 'processing'
       WHERE id = $1`,
      [doc.id]
    );
    console.log(`Updated document ${doc.id} status to 'processing'`);
    
    await client.query('COMMIT');
    console.log(`Transaction committed, now processing document ${doc.id}`);
    
    try {
      console.log(`Calling document processor for document ${doc.id}`);
      await documentProcessor.processPdf(doc.id, doc.s3_key);
      console.log(`Document ${doc.id} processed successfully`);
    } catch (processingError) {
      console.error(`Error in document processing: ${processingError.message}`);
      await db.query(
        `UPDATE subject_documents
         SET embedding_status = 'failed'
         WHERE id = $1`,
        [doc.id]
      );
      console.log(`Updated document ${doc.id} status to 'failed'`);
    }
    
    isProcessing = false;
    return doc.id;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error processing document queue: ${error.message}`);
    isProcessing = false;
    throw error;
  } finally {
    client.release();
  }
};

const startProcessingQueue = (intervalMinutes = 5) => {
  console.log(`Starting document processing queue with ${intervalMinutes} minute interval`);
  const intervalMs = intervalMinutes * 60 * 1000 || 1000;
  
  const processQueue = async () => {
    console.log('Processing document queue started');
    try {
      let processedDoc = await processNextPendingDocument();
      
      while (processedDoc) {
        console.log(`Successfully processed document ${processedDoc}, checking for more`);
        processedDoc = await processNextPendingDocument();
      }
      
      console.log('No more documents to process');
    } catch (error) {
      console.error(`Error in queue processing: ${error.message}`);
    }
  };
  
  processQueue();
  
  if (intervalMinutes > 0) {
    console.log(`Setting up recurring process every ${intervalMinutes} minutes`);
    return setInterval(processQueue, intervalMs);
  } else {
    console.log('No recurring process scheduled (interval is 0)');
    return null;
  }
};

module.exports = {
  startProcessingQueue,
  processNextPendingDocument
};