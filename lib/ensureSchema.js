// lib/ensureSchema.js
//
// db/schema.sql is the source of truth for the schema, but nothing ever
// executed it against a live database automatically — it was purely
// reference documentation. On a database that was provisioned before
// the reviews/contact-messages/email-change features existed, that
// means those tables are simply missing, which is exactly what
// produces `relation "reviews" does not exist`.
//
// This module runs the (idempotent — every statement uses `if not
// exists`) create-table statements for those newer tables the first
// time they're needed, so the feature works immediately without anyone
// having to open a SQL console. It's cheap and safe to call on every
// request: after the first successful run in a given server process,
// every subsequent call reuses the same resolved promise and does
// nothing.
import { query } from '@/lib/db';

let ensured = null;

export function ensureAppSchema() {
  if (!ensured) {
    ensured = runMigration().catch((err) => {
      // Don't cache a rejected promise — a transient connection issue
      // shouldn't permanently disable the feature for the rest of the
      // process's lifetime. Let the next call try again.
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

async function runMigration() {
  await query(`
    create table if not exists contact_messages (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      email text not null,
      subject text,
      message text not null,
      is_read boolean not null default false,
      created_at timestamptz not null default now()
    );
  `);
  await query(`create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);`);
  await query(`create index if not exists idx_contact_messages_is_read on contact_messages(is_read);`);

  await query(`
    create table if not exists reviews (
      id uuid primary key default gen_random_uuid(),
      product_slug text not null,
      user_id uuid not null references users(id) on delete cascade,
      rating integer not null check (rating between 1 and 5),
      title text,
      body text,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await query(`create unique index if not exists idx_reviews_product_user on reviews(product_slug, user_id);`);
  await query(`create index if not exists idx_reviews_product_slug on reviews(product_slug, status);`);
  await query(`create index if not exists idx_reviews_status on reviews(status);`);

  await query(`
    create table if not exists email_change_tokens (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      new_email text not null,
      token_hash text not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );
  `);
  await query(`
    create table if not exists password_reset_tokens (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );
  `);
  await query(`create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);`);

  await query(`create index if not exists idx_email_change_tokens_user_id on email_change_tokens(user_id);`);

  await query(`alter table users add column if not exists pending_email text;`);
  await query(`alter table users add column if not exists marketing_opt_in boolean not null default true;`);
}
