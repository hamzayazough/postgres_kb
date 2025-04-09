const subjectDocumentModel = require('../../models/subjectDocument');

module.exports = {
  Query: {
    getSubjectDocuments: async (_, { subjectId }, { user }) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      
      const documents = await subjectDocumentModel.findBySubjectId(subjectId);
      
      return documents.map(doc => ({
        ...doc,
        upload_date: doc.upload_date.toISOString()
      }));
    }
  },
  
  Mutation: {
    deleteSubjectDocument: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      
      const result = await subjectDocumentModel.delete(id, user.id);
      return { id: result.id };
    }
  }
};