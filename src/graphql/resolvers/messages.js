const messageModel = require('../../models/message');
const { getEmbedding } = require('../../services/embedding-service');

module.exports = {
  Query: {
    getMessages: async (_, { subjectId }) => {
      return await messageModel.findBySubjectId(subjectId);
    },
    
    getMessage: async (_, { id }) => {
      return await messageModel.findById(id);
    },
    
    searchMessages: async (_, { subjectId, query }) => {
      const queryEmbedding = await getEmbedding(query);
      return await messageModel.search(subjectId, queryEmbedding);
    }
  },
  Mutation: {
    addMessage: async (_, { subjectId, role, content }) => {
      const embedding = await getEmbedding(content);
      return await messageModel.create(subjectId, role, content, embedding);
    },
    
    updateMessage: async (_, { id, content }) => {
      //TODO:  For now, we're just updating the content text, not the embedding we'd need to regenerate the embedding too
      return await messageModel.update(id, content);
    },
    
    deleteMessage: async (_, { id }) => {
      return await messageModel.delete(id);
    }
  }
};