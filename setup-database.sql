-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate',
  batch TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  questions JSONB NOT NULL,
  time_limit INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create candidate_assessments table
CREATE TABLE IF NOT EXISTS candidate_assessments (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL,
  assessment_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  responses JSONB,
  score INTEGER,
  feedback TEXT,
  scheduled_for TIMESTAMP
);

-- Create session table for express-session with connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");