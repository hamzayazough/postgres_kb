const { gql } = require('apollo-server-express');

module.exports = gql`
  extend type Query {
    getCurrentUser: User
  }
  
  extend type Mutation {
    syncFirebaseUser: User
    updatePhoneNumber(phoneNumber: String!): User
  }
`;