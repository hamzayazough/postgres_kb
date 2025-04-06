const questionCardModel = require('../../models/questionCard');

module.exports = {
  Query: {
    getQuestionCards: async (_, { subjectId }) => {
      return await questionCardModel.findBySubjectId(subjectId);
    },
    
    getQuestionCard: async (_, { id }) => {
      return await questionCardModel.findById(id);
    }
  },
  
  Mutation: {
    addQuestionCard: async (_, { subjectId, question, options, date }) => {
      return await questionCardModel.create(subjectId, question, options, date);
    },
    
    updateQuestionCard: async (_, { id, question, options }) => {
      return await questionCardModel.update(id, question, options);
    },
    
    deleteQuestionCard: async (_, { id }) => {
      return await questionCardModel.delete(id);
    }
  }
};