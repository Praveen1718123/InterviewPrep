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
  // Add SSL config if required by your PostgreSQL server
  // ssl: { rejectUnauthorized: false }
};

export const pool = new pg.Pool(connectionConfig);
export const db = drizzle(pool, { schema });
