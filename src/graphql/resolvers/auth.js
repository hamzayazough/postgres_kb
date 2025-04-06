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

    
    updatePhoneNumberAndUsername: async (_, { phoneNumber, username }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      if (!phoneNumber || !username) {
        throw new Error('Phone number and username are required');
      }
      
      const updatedUser = await userModel.update(context.user.id, {
        phone_number: phoneNumber,
        username: username
      });
      
      return updatedUser;
    }
  }
};