CREATE EXTENSION IF NOT EXISTS vector;


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_picture_url TEXT,
    last_login_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    duration_ms INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disabled_date TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS user_quotas (
    user_id INT REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    monthly_token_limit INT NOT NULL DEFAULT 1000000,
    reset_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
    CREATE TYPE role_enum AS ENUM ('user', 'assistant');
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    role role_enum NOT NULL,
    content TEXT NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS study_cards (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_cards (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_subject_id ON messages(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_cards_subject_id ON study_cards(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_cards_subject_id ON question_cards(subject_id);
CREATE INDEX IF NOT EXISTS idx_usages_user_id ON usages(user_id);
CREATE INDEX IF NOT EXISTS idx_usages_timestamp ON usages(timestamp);