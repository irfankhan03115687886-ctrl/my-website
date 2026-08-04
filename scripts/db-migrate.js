#!/usr/bin/env node
// scripts/db-migrate.js
//
// Runs db/schema.sql end-to-end against DATABASE_URL. Every statement
// in that file is written idempotently (`create table if not exists`,
// `create index if not exists`, `add column if not exists`), so this is
// always safe to re-run — on a brand new database it creates
// everything from scratch, and on an existing database it only adds
// whatever's missing (e.g. the reviews/contact_messages tables added
// after the store was first set up).
//
// Usage:
//   npm run db:migrate
//
// Requires DATABASE_URL — either already exported in your shell, or set
// in .env.local (this script reads .env.local itself, no extra
// dependency needed).

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ---------- tiny .env.local loader (no dotenv dependency) ----------
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, 'utf8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env.local — see README.md.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('Running db/schema.sql against DATABASE_URL...');
  try {
    // schema.sql is a straight sequence of DDL statements — running it
    // as one multi-statement query lets Postgres handle the splitting,
    // which is more reliable than a naive split on ';' (function bodies,
    // string literals, etc. can contain semicolons).
    await pool.query(sql);
    console.log('✔ Schema is up to date. New tables in this update: contact_messages, reviews, email_change_tokens.');
  } catch (err) {
    console.error('✘ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
