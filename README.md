# StudyExtension API

A GraphQL API for managing knowledge bases with vector search capabilities, built with Node.js, Express, Apollo Server, and PostgreSQL with pgvector.

## 🏗️ Architecture

This project follows a modular architecture pattern with clear separation of concerns:

```
kb-backend/
├── src/
│   ├── config/        # Configuration files
│   ├── graphql/       # GraphQL schema and resolvers
│   │   ├── schema/
│   │   │   ├── typeDefs/
│   │   │   └── index.js
│   │   └── resolvers/
│   ├── models/        # Database models
│   └── services/      # Business logic and external services
├── server.js          # Entry point
├── docker-compose.yml # Database container setup
├── init-db.sql        # Database initialization
└── .env               # Environment variables (not in repo)
```

### Key Components

#### GraphQL Layer

- **Schema**: Defined in `src/graphql/schema/typeDefs/`, combined in `schema/index.js`
- **Resolvers**: Implement query and mutation handlers in `src/graphql/resolvers/`

#### Data Layer

- **Models**: Handle database operations in `src/models/`
- **Configuration**: Database connection in `src/config/db.js`

#### Services

- **Embedding**: Generates vector embeddings using OpenAI API

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- Docker and Docker Compose

### Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd kb-backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create `.env` file:

   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_DATABASE=knowledge_base
   DB_PASSWORD=yourpassword
   DB_PORT=5433
   OPENAI_API_KEY=your-openai-api-key
   ```

4. Start the database:

   ```
   docker-compose up -d
   ```

5. Start the server:
   ```
   npm start
   ```

The GraphQL server will be available at http://localhost:4000/graphql

## 📊 Enhanced Data Model

### Users

- Complete user profile with username, email, phone number, and personal details
- Tracking of creation, update, and last login times

### Subjects

- Knowledge base topics belonging to users
- Status tracking (enabled/disabled) with timestamps
- Creation and disabled dates

### Messages

- Content added to subjects with creation timestamps
- Includes vector embeddings for semantic search

### Study Cards

- Learning materials attached to subjects
- Title, content, and date tracking

### Question Cards

- Quiz questions with multiple choice options
- Stored as structured JSON for flexibility

## 🔍 Features

### User Management

- Authentication with username and email
- Profile management with optional fields

### Knowledge Management

- Create, update, and delete subjects
- Enable/disable subjects without deleting them
- Add, edit, and delete messages
- Search messages semantically using vector embeddings

### Study Tools

- Create and manage study cards for learning materials
- Create and manage question cards for testing knowledge

## 🛠️ Technologies

- **Node.js**: Runtime environment
- **Express**: Web server framework
- **Apollo Server**: GraphQL server
- **PostgreSQL**: Database
- **pgvector**: Vector extensions for PostgreSQL
- **OpenAI API**: For generating embeddings

## 📝 API Examples

### Authentication

```graphql
mutation {
  authenticateUser(username: "testuser", email: "test@example.com") {
    id
    username
    email
  }
}
```

### Create Subject

```graphql
mutation {
  createSubject(userId: "1", name: "Machine Learning") {
    id
    name
    creation_date
    is_enabled
  }
}
```

### Update Subject

```graphql
mutation {
  updateSubject(
    id: "1"
    updates: { name: "Advanced Machine Learning", is_enabled: true }
  ) {
    id
    name
    is_enabled
  }
}
```

### Add Message

```graphql
mutation {
  addMessage(
    subjectId: "1"
    role: "user"
    content: "What is gradient descent?"
  ) {
    id
    role
    content
    creation_date
  }
}
```

### Add Study Card

```graphql
mutation {
  addStudyCard(
    subjectId: "1"
    title: "Gradient Descent"
    content: "Gradient descent is an optimization algorithm..."
    date: "2025-04-05T12:00:00Z"
  ) {
    id
    title
    content
    date
  }
}
```

### Add Question Card

```graphql
mutation {
  addQuestionCard(
    subjectId: "1"
    question: "Which of the following is NOT a type of gradient descent?"
    options: "[{\"text\":\"Stochastic gradient descent\",\"isCorrect\":false},{\"text\":\"Batch gradient descent\",\"isCorrect\":false},{\"text\":\"Linear gradient descent\",\"isCorrect\":true}]"
    date: "2025-04-05T12:00:00Z"
  ) {
    id
    question
    date
  }
}
```

### Search Messages

```graphql
query {
  searchMessages(subjectId: "1", query: "optimization algorithms") {
    id
    role
    content
    creation_date
  }
}
```

## 📦 Directory Structure Details

### `/src/config`

Configuration files for database, services, etc.

### `/src/graphql/schema`

GraphQL type definitions split by domain for better maintainability.

### `/src/graphql/resolvers`

Resolver implementations that connect GraphQL operations to data models.

### `/src/models`

Database models that handle all database operations.

### `/src/services`

Business logic and external service integrations.

## 🚀 Local Deployment Guide

### 1. Create the PostgreSQL Database with Docker Compose

First, make sure you have Docker and Docker Compose installed on your machine. Then run:

```bash
# Start the PostgreSQL container with pgvector extension
docker-compose up -d
```

This will create and start a PostgreSQL container with the pgvector extension installed, and initialize the database using the `init-db.sql` script.

### 2. Create an .env File

Create a `.env` file in the root directory with the following content:

```
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=knowledge_base
DB_PASSWORD=Google1992!
DB_PORT=5433

# OpenAI API Key for Embeddings
OPENAI_API_KEY=your-openai-api-key
```

Replace `your-openai-api-key` with your actual OpenAI API key.

### 3. Start the Server

You can start the server using either of these commands:

```bash
# Using Node directly
node server.js

# Or using npm if you've set up a start script in package.json
npm start
```

The server will be available at http://localhost:4000/graphql, where you can use the GraphQL playground to test queries and mutations.

### 4. Verify the Setup

To verify everything is working correctly:

1. Open your browser and navigate to http://localhost:4000/graphql
2. Try a simple query like:

```graphql
mutation {
  authenticateUser(username: "testuser", email: "test@example.com") {
    id
    username
    email
  }
}
```
