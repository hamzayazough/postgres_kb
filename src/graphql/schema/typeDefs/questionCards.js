const { gql } = require('apollo-server-express');

module.exports = gql`
  type QuestionCard {
    id: ID!
    question: String!
    options: String!
    date: String!
    created_at: String
    updated_at: String
  }
  
  extend type Query {
    getQuestionCards(subjectId: ID!): [QuestionCard]
    getQuestionCard(id: ID!): QuestionCard
  }
  
  extend type Mutation {
    addQuestionCard(
      subjectId: ID!, 
      question: String!, 
      options: String!,
      date: String
    ): QuestionCard
    
    updateQuestionCard(
      id: ID!, 
      question: String!, 
      options: String!
    ): QuestionCard
    
    deleteQuestionCard(id: ID!): QuestionCard
  }
`;