const userResolvers = require('./users');
const subjectResolvers = require('./subjects');
const messageResolvers = require('./messages');
const studyCardResolvers = require('./studyCards');
const questionCardResolvers = require('./questionCards');

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...subjectResolvers.Query,
    ...messageResolvers.Query,
    ...studyCardResolvers.Query,
    ...questionCardResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...subjectResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...studyCardResolvers.Mutation,
    ...questionCardResolvers.Mutation,
    ...aiResolvers.Mutation
  }
};