const userModel = require('../../models/user');

module.exports = {
  Query: {
    getUser: async (_, { id }) => {
      return await userModel.findById(id);
    }
  },
  Mutation: {
    authenticateUser: async (_, { username, email }) => {
      const user = await userModel.findOrCreate(username, email);
      await userModel.updateLastLogin(user.id);
      return user;
    },
    
    updateUser: async (_, { id, userData }) => {
      return await userModel.update(id, userData);
    }
  }
};