import { Pool } from 'pg';

async function main() {
  console.log('Connecting to database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not set!');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  console.log('Pushing schema changes to database...');
  
  try {
    // Create all tables that don't exist yet
    await pool.query(`
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
    `);
    
    await pool.query(`
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
    `);
    
    await pool.query(`
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
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
  
  await pool.end();
}

main().catch(console.error);