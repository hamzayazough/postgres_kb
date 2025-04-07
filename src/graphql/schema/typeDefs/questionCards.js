const { gql } = require('apollo-server-express');

module.exports = gql`
  type Option {
    text: String!
    isCorrect: Boolean!
  }

  type QuestionCard {
    id: ID!
    question: String!
    options: [Option!]!
    date: String!
    created_at: String
    updated_at: String
  }

  extend type Query {
    getQuestionCards(subjectId: ID!): [QuestionCard]
    getQuestionCard(id: ID!): QuestionCard
  }

  input OptionInput {
    text: String!
    isCorrect: Boolean!
  }

  extend type Mutation {
    addQuestionCard(
      subjectId: ID!, 
      question: String!, 
      options: [OptionInput!]!,
      date: String
    ): QuestionCard
      
    updateQuestionCard(
      id: ID!, 
      question: String, 
      options: [OptionInput!]
    ): QuestionCard
      
    deleteQuestionCard(id: ID!): QuestionCard
  }

  input OptionInput {
    text: String!
    isCorrect: Boolean!
  }
`;