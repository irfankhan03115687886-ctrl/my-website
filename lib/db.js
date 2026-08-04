import { Pool } from 'pg';

let pool;

// Reused across requests in the same server process. Works with any
// standard Postgres connection string — Supabase and Neon both give you
// one in their dashboard. Use the "pooled"/"pgbouncer" connection string
// they provide if you deploy to a serverless platform like Vercel.
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to .env.local — see README.md.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      // Fail fast instead of hanging: every caller in this project wraps
      // query() in try/catch and falls back to safe demo data, so a slow
      // timeout just makes every page load feel broken while a bad
      // DATABASE_URL, a paused database, or a network block gets sorted out.
      connectionTimeoutMillis: 8000,
      statement_timeout: 10000,
      query_timeout: 10000,
      idleTimeoutMillis: 30000,
    });
    pool.on('error', (err) => {
      // A dropped idle connection shouldn't crash the whole server.
      console.error('[db] unexpected pool error', err.message);
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}

// Checked-out client for multi-statement transactions (BEGIN/COMMIT/ROLLBACK).
// Callers MUST always release the client in a finally block — see
// lib/adminProducts.js `updateProduct` for the pattern (slug renames need
// to update products + product_tags + collection_products atomically).
export async function getClient() {
  const pool = getPool();
  return pool.connect();
}
