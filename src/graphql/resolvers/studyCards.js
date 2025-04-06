const studyCardModel = require('../../models/studyCard');

module.exports = {
  Query: {
    getStudyCards: async (_, { subjectId }) => {
      return await studyCardModel.findBySubjectId(subjectId);
    },
    
    getStudyCard: async (_, { id }) => {
      return await studyCardModel.findById(id);
    }
  },
  
  Mutation: {
    addStudyCard: async (_, { subjectId, title, content, date }) => {
      return await studyCardModel.create(subjectId, title, content, date);
    },
    
    updateStudyCard: async (_, { id, title, content }) => {
      return await studyCardModel.update(id, title, content);
    },
    
    deleteStudyCard: async (_, { id }) => {
      return await studyCardModel.delete(id);
    }
  }
};