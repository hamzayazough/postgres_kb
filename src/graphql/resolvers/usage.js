const usageModel = require('../../models/usage');

module.exports = {
  Query: {
    getUserQuota: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      const quota = await usageModel.getUserQuota(context.user.id);
      if (!quota) {
        return {
          limit: 1000000,
          used: 0,
          remaining: 1000000,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }
            return quota;
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
      
      return stats
        ? stats.map(stat => ({
            date: stat.date,
            inputTokens: parseInt(stat.input_tokens, 10),
            outputTokens: parseInt(stat.output_tokens, 10),
            requestCount: parseInt(stat.request_count, 10)
          }))
        : [];
    }
  },
  
  Mutation: {
    updateUserQuota: async (_, { userId, newLimit }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      if (!context.user.is_admin) {
        throw new Error('Admin privileges required');
      }
      
      await usageModel.updateUserQuota(userId, newLimit);
      return await usageModel.getUserQuota(userId);
    }
  }
};
