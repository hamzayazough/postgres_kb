const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    phone_number: String
    first_name: String
    last_name: String
    profile_picture_url: String
    last_login_date: String
    created_at: String
    updated_at: String
  }
  
  input UserInput {
    username: String
    email: String
    phone_number: String
    first_name: String
    last_name: String
    profile_picture_url: String
  }
  
  extend type Query {
    getUser(id: ID!): User
  }
  
  extend type Mutation {
    authenticateUser(username: String!, email: String!): User
    updateUser(id: ID!, userData: UserInput!): User
  }
`;