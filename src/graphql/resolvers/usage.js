const usageModel = require('../../models/usage');

module.exports = {
  Query: {
    getUserQuota: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      return await usageModel.getUserQuota(context.user.id);
    },
    
    getUserUsageStats: async (_, { startDate, endDate }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      const stats = await usageModel.getUserUsageStats(
        context.user.id,
        new Date(startDate),
        new Date(endDate)
      );
      
      return stats.map(stat => ({
        date: stat.date,
        inputTokens: parseInt(stat.input_tokens),
        outputTokens: parseInt(stat.output_tokens),
        requestCount: parseInt(stat.request_count)
      }));
    }
  },
  
  Mutation: {
    updateUserQuota: async (_, { userId, newLimit }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      // Check if user is admin (you'll need to implement this)
      if (!context.user.is_admin) {
        throw new Error('Admin privileges required');
      }
      
      await usageModel.updateUserQuota(userId, newLimit);
      return await usageModel.getUserQuota(userId);
    }
  }
};