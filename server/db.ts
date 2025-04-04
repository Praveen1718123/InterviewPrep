import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Create PostgreSQL connection pool
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Create drizzle database instance with schema
export const db = drizzle(pool, { schema });