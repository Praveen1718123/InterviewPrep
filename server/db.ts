import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use explicit connection parameters for the external PostgreSQL database
const connectionConfig = {
  host: '139.59.81.202',
  port: 5432,
  user: 'switchbee_admin',
  password: 'SwitchbeeSolutions@123',
  database: 'switchbee',
  // SSL disabled for development
  ssl: false,
  // Additional connection resilience options
  connectionTimeoutMillis: 5000, // 5 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // maximum number of clients in the pool
};

// Create a resilient pool with error handling
export const pool = new pg.Pool(connectionConfig);

// Add error handler to prevent crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Log connection info
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Export the drizzle instance
export const db = drizzle(pool, { schema });
