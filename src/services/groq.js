const { encodingForModel } = require("@dqbd/tiktoken");
const encoder = encodingForModel("gpt-3.5-turbo"); // TODO: Update to the correct model if needed

const Groq = require('groq');
const usageModel = require('../models/usage');
const MAX_CONTEXT_TOKENS = 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groqService = {
  /**
   * Create a chat completion using Groq API
   * @param {number} userId - User ID for tracking usage
   * @param {Array} messages - Array of message objects
   * @param {string} contextString - Optional context to include
   * @param {string} model - The model to use (default: llama-3.3-70b-versatile)
   * @returns {Promise<Object>} - Groq API response
   */
  createChatCompletion: async (userId, messages, contextString = "", model = 'llama-3.3-70b-versatile') => {
    try {
      // Initialize Groq client
      const groq = new Groq({ apiKey: GROQ_API_KEY });
      
      // Prepare messages with context if available
      let messagesForAI = [...messages];
      
      if (contextString && contextString.trim() !== "") {
        const systemPrompt = `Context:\n${contextString}\n\nPlease use the above context to inform your response.`;
        messagesForAI = [{ role: "system", content: systemPrompt }, ...messagesForAI];
      }
      
      // Estimate token count (simplified)
      const inputTokens = messagesForAI.reduce((count, msg) => count + countTokens(msg.content), 0);
      
      // Call Groq API
      const startTime = Date.now();
      const response = await groq.chat.completions.create({
        messages: messagesForAI,
        model,
      });
      const endTime = Date.now();
      
      // Get the AI response
      const aiMessage = response.choices[0].message.content;
      
      // Calculate response tokens
      const outputTokens = countTokens(aiMessage);
      
      // Record usage if userId is provided
      if (userId) {
        await usageModel.recordUsage({
          user_id: userId,
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          duration_ms: endTime - startTime,
          timestamp: new Date()
        });
      }
      
      return {
        content: aiMessage,
        modelUsed: model,
        inputTokens,
        outputTokens
      };
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw new Error(`Failed to get response from Groq: ${error.message}`);
    }
  },
  
  /**
   * Check if user has exceeded quota
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if user has exceeded quota
   */
  hasExceededQuota: async (userId) => {
    if (!userId) return false;
    const userQuota = await usageModel.getUserQuota(userId);
    return userQuota.used >= userQuota.limit;
  },
  
  /**
   * Build context string from relevant messages
   * @param {Array} messages - Array of message objects from database
   * @returns {string} - Context string
   */
  buildContextString: (messages) => {
    if (!messages || messages.length === 0) return "";
    
    let contextTokensSoFar = 0;
    let contextArray = [];
    
    for (const msg of messages) {
      const msgTokens = countTokens(msg.content);
      if (contextTokensSoFar + msgTokens > MAX_CONTEXT_TOKENS) {
        break;
      }
      contextArray.push(msg.content);
      contextTokensSoFar += msgTokens;
    }
    
    return contextArray.join("\n");
  }
};

function countTokens(text) {
  return encoder.encode(text).length;
}


module.exports = groqService;