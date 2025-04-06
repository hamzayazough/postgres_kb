require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const typeDefs = require('./src/graphql/schema');
const resolvers = require('./src/graphql/resolvers');
const db = require('./src/config/db');
const authMiddleware = require('./src/api/middlewares/auth').authMiddleware;

async function startServer() {
  const app = express();
  app.use(authMiddleware);  
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({ req }) => {
      return {
        user: req.user
      };
    }
  });
  
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});