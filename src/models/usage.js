const db = require('../config/db');
const fs = require('fs');

function logToFile(message, data = '') {
  try {
    const logMessage = `[${new Date().toISOString()}] ${message} ${
      typeof data === 'object' ? JSON.stringify(data) : data
    }\n`;
    fs.appendFileSync('./usage-model-debug.log', logMessage);
  } catch (err) {
  }
}

const usageModel = {
  /**
   * Record API usage
   * @param {Object} usage - Usage data
   * @returns {Promise<Object>} - Recorded usage
   */
  recordUsage: async (usage) => {
    const { user_id, model, input_tokens, output_tokens, duration_ms, timestamp } = usage;
    
    if (!user_id) return null;
    
    try {
      const res = await db.query(
        `INSERT INTO usages
          (user_id, model, input_tokens, output_tokens, duration_ms, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user_id, model, input_tokens, output_tokens, duration_ms, timestamp]
      );
      
      return res.rows[0];
    } catch (error) {
      logToFile('Error in recordUsage:', error);
      return null;
    }
  },
    
  /**
   * Get user's total usage for the current month
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Total tokens used
   */
  getMonthlyUsage: async (userId) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      logToFile('Getting monthly usage for user:', { userId, firstDayOfMonth });
      
      const res = await db.query(
        `SELECT COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
         FROM usages
         WHERE user_id = $1 AND timestamp >= $2`,
        [userId, firstDayOfMonth]
      );
      
      const totalTokens = parseInt(res.rows[0]?.total_tokens || 0);
      logToFile('Monthly usage result:', totalTokens);
      
      return totalTokens;
    } catch (error) {
      logToFile('Error in getMonthlyUsage:', error);
      return 0;
    }
  },
  
  /**
   * Get user's quota information
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Quota information
   */
  getUserQuota: async (userId) => {
    try {
      if (!userId) {
        logToFile('getUserQuota called with invalid userId:', userId);
        return {
          limit: 1000000,
          used: 0,
          remaining: 1000000,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }
      
      logToFile('Getting quota for user:', userId);
      
      let quotaRes = await db.query(
        "SELECT * FROM user_quotas WHERE user_id = $1",
        [userId]
      );
      
      logToFile('Initial quota query result count:', quotaRes.rows.length);
      
      if (quotaRes.rows.length === 0) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        logToFile('Creating default quota for user:', userId);
        
        try {
          quotaRes = await db.query(
            `INSERT INTO user_quotas
              (user_id, monthly_token_limit, reset_date)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, 1000000, nextMonth]
          );
          
          logToFile('Default quota created:', quotaRes.rows[0]);
        } catch (insertError) {
          logToFile('Error creating default quota:', insertError);
          
          return {
            limit: 1000000,
            used: 0,
            remaining: 1000000,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          };
        }
      }
      
      const quota = quotaRes.rows[0];
      logToFile('Quota from database:', quota);
      
      const used = await usageModel.getMonthlyUsage(userId);
      
      const result = {
        limit: parseInt(quota.monthly_token_limit) || 0,
        used: used || 0,
        remaining: Math.max(0, parseInt(quota.monthly_token_limit) - used),
        resetDate: quota.reset_date instanceof Date 
          ? quota.reset_date.toISOString() 
          : quota.reset_date
      };
      
      logToFile('Final quota result:', result);
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
  
  /**
   * Update user's monthly token limit
   * @param {number} userId - User ID
   * @param {number} newLimit - New token limit
   * @returns {Promise<Object>} - Updated quota
   */
  updateUserQuota: async (userId, newLimit) => {
    try {
      logToFile('Updating quota for user:', { userId, newLimit });
      
      const res = await db.query(
        `UPDATE user_quotas
         SET monthly_token_limit = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING *`,
        [userId, newLimit]
      );
      
      if (res.rows.length === 0) {
        logToFile('No quota found to update for user:', userId);
        throw new Error(`No quota found for user ${userId}`);
      }
      
      logToFile('Updated quota:', res.rows[0]);
      return res.rows[0];
    } catch (error) {
      logToFile('Error updating quota:', error);
      throw error;
    }
  },
  
  /**
   * Get usage statistics for a user
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} - Usage statistics
   */
  getUserUsageStats: async (userId, startDate, endDate) => {
    try {
      if (!userId || !startDate || !endDate) {
        logToFile('getUserUsageStats called with invalid parameters:', { userId, startDate, endDate });
        return [];
      }
      
      logToFile('Getting usage stats for user:', { 
        userId, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      
      const res = await db.query(
        `SELECT
           DATE(timestamp) as date,
           COALESCE(SUM(input_tokens), 0) as input_tokens,
           COALESCE(SUM(output_tokens), 0) as output_tokens,
           COUNT(*) as request_count
         FROM usages
         WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
         GROUP BY DATE(timestamp)
         ORDER BY date`,
        [userId, startDate, endDate]
      );
      
      logToFile(`Found ${res.rows.length} days of stats`);
      return res.rows;
    } catch (error) {
      logToFile('Error getting usage stats:', error);
      return [];
    }
  }
};

module.exports = usageModel;