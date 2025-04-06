const { gql } = require('apollo-server-express');
const userTypeDefs = require('./typeDefs/users');
const subjectTypeDefs = require('./typeDefs/subjects');
const messageTypeDefs = require('./typeDefs/messages');
const studyCardTypeDefs = require('./typeDefs/studyCards');
const questionCardTypeDefs = require('./typeDefs/questionCards');
const aiTypeDefs = require('./typeDefs/ai');

const baseTypeDefs = gql`
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

module.exports = [
  baseTypeDefs,
  userTypeDefs,
  subjectTypeDefs,
  messageTypeDefs,
  studyCardTypeDefs,
  questionCardTypeDefs,
  aiTypeDefs
];