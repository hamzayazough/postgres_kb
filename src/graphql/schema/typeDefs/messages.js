const { gql } = require('apollo-server-express');

module.exports = gql`
  type Message {
    id: ID!
    role: String!
    content: String!
    creation_date: String!
  }
  
  extend type Query {
    getMessages(subjectId: ID!): [Message]
    getMessage(id: ID!): Message
    searchMessages(subjectId: ID!, query: String!): [Message]
  }
  
  extend type Mutation {
    addMessage(subjectId: ID!, role: String!, content: String!): Message
    updateMessage(id: ID!, content: String!): Message
    deleteMessage(id: ID!): Message
  }
`;