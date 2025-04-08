-- Create batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add batch_id column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE users ADD COLUMN batch_id INTEGER REFERENCES batches(id);
  END IF;
END $$;