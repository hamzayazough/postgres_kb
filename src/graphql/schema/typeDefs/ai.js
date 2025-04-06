const { gql } = require('apollo-server-express');

module.exports = gql`
  type AIResponse {
    content: String!
    modelUsed: String!
    inputTokens: Int!
    outputTokens: Int!
  }
  
  input MessageInput {
    role: String!
    content: String!
  }
  
  extend type Mutation {
    generateAIResponse(
      messages: [MessageInput!]!, 
      subjectId: ID, 
      model: String
    ): AIResponse!
  }
`;