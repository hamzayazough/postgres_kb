const { gql } = require('apollo-server-express');

module.exports = gql`
  type StudyCard {
    id: ID!
    title: String!
    content: String!
    date: String!
    created_at: String
    updated_at: String
  }
  
  extend type Query {
    getStudyCards(subjectId: ID!): [StudyCard]
    getStudyCard(id: ID!): StudyCard
  }
  
  extend type Mutation {
    addStudyCard(
      subjectId: ID!, 
      title: String!, 
      content: String!, 
      date: String
    ): StudyCard
    
    updateStudyCard(
      id: ID!, 
      title: String!, 
      content: String!
    ): StudyCard
    
    deleteStudyCard(id: ID!): StudyCard
  }
`;