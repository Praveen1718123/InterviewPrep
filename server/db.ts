import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Get database URL from environment or use the fallback configuration
let connectionConfig: any;

if (process.env.DATABASE_URL) {
  // Parse connection info from DATABASE_URL if available
  console.log("Using DATABASE_URL from environment");
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Enhanced connection resilience options
    connectionTimeoutMillis: 10000, // 10 seconds timeout for connection attempts
    idleTimeoutMillis: 60000, // 60 seconds before idle clients are closed
    max: 10, // maximum number of clients in the pool
    min: 2, // minimum number of clients to keep active
    statement_timeout: 30000, // 30 second timeout on statements
    query_timeout: 30000, // 30 second timeout on queries
    allowExitOnIdle: true, // Allow closing the pool during shutdown
    application_name: 'switchbee-assessment-platform' // App name for tracking in database logs
  };
} else {
  // Fallback to explicit connection parameters
  console.log("Fallback to explicit connection parameters");
  connectionConfig = {
    host: process.env.PGHOST || '139.59.81.202',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'switchbee_admin',
    password: process.env.PGPASSWORD || 'SwitchbeeSolutions@123',
    database: process.env.PGDATABASE || 'switchbee',
    ssl: false,
    // Enhanced connection resilience options
    connectionTimeoutMillis: 10000, // 10 seconds timeout for connection attempts
    idleTimeoutMillis: 60000, // 60 seconds before idle clients are closed
    max: 10, // maximum number of clients in the pool (reduced to prevent overloading)
    min: 2, // minimum number of clients to keep active
    statement_timeout: 30000, // 30 second timeout on statements
    query_timeout: 30000, // 30 second timeout on queries
    allowExitOnIdle: true, // Allow closing the pool during shutdown
    application_name: 'switchbee-assessment-platform' // App name for tracking in database logs
  };
}

// Create a resilient pool with error handling
export const pool = new pg.Pool(connectionConfig);

// Enhanced error handling to prevent crashes and restart connections
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
  console.log('Attempting to recover from database error...');
  
  // Attempt to reconnect by creating a new client
  // This is just a test - the pool will handle reconnections automatically
  pool.connect()
    .then(client => {
      console.log('Successfully reconnected to the database');
      client.release();
    })
    .catch(err => {
      console.error('Failed to reconnect to the database:', err);
    });
});

// Log connection info and test the connection
pool.on('connect', (client) => {
  // Different log message based on connection type
  if (process.env.DATABASE_URL) {
    console.log(`Connected to PostgreSQL database using DATABASE_URL`);
  } else {
    console.log(`Connected to PostgreSQL database (${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database})`);
  }
  
  // Add listener for notices from the database server
  client.on('notice', (msg) => {
    console.log('PostgreSQL Notice:', msg.message);
  });
});

// Log connection removal
pool.on('remove', () => {
  console.log('Client removed from pool');
});

// Export the drizzle instance
export const db = drizzle(pool, { schema });
