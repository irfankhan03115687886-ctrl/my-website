-- Field & Co database schema
-- Run this once in your database's SQL editor (Supabase: Table Editor > SQL Editor,
-- Neon: the built-in SQL console) before the site can store real accounts and orders.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  password_hash text not null,
  is_admin boolean not null default false,
  role text check (role in ('super_admin','admin','manager','order_manager','product_manager','customer_support')),
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email text not null,
  stripe_session_id text unique,
  total numeric(10, 2) not null,
  status text not null default 'pending', -- pending | paid | failed
  shipping_name text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  price numeric(10, 2) not null,
  qty integer not null
);

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- ----------------------------------------------------------------
-- Order tracking history — one row per status change. The admin
-- dashboard writes to this table; the customer-facing order page
-- reads it to render a timeline.
-- ----------------------------------------------------------------
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_status_history_order_id on order_status_history(order_id);

-- ----------------------------------------------------------------
-- Catalog taxonomy — categories (with self-referencing subcategories),
-- tags, and merchandising collections. Products themselves stay in
-- lib/products.js as a static catalog; these tables let the admin
-- dashboard organize/merchandise that catalog without a full product
-- database migration. Products are referenced by their `slug` (text).
-- ----------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  parent_id uuid references categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_categories_parent_id on categories(parent_id);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists product_tags (
  product_slug text not null,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (product_slug, tag_id)
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists collection_products (
  collection_id uuid not null references collections(id) on delete cascade,
  product_slug text not null,
  primary key (collection_id, product_slug)
);

-- Make yourself an admin after signing up:
-- update users set is_admin = true, role = 'super_admin' where email = 'you@example.com';

-- ----------------------------------------------------------------
-- Admin roles & permissions run entirely off the `role` column above
-- (see lib/roles.js for the permission matrix). Every admin action that
-- mutates data writes a row here — this is the audit trail referenced
-- throughout the admin dashboard's "Activity" page.
-- ----------------------------------------------------------------
create table if not exists admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references users(id) on delete set null,
  admin_email text,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_activity_logs_created_at on admin_activity_logs(created_at desc);

-- ----------------------------------------------------------------
-- Site-wide settings. Single-row table (id is always 1) so reads/writes
-- are a trivial upsert — see lib/settings.js.
-- ----------------------------------------------------------------
create table if not exists site_settings (
  id integer primary key default 1,
  store_name text not null default 'Field & Co',
  store_email text,
  store_phone text,
  store_address text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  -- Shipping/business fields — surfaced in /admin/settings, read by
  -- checkout so nothing is hard-coded (see lib/settings.js).
  shipping_fee numeric(10,2) not null default 5.00,
  free_shipping_threshold numeric(10,2) not null default 50.00,
  delivery_country text not null default 'GB',
  bank_payment_instructions text,
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 1)
);

-- ----------------------------------------------------------------
-- Real product catalog. lib/products.js reads from here first and only
-- falls back to the in-code demo catalog if this table is empty/DB is
-- unreachable, so the storefront never breaks mid-migration.
--
-- category/subcategory are plain text slugs (not foreign keys) so they
-- keep working whether or not matching rows exist in `categories` —
-- same soft-reference pattern used by product_tags/collection_products.
-- ----------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  short_description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  sku text,
  brand text,
  category text,
  subcategory text,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  best_seller boolean not null default false,
  new_arrival boolean not null default false,
  rating numeric(2,1),
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category);
-- Partial unique index: SKU is optional, so this only enforces
-- uniqueness among products that actually have one set (an empty/null
-- SKU on multiple products is fine and shouldn't collide).
create unique index if not exists idx_products_sku_unique on products(sku) where sku is not null and sku != '';

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product_id on product_images(product_id, position);

-- ----------------------------------------------------------------
-- Homepage hero — single editable row (id always 1), edited from
-- /dashboard/admin/hero. app/page.js reads this first and falls back to
-- built-in copy if the table is empty/unreachable.
-- ----------------------------------------------------------------
create table if not exists hero_content (
  id integer primary key default 1,
  eyebrow text,
  title text,
  highlight text,
  subtitle text,
  cta_label text,
  cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  image_url text,
  updated_at timestamptz not null default now(),
  constraint hero_content_single_row check (id = 1)
);

-- ----------------------------------------------------------------
-- Brands — managed at /dashboard/admin/brands. Products reference a
-- brand by plain text name (same soft-reference pattern as
-- category/subcategory), so this is independent of the products table.
-- ----------------------------------------------------------------
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Freeform site pages ("Other Pages" in the dashboard) — e.g. About,
-- FAQ, Shipping & Returns. Rendered publicly at /pages/[slug] when
-- status = 'published'.
-- ----------------------------------------------------------------
create table if not exists custom_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Indexes added after a later audit — safe to run against an existing
-- database (all use IF NOT EXISTS). orders.status/created_at are read
-- on nearly every admin order list and every analytics query; the join
-- tables were only indexed on their leading primary-key column, not the
-- column used for reverse lookups (e.g. "which products have this tag").
-- ----------------------------------------------------------------
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_product_tags_tag_id on product_tags(tag_id);
create index if not exists idx_collection_products_product_slug on collection_products(product_slug);

-- ----------------------------------------------------------------
-- Customer account system additions.
-- ----------------------------------------------------------------
alter table users add column if not exists phone text;
alter table users add column if not exists avatar_url text;
-- Email changes go through verification: the new address sits in
-- `pending_email` until the customer clicks the link in the
-- verification email, at which point it replaces `email`. See
-- lib/emailChange.js.
alter table users add column if not exists pending_email text;
alter table users add column if not exists marketing_opt_in boolean not null default true;
alter table users add column if not exists deletion_requested_at timestamptz;

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postcode text not null,
  country text not null default 'GB',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user_id on addresses(user_id);

-- Reset tokens are stored hashed (sha256) — never store the raw token
-- that goes out in the email, same principle as password hashing.
create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);

create table if not exists email_change_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  new_email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_change_tokens_user_id on email_change_tokens(user_id);

-- ----------------------------------------------------------------
-- Contact form submissions. app/api/contact writes here; managed at
-- /admin/contact-messages.
-- ----------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);
create index if not exists idx_contact_messages_is_read on contact_messages(is_read);

-- ----------------------------------------------------------------
-- Product reviews. One review per customer per product (enforced by the
-- unique index below) so editing a review updates the existing row
-- rather than creating duplicates. Reviews start pending admin approval
-- and only count toward a product's public rating/review count once
-- approved — see lib/reviews.js.
-- ----------------------------------------------------------------
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
create unique index if not exists idx_reviews_product_user on reviews(product_slug, user_id);
create index if not exists idx_reviews_product_slug on reviews(product_slug, status);
create index if not exists idx_reviews_status on reviews(status);
