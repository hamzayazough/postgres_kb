const db = require('../config/db');

const usageModel = {
  /**
   * Record API usage
   * @param {Object} usage - Usage data
   * @returns {Promise<Object>} - Recorded usage
   */
  recordUsage: async (usage) => {
    const { user_id, model, input_tokens, output_tokens, duration_ms, timestamp } = usage;
    
    // If user_id is null, we don't record usage (for unauthenticated requests)
    if (!user_id) return null;
    
    const res = await db.query(
      `INSERT INTO usages 
       (user_id, model, input_tokens, output_tokens, duration_ms, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, model, input_tokens, output_tokens, duration_ms, timestamp]
    );
    
    return res.rows[0];
  },
  
  
  /**
   * Get user's total usage for the current month
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Total tokens used
   */
  getMonthlyUsage: async (userId) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const res = await db.query(
      `SELECT SUM(input_tokens + output_tokens) as total_tokens
       FROM usages
       WHERE user_id = $1 AND timestamp >= $2`,
      [userId, firstDayOfMonth]
    );
    
    return parseInt(res.rows[0]?.total_tokens || 0);
  },
  
  /**
   * Get user's quota information
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Quota information
   */
  getUserQuota: async (userId) => {
    let quotaRes = await db.query(
      "SELECT * FROM user_quotas WHERE user_id = $1",
      [userId]
    );
    
    if (quotaRes.rows.length === 0) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      quotaRes = await db.query(
        `INSERT INTO user_quotas 
         (user_id, monthly_token_limit, reset_date)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, 1000000, nextMonth]
      );
    }
    
    const quota = quotaRes.rows[0];
    const used = await usageModel.getMonthlyUsage(userId);
    
    return {
      limit: quota.monthly_token_limit,
      used,
      remaining: Math.max(0, quota.monthly_token_limit - used),
      resetDate: quota.reset_date
    };
  },
  
  /**
   * Update user's monthly token limit
   * @param {number} userId - User ID
   * @param {number} newLimit - New token limit
   * @returns {Promise<Object>} - Updated quota
   */
  updateUserQuota: async (userId, newLimit) => {
    const res = await db.query(
      `UPDATE user_quotas
       SET monthly_token_limit = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [userId, newLimit]
    );
    
    return res.rows[0];
  },
  
  /**
   * Get usage statistics for a user
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} - Usage statistics
   */
  getUserUsageStats: async (userId, startDate, endDate) => {
    const res = await db.query(
      `SELECT 
        DATE(timestamp) as date,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        COUNT(*) as request_count
       FROM usages
       WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
       GROUP BY DATE(timestamp)
       ORDER BY date`,
      [userId, startDate, endDate]
    );
    
    return res.rows;
  }
};

module.exports = usageModel;