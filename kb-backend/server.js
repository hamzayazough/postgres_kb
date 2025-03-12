require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { getEmbedding } = require("./embedding");

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
  }

  type Message {
    id: ID!
    role: String!
    content: String!
  }

  type Query {
    getSubjects(userId: ID!): [Subject]
    getMessages(subjectId: ID!): [Message]
    searchMessages(subjectId: ID!, query: String!): [Message]
  }

  type Mutation {
    authenticateUser(username: String!): User
    createSubject(userId: ID!, name: String!): Subject
    deleteSubject(username: String!, subjectName: String!): Boolean
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
      searchMessages: async (_, { subjectId, query }) => {
        const queryEmbedding = await getEmbedding(query);
        const queryEmbeddingStr = "[" + queryEmbedding.join(",") + "]";
  
        const res = await pool.query(
          `SELECT id, role, content
           FROM messages
           WHERE subject_id = $1
           ORDER BY embedding <-> $2::vector(1536)
           LIMIT 5;`,
          [subjectId, queryEmbeddingStr]
        );
        return res.rows;
      },
    },
    Mutation: {
      authenticateUser: async (_, { username }) => {
        let res = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  
        if (res.rows.length === 0) {
          res = await pool.query("INSERT INTO users (username) VALUES ($1) RETURNING *", [username]);
        }
  
        return res.rows[0];
      },
      createSubject: async (_, { userId, name }) => {
        const res = await pool.query(
          "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING *",
          [userId, name]
        );
        return res.rows[0];
      },
      deleteSubject: async (_, { username, subjectName }) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const userRes = await client.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
          );
          if (userRes.rows.length === 0) {
            throw new Error("User not found");
          }
          const userId = userRes.rows[0].id;
          const deleteRes = await client.query(
            "DELETE FROM subjects WHERE user_id = $1 AND name = $2 RETURNING *",
            [userId, subjectName]
          );
          if (deleteRes.rows.length === 0) {
            throw new Error("Subject not found");
          }

          await client.query('COMMIT');
          return true;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      addMessage: async (_, { subjectId, role, content }) => {
        const embedding = await getEmbedding(content);
        const embeddingStr = "[" + embedding.join(",") + "]";

        const res = await pool.query(
          `INSERT INTO messages (subject_id, role, content, embedding)
           VALUES ($1, $2, $3, $4::vector(1536))
           RETURNING *`,
          [subjectId, role, content, embeddingStr]
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
  app.listen(4000, () => {
    console.log("🚀 Server running at http://localhost:4000/graphql");
    
    });
});
