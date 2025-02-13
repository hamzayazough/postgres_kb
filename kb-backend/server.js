require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
  }

  type Subject {
    id: ID!
    name: String!
    user: User!
  }

  type Message {
    id: ID!
    role: String!
    content: String!
    subject: Subject!
  }

  type Query {
    getSubjects(userId: ID!): [Subject]
    getMessages(subjectId: ID!): [Message]
  }

  type Mutation {
    createUser(username: String!): User
    createSubject(userId: ID!, name: String!): Subject
    addMessage(subjectId: ID!, role: String!, content: String!): Message
  }
`;

const resolvers = {
  Query: {
    getSubjects: async (_, { userId }) => {
      const res = await pool.query("SELECT * FROM subjects WHERE user_id = $1", [userId]);
      return res.rows;
    },
    getMessages: async (_, { subjectId }) => {
      const res = await pool.query("SELECT * FROM messages WHERE subject_id = $1", [subjectId]);
      return res.rows;
    },
  },
  Mutation: {
    createUser: async (_, { username }) => {
      const res = await pool.query("INSERT INTO users (username) VALUES ($1) RETURNING *", [username]);
      return res.rows[0];
    },
    createSubject: async (_, { userId, name }) => {
      const res = await pool.query(
        "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING *",
        [userId, name]
      );
      return res.rows[0];
    },
    addMessage: async (_, { subjectId, role, content }) => {
      const res = await pool.query(
        "INSERT INTO messages (subject_id, role, content) VALUES ($1, $2, $3) RETURNING *",
        [subjectId, role, content]
      );
      return res.rows[0];
    },
  },
};

const app = express();
app.use(cors());

const server = new ApolloServer({ typeDefs, resolvers });

server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql" });
  app.listen(4000, () => console.log("🚀 Server running at http://localhost:4000/graphql"));
});
