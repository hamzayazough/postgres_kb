const subjectModel = require('../../models/subject');
const userModel = require('../../models/user');

module.exports = {
  Query: {
    getSubjects: async (_, { userId }) => {
      return await subjectModel.findByUserId(userId);
    }
  },
  Mutation: {
    createSubject: async (_, { userId, name }) => {
      return await subjectModel.create(userId, name);
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