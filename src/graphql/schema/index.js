const { gql } = require('apollo-server-express');
const userTypeDefs = require('./typeDefs/users');
const subjectTypeDefs = require('./typeDefs/subjects');
const messageTypeDefs = require('./typeDefs/messages');
const studyCardTypeDefs = require('./typeDefs/studyCards');
const questionCardTypeDefs = require('./typeDefs/questionCards');
const aiTypeDefs = require('./typeDefs/ai');
const auth = require('./typeDefs/auth');
const usage = require('./typeDefs/usage');
const subjectDocumentTypeDefs = require('./typeDefs/subject-document');

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
  aiTypeDefs,
  auth,
  usage,
  subjectDocumentTypeDefs,
];