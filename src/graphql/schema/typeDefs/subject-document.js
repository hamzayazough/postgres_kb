const { gql } = require('apollo-server-express');

module.exports = gql`
  type SubjectDocument {
    id: ID!
    filename: String!
    upload_date: String!
    file_size: Int!
    embedding_status: String
    document_type: String
  }

  type DeleteDocumentResponse {
    id: ID!
  }

  extend type Query {
    getSubjectDocuments(subjectId: ID!): [SubjectDocument]
  }

  extend type Mutation {
    deleteSubjectDocument(id: ID!): DeleteDocumentResponse
  }
`;