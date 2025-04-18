const userResolvers = require('./users');
const subjectResolvers = require('./subjects');
const messageResolvers = require('./messages');
const studyCardResolvers = require('./studyCards');
const questionCardResolvers = require('./questionCards');
const aiResolvers = require('./ai');
const authResolvers = require('./auth');
const usageResolvers = require('./usage');
const subjectDocumentResolvers = require('./subjectDocuments');

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...subjectResolvers.Query,
    ...messageResolvers.Query,
    ...studyCardResolvers.Query,
    ...questionCardResolvers.Query,
    ...authResolvers.Query,
    ...usageResolvers.Query,
    ...subjectDocumentResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...subjectResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...studyCardResolvers.Mutation,
    ...questionCardResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...authResolvers.Mutation,
    ...usageResolvers.Mutation,
    ...subjectDocumentResolvers.Mutation,
  }
};