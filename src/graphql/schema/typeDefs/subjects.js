const { gql } = require('apollo-server-express');

module.exports = gql`
  type Subject {
    id: ID!
    name: String!
    is_enabled: Boolean!
    creation_date: String!
    disabled_date: String
  }
  
  input SubjectUpdateInput {
    name: String
    is_enabled: Boolean
  }

  extend type Query {
    getSubjects(userId: ID!): [Subject]
    getEnabledSubjects(userId: ID!): [Subject]
    getDisabledSubjects(userId: ID!): [Subject]
    getSubject(id: ID!): Subject
  }
  
  extend type Mutation {
    createSubject(userId: ID!, name: String!): Subject
    updateSubject(id: ID!, updates: SubjectUpdateInput!): Subject
    deleteSubject(username: String!, subjectName: String!): Boolean
  }
`;