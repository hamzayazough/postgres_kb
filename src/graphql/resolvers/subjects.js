const subjectModel = require('../../models/subject');
const userModel = require('../../models/user');

module.exports = {
  Query: {
    getSubjects: async (_, { userId }) => {
      return await subjectModel.findByUserId(userId);
    },
    
    getEnabledSubjects: async (_, { userId }) => {
      return await subjectModel.findEnabledByUserId(userId);
    },
    
    getDisabledSubjects: async (_, { userId }) => {
      return await subjectModel.findDisabledByUserId(userId);
    },
    
    getSubject: async (_, { id }) => {
      return await subjectModel.findById(id);
    }
  },
  Mutation: {
    createSubject: async (_, { userId, name }) => {
      return await subjectModel.create(userId, name);
    },
    
    updateSubject: async (_, { id, updates }) => {
      return await subjectModel.update(id, updates);
    },
    
    deleteSubject: async (_, { username, subjectName }) => {
      const user = await userModel.findByUsername(username);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      return await subjectModel.delete(user.id, subjectName);
    }
  }
};