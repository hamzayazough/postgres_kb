const { gql } = require('apollo-server-express');

module.exports = gql`
  type UsageQuota {
    limit: Int!
    used: Int!
    remaining: Int!
    resetDate: String!
  }
  
  type UsageStat {
    date: String!
    inputTokens: Int!
    outputTokens: Int!
    requestCount: Int!
  }
  
  extend type Query {
    getUserQuota: UsageQuota!
    getUserUsageStats(startDate: String!, endDate: String!): [UsageStat!]!
  }
  
  extend type Mutation {
    updateUserQuota(userId: ID!, newLimit: Int!): UsageQuota!
  }
`;