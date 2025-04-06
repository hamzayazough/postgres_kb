const userModel = require('../../models/user');

module.exports = {
  Query: {
    getCurrentUser: async (_, __, context) => {
      if (!context.user) {
        return null;
      }
      
      return context.user;
    }
  },
  
  Mutation: {
    syncFirebaseUser: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      return context.user;
    },
    
    updatePhoneNumber: async (_, { phoneNumber }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const updatedUser = await userModel.update(context.user.id, {
        phone_number: phoneNumber
      });
      
      return updatedUser;
    }
  }
};