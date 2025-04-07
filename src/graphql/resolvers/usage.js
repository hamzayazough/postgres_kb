const usageModel = require('../../models/usage');
const fs = require('fs');


function logToFile(message, data = '') {
  try {
    const logMessage = `[${new Date().toISOString()}] ${message} ${
      typeof data === 'object' ? JSON.stringify(data) : data
    }\n`;
    fs.appendFileSync('./graphql-debug.log', logMessage);
  } catch (err) {
  }
}

module.exports = {
  Query: {
    getUserQuota: async (_, __, context) => {
      logToFile('getUserQuota called with context:', context);
      
      if (!context.user) {
        logToFile('Authentication required in getUserQuota');
        throw new Error('Authentication required');
      }
      
      try {
        logToFile('Fetching quota for user:', context.user.id);
        const quota = await usageModel.getUserQuota(context.user.id);
        logToFile('Retrieved quota:', quota);
        
        if (!quota) {
          logToFile('No quota found, returning default');
          return {
            limit: 1000000,
            used: 0,
            remaining: 1000000,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          };
        }
        
        const result = {
          limit: parseInt(quota.limit) || 0,
          used: parseInt(quota.used) || 0,
          remaining: parseInt(quota.remaining) || 0,
          resetDate: quota.resetDate instanceof Date 
            ? quota.resetDate.toISOString() 
            : quota.resetDate
        };
        
        logToFile('Formatted quota result:', result);
        return result;
      } catch (error) {
        logToFile('Error in getUserQuota:', error);
        return {
          limit: 1000000,
          used: 0,
          remaining: 1000000,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }
    },
    
    getUserUsageStats: async (_, { startDate, endDate }, context) => {
      logToFile('getUserUsageStats called with dates:', { startDate, endDate });
      
      if (!context.user) {
        logToFile('Authentication required in getUserUsageStats');
        throw new Error('Authentication required');
      }
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          logToFile('Invalid date parameters:', { startDate, endDate });
          return [];
        }
        
        logToFile('Fetching stats for user:', context.user.id);
        const stats = await usageModel.getUserUsageStats(context.user.id, start, end);
        logToFile('Retrieved stats count:', stats?.length || 0);
        
        const formattedStats = stats.map(stat => ({
          date: stat.date instanceof Date 
            ? stat.date.toISOString().split('T')[0] 
            : String(stat.date),
          inputTokens: parseInt(stat.input_tokens || 0),
          outputTokens: parseInt(stat.output_tokens || 0),
          requestCount: parseInt(stat.request_count || 0)
        }));
        
        logToFile('Formatted stats result:', formattedStats);
        return formattedStats;
      } catch (error) {
        logToFile('Error in getUserUsageStats:', error);
        return [];
      }
    }
  },
  
  Mutation: {
    updateUserQuota: async (_, { userId, newLimit }, context) => {
      logToFile('updateUserQuota called:', { userId, newLimit });
      
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      if (!context.user.is_admin) {
        throw new Error('Admin privileges required');
      }
      
      try {
        await usageModel.updateUserQuota(userId, newLimit);
        const quota = await usageModel.getUserQuota(userId);
        
        return {
          limit: parseInt(quota.limit) || 0,
          used: parseInt(quota.used) || 0,
          remaining: parseInt(quota.remaining) || 0,
          resetDate: quota.resetDate instanceof Date 
            ? quota.resetDate.toISOString() 
            : quota.resetDate
        };
      } catch (error) {
        logToFile('Error in updateUserQuota:', error);
        throw error;
      }
    }
  }
};