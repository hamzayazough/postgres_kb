const { getEmbedding } = require('./embedding-service');
const db = require('../config/db');

const searchContextForQuery = async (subjectId, queryText) => {
  const queryEmbedding = await getEmbedding(queryText);
  const embeddingStr = "[" + queryEmbedding.join(",") + "]";
  
  const messagesQuery = await db.query(
    `SELECT id, role, content, embedding <-> $2::vector(1536) as similarity_score
     FROM messages
     WHERE subject_id = $1
     ORDER BY similarity_score
     LIMIT 20`,
    [subjectId, embeddingStr]
  );
  
  const chunksQuery = await db.query(
    `SELECT dc.chunk_text, dc.metadata, sd.filename, dc.embedding <-> $2::vector(1536) as similarity_score
     FROM document_chunks dc
     JOIN subject_documents sd ON dc.document_id = sd.id
     WHERE sd.subject_id = $1
     ORDER BY similarity_score
     LIMIT 20`,
    [subjectId, embeddingStr]
  );
  
  const allResults = [
    ...messagesQuery.rows.map(m => ({
      type: 'message',
      data: m,
      score: m.similarity_score
    })),
    ...chunksQuery.rows.map(c => ({
      type: 'chunk',
      data: c,
      score: c.similarity_score
    }))
  ].sort((a, b) => a.score - b.score);
  
  const topResults = allResults.slice(0, 8);
  
  const relevantMessages = topResults
    .filter(r => r.type === 'message')
    .map(r => r.data);
  
  const relevantChunks = topResults
    .filter(r => r.type === 'chunk')
    .map(r => r.data);
  
  const messageContext = relevantMessages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n\n");
  
  const documentContext = relevantChunks
    .map(c => {
      const source = `[Source: ${c.filename}${c.metadata.page ? `, Page ${c.metadata.page}` : ''}]`;
      return `${source}\n${c.chunk_text}`;
    })
    .join("\n\n");
  
  return {
    messageContext,
    documentContext,
    combinedContext: `${documentContext}\n\n${messageContext}`
  };
};

module.exports = {
  searchContextForQuery
};