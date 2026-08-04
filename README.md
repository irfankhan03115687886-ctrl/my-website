# Field & Co — Next.js Storefront

A full Next.js 14 rebuild of the original static site, with **real accounts**
(hashed passwords, real sessions) and **real Stripe payments** wired in.

## Quick start (demo mode — no setup needed)

```bash
npm install
npm run dev
```

Visit http://localhost:3000. Browsing, cart, and the design all work
immediately. Login/signup/checkout will show a clear error until you
complete the setup below — that's expected, not a bug.

---

## Making it fully real: 3 accounts you need to create

I can't create these for you — each requires your own identity or business
details. Once you've created them, come back and give me the keys they give
you (put them in `.env.local`, **not** in chat) and everything is already
wired up to use them.

### 1. Database — stores real user accounts and orders

Pick one (both have a free tier and take under 5 minutes):

**Option A: Supabase**
1. Go to https://supabase.com -> sign up -> "New project"
2. Once it's created, go to **Project Settings -> Database**
3. Copy the **Connection string** under "Connection pooling" (URI format,
   port 6543) — this is your `DATABASE_URL`
4. Go to the **SQL Editor** tab, paste the entire contents of `db/schema.sql`
   from this project, and click Run. This creates the `users`, `orders`, and
   `order_items` tables.

**Option B: Neon**
1. Go to https://neon.tech -> sign up -> create a project
2. Copy the connection string shown (it's your `DATABASE_URL`)
3. Open the **SQL Editor** in the Neon console, paste `db/schema.sql`, run it.

### 2. Stripe — takes real payments

1. Go to https://dashboard.stripe.com/register and create an account
2. You can build and test everything in **Test mode** (toggle top-right)
   before ever entering real bank details — no rush on that part
3. Go to **Developers -> API keys** -> copy the **Secret key** (starts `sk_test_...`)
   — this is your `STRIPE_SECRET_KEY`
4. For the webhook (this is what tells your site "the payment succeeded, save the order"):
   - **Testing locally**: install the Stripe CLI (docs.stripe.com/stripe-cli),
     run `stripe login`, then `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
     It will print a `whsec_...` value — that's your `STRIPE_WEBHOOK_SECRET`.
   - **In production**: Developers -> Webhooks -> "Add endpoint" -> URL:
     `https://yourdomain.com/api/stripe/webhook` -> select event
     `checkout.session.completed` -> it'll show you the signing secret (`whsec_...`).
5. When you're ready to take real money, Stripe will ask you to verify your
   business and bank account before switching out of Test mode — that's
   Stripe's own process, not something in this codebase.

### 3. Hosting — since you already have a domain

Easiest path is **Vercel** (made by the Next.js team, generous free tier):

1. Push this project to a GitHub repository
2. Go to https://vercel.com/new and import that repo
3. Before deploying, add all the variables from `.env.example` under
   **Environment Variables** (with your real values)
4. Deploy
5. Go to **Project Settings -> Domains**, add your existing domain, and
   follow Vercel's instructions to point your domain's DNS at it (usually
   just adding one or two records at your domain registrar)
6. Update `NEXT_PUBLIC_SITE_URL` to your real domain and redeploy
7. Add the **production** webhook endpoint in Stripe (step 2 above) pointing
   at `https://yourdomain.com/api/stripe/webhook`

---

## Putting the keys in locally

Create a file called `.env.local` in the project root (same folder as
`package.json`) — copy `.env.example` and fill in your real values:

```bash
cp .env.example .env.local
```

Then open `.env.local` in VS Code and paste in your real `DATABASE_URL`,
`JWT_SECRET` (any long random string — or run `openssl rand -base64 32`),
`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and
`STRIPE_WEBHOOK_SECRET`.

To make password reset, email-change verification, and the contact-form
notification actually send email, configure **one** of:

- **Resend** (recommended — set `RESEND_API_KEY`; works everywhere,
  including serverless hosts like Vercel that block outbound SMTP
  ports, which is the most common reason a reset email "never arrives"
  even though nothing errors). Grab a free key at
  [resend.com/api-keys](https://resend.com/api-keys) — no domain setup
  needed to start.
- **SMTP** — fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASSWORD`, `SMTP_FROM` with credentials from Gmail (App
  Password), Outlook, SendGrid, Mailgun, Amazon SES, etc.

Leave both unset and those emails are simply logged to your terminal
instead — handy for local development, but customers won't receive
them until one is configured. Once set, your server log will print
`[email] Sending via Resend.` (or SMTP) on the first email — if you
instead see `[email] No RESEND_API_KEY or SMTP_HOST configured`, the
env var didn't get picked up (check for typos, and that you restarted
the dev server after editing `.env.local`).

Restart `npm run dev` after editing this file.

**This file is already in `.gitignore`** — it will never be pushed to
GitHub or shared anywhere by accident.

## Database migrations

New tables (`reviews`, `contact_messages`, `email_change_tokens`,
`password_reset_tokens`) are created automatically the first time
they're needed — no manual step required, even on a database that was
set up before these features existed.

If you'd rather run it explicitly (e.g. as part of a deploy step):

```bash
npm run db:migrate
```

This runs `db/schema.sql` against `DATABASE_URL`. Every statement in it
uses `if not exists`, so it's always safe to re-run — it only creates
what's missing.

---

## What's real now vs. still a stub

| Feature | Status |
|---|---|
| Browsing, cart, wishlist | Real (client-side, persists in the browser) |
| Signup / Login | **Real** — bcrypt-hashed passwords, signed session cookies, stored in your database |
| Product catalog | **Real** — managed at `/admin/products` (create/edit/publish/archive/delete, multi-image upload, stock). Falls back to a demo catalog only until your first real product is saved |
| Checkout / Payment | **Real** — redirects to Stripe's own hosted checkout page; every price and stock level is re-validated server-side (never trusted from the browser) before Stripe is even called |
| Inventory | **Real** — stock is atomically decremented when a payment succeeds (safe under concurrent purchases of the same item), and out-of-stock/low-stock states show on product pages, cards, and the admin product list |
| Order history | **Real** — `/account` reads real orders from your database |
| Order tracking | **Real** — each order at `/account/orders/[id]` shows a visual status timeline backed by `order_status_history` |
| Admin dashboard | **Real** — `/admin` (stats, orders, products, categories, tags, collections) once you flag an account as admin — see below |
| Super Admin dashboard | **Real** — `/dashboard/admin`, strictly gated to the `super_admin` role, adds Hero Section, Brands, Sub-Categories, Customers, and Other Pages management |
| Customer account system | **Real** — profile (with email-change verification), saved addresses, change password, forgot/reset password, order history with PDF invoices and reorder, wishlist, and account settings — all at `/account/*` |
| Analytics & bulk product ops | **Real** — charts (revenue/category/status/best-sellers) with date-range filtering, bulk publish/price/stock/category/brand actions, and CSV import/export |
| Admin roles & permissions | **Real** — 6 roles with server-verified per-resource access (`lib/roles.js`), never trusted from the client |
| Admin activity log | **Real** — every admin mutation writes an audit row, viewable at `/admin/activity` |
| Store settings | **Real** — `/admin/settings` saves store info **and** shipping fee / free-shipping threshold / delivery country / bank transfer instructions to the database |
| Product search | **Real** — live-search dropdown in the header (name/SKU/category/brand/description, debounced) plus full results at `/products?search=`, both hitting the database directly |
| Product reviews | **Real** — customers write/edit/delete a 1–5 star review per product at the bottom of the product page; new/edited reviews are moderated (`pending → approved/rejected`) at `/admin/reviews` before counting toward the public average and count |
| Contact form | **Real** — submissions save to the `contact_messages` table and are managed (read/unread, search, delete) at `/admin/contact-messages`; optionally emails `CONTACT_NOTIFY_EMAIL` too |
| Forgot/reset password, email-change verification | **Real** — real signed tokens with expiry, single-use enforcement, and actual emails sent via SMTP (see the env setup above) |
| Account deletion | **Real** — requires re-entering your password, then permanently deletes the account (addresses/reviews cascade, orders are kept but detached) and signs you out |
| Newsletter signup | Still a stub — logs to the console. Wire up `app/api/newsletter/route.js` to your list provider when ready |
| Cash on Delivery / Bank Transfer checkout | Not built yet — checkout is Stripe-card-only today |

## Super Admin dashboard (`/dashboard/admin`)

A second, stricter admin dashboard lives at `/dashboard/admin` — accessible **only** to accounts whose database `role` is exactly `super_admin` (not `admin`, not `SUPER_ADMIN`, no exceptions). Anyone not logged in is redirected to `/login`; anyone logged in with a different role sees a clear "Access denied" screen naming their actual role. Both checks happen server-side in `app/dashboard/admin/layout.js` — there's no client-side gate to bypass.

Make yourself a Super Admin:
```sql
update users set is_admin = true, role = 'super_admin' where email = 'you@example.com';
```

Sidebar sections and what each one does:

| Section | Route | What it manages |
|---|---|---|
| Dashboard | `/dashboard/admin` | Revenue, order, and customer stats |
| Analytics | `/dashboard/admin/analytics` | Revenue-over-time chart, sales by category, order status breakdown, best-sellers, with date-range filtering (today/yesterday/7d/30d/this month/last month/this year/custom) |
| Hero Section | `/dashboard/admin/hero` | Homepage hero title/subtitle/CTAs/background image (DB-backed, `hero_content` table) — the homepage reads this live |
| Collection Banner | `/dashboard/admin/collection-banner` | Same collections/banners system used on the homepage and `/collections` |
| Products | `/dashboard/admin/products` | Full product CRUD, images, stock, bulk actions, CSV import/export (see below) |
| Brands | `/dashboard/admin/brands` | New `brands` table — name + logo, independent directory |
| Orders | `/dashboard/admin/orders` | Order list, status updates, tracking timeline |
| Categories | `/dashboard/admin/categories` | Top-level departments |
| Sub-Categories | `/dashboard/admin/subcategories` | Finer groupings nested under a category |
| Customers | `/dashboard/admin/customers` | Every registered customer, with order count + lifetime spend, and a disable/enable toggle |
| Other Pages | `/dashboard/admin/pages` | Freeform pages (About, FAQ, etc.) — published ones render at `/pages/[slug]` |
| Website Settings | `/dashboard/admin/settings` | Store info, currency, shipping fee/threshold, delivery country, bank transfer instructions |

This dashboard reuses the same underlying database tables and library functions as the multi-role dashboard below wherever the feature already existed (Products, Orders, Categories, Collections, Settings) — nothing is duplicated data, only the UI routes are new. The older `/admin` dashboard (below) still works as-is for the `admin`/`manager`/`order_manager`/`product_manager`/`customer_support` roles; the two are independent, so demoting or removing neither one affects the other.

### Bulk product actions & CSV import/export

Both `/admin/products` and `/dashboard/admin/products` share the same products table component (`components/admin/ProductsTable.jsx`), which adds:

- **Bulk actions** — select any number of real products with the checkboxes, then: publish/draft/archive, reassign category + subcategory, reassign brand, adjust price (± percent or flat $ across the whole selection), adjust stock (set to / increase / decrease by a quantity), or delete. Every bulk action is one server-side query (`lib/adminProducts.js`), logged to the activity log with the full list of affected product IDs.
- **Export CSV** — downloads every real product as a CSV (all fields: pricing, stock, status, flags). Useful as a backup or for editing many products at once in a spreadsheet.
- **Import CSV** — upload a CSV in the same column format to bulk-create or bulk-update products. Matching is by `slug`: a row with a slug that already exists updates that product; a new slug creates a new one. Bad rows (missing name/slug/price) are skipped and reported individually rather than failing the whole import.

Demo catalog products (not yet real database rows) are automatically excluded from bulk selection and CSV export — only real products can be bulk-edited.

### Analytics

`/dashboard/admin/analytics` (also linked from the sidebar) shows:
- Revenue over time as an area chart, for whatever date range is selected
- Sales by category and order status distribution as charts
- A best-selling products table (units sold + revenue)
- Summary cards: total revenue, total orders, average order value, new customers — all scoped to the selected date range

Charts are built with [Recharts](https://recharts.org) (`components/dashboard/charts/`) and read live from `orders`/`order_items`/`products` (`lib/analytics.js`) — there's no mock data, so this will show zeros until real orders exist.

## Admin dashboard (`/admin` — multi-role)

Visit `/admin` once signed in. Two ways to unlock access:

1. **Recommended** — after signing up normally, run this once against your database:
   ```sql
   update users set is_admin = true, role = 'super_admin' where email = 'you@example.com';
   ```
2. **Quick/dev** — add your email to `ADMIN_EMAILS` in `.env.local` (comma-separated for multiple admins). No DB write needed — you're treated as `super_admin`.

### Roles & permissions

Every admin page and every admin API route re-checks the caller's role **from the database** on each request (see `lib/admin.js` → `requirePermission()`), not from anything in the client or the session cookie — so demoting or disabling someone takes effect on their very next click, not after their cookie expires.

| Role | Can access |
|---|---|
| **Super Admin** | Everything, including Admin Users |
| **Admin** | Everything except managing other admin users |
| **Manager** | Dashboard, Orders, Products, Categories, Tags, Collections, Reviews |
| **Order Manager** | Dashboard, Orders only |
| **Product Manager** | Dashboard, Products, Categories, Tags, Collections, Reviews |
| **Customer Support** | Dashboard, Orders, Contact Messages |

Manage who holds which role at `/admin/users` (Super Admin only) — grant access to an existing customer account by email, change roles, disable an account, or revoke admin access entirely. The permission matrix itself lives in `lib/roles.js`; add a new resource key there (and to the pages/routes that should check it) whenever a new admin section ships.

### Activity log

Every mutating admin action — order status changes, category/tag/collection edits, role changes, settings updates — writes a row to `admin_activity_logs`, visible (chronologically, newest first) at `/admin/activity`.

### Settings

`/admin/settings` edits store name/email/phone/address/currency/timezone, saved to the single-row `site_settings` table — ready to be pulled into order confirmation emails, invoices, and the footer once those are wired up.

From the dashboard you can also:
- See revenue/order/customer stats and recent orders
- Update any order's status (`pending → paid → processing → shipped → delivered`, or `failed`/`refunded`) — every change is logged and instantly visible on the customer's tracking page
- Manage categories & subcategories, tags, and merchandising **collections** (banner image, title, subtitle) that show up in a "Collections" section on the homepage and at `/collections`
- Attach tags and collections to any product in the catalog

All of this reads/writes real Postgres tables (see the bottom of `db/schema.sql`) — until `DATABASE_URL` is connected, categories/tags/collections fall back to demo data so the storefront still looks complete.

### Product management

`/admin/products` is a real catalog, not a code file you have to edit:

- **New product** (`/admin/products/new`) — name, description, price, compare-at price, SKU, brand, category/subcategory, stock, low-stock threshold, status (draft/published/archived), and featured/best-seller/new-arrival flags
- **Images** — upload directly from the product's edit page (JPEG/PNG/WebP/AVIF, 5MB max), reorder, set the primary image, or delete. Files save to `public/uploads/products/` — this works immediately for local development, but **isn't durable in most hosting environments** (e.g. Vercel's filesystem is read-only/ephemeral in production). Before deploying, swap the upload route (`app/api/admin/products/[slug]/images/route.js`) to write to S3, Cloudinary, or Vercel Blob instead — the rest of the app only cares about the resulting URL, so nothing else needs to change.
- **Stock** is real: it's decremented automatically (and safely — see below) when a Stripe payment succeeds, and out-of-stock/low-stock states show on the storefront and in the admin list.
- The starter demo catalog (waxed jackets, packs, etc.) is just a fallback — the moment you save your first real product, the storefront switches over to your real catalog automatically. Demo products can still have tags/collections attached, but can't be priced or edited (they're not real database rows) — a note on their edit page explains this.

### Checkout security

Checkout never trusts the browser for money-related decisions:
- Every line item's price is looked up fresh from the database at checkout time — a tampered price sent from the browser is ignored.
- Stock is checked before Stripe is even called; out-of-stock or over-quantity items are rejected with a clear error.
- Shipping is calculated server-side from `/admin/settings` (flat fee, waived above the free-shipping threshold) — nothing is hard-coded in a component.
- On successful payment, stock is decremented with `WHERE stock >= qty`, so two people buying the last unit at the same instant can't oversell it — whoever's request commits first gets it, the second is left with accurate (zero) stock.

## Project structure

```
app/
  page.js                 homepage
  products/               listing + [slug] detail
  cart/, checkout/        cart + real Stripe checkout flow
  checkout/success/       reads the completed Stripe session
  login/, signup/         real auth forms
  account/                order history (server-rendered, reads the DB)
    orders/[id]/          order tracking timeline for a single order
  admin/                  admin dashboard (dashboard, orders, categories, tags, collections, products, users, activity, settings) — multi-role
  dashboard/admin/         Super Admin-only dashboard (dashboard, hero, collection-banner, products, brands, orders, categories, subcategories, customers, pages, settings)
  collections/            public collections listing + [slug] detail
  pages/[slug]/           public renderer for published "Other Pages"
  api/
    auth/                 signup, login, logout, me
    checkout/              creates the Stripe Checkout Session (re-validates prices/stock server-side)
    stripe/webhook/        Stripe calls this after a successful payment (saves order, decrements stock)
    admin/                 admin-only routes (multi-role, gated via lib/roles.js permission matrix)
    dashboard-admin/        Super Admin-only routes (hero, brands, customers, pages)
    contact/, newsletter/   (still demo stubs)
  sitemap.js, robots.js
components/               shared UI (+ components/admin/ and components/dashboard/ for dashboard forms)
context/                  CartContext (localStorage) + AuthContext (session)
lib/
  db.js                   Postgres connection (pg) — fails fast (8s) instead of hanging if unreachable
  auth.js                 password hashing + session cookies (bcrypt + jose)
  admin.js                admin session guards — resolves real role from the DB on every request; getSuperAdminSession() strictly requires role === 'super_admin'
  roles.js                role → permission matrix for the multi-role /admin dashboard
  activityLog.js          writes + reads the admin audit trail
  adminUsers.js           grant/change/revoke admin roles
  settings.js             store settings incl. shipping fee/threshold/delivery country (single-row DB table + demo fallback)
  hero.js                 homepage hero content (single-row DB table + fallback to original copy)
  brands.js               brand directory CRUD
  customers.js            customer list with order stats, enable/disable
  pages.js                freeform "Other Pages" CRUD + public published lookup
  products.js             product catalog — reads Postgres `products`/`product_images`, falls back to a demo catalog
  adminProducts.js        admin CRUD for products + images, plus bulk actions and CSV import/export
  analytics.js            revenue/orders/best-sellers/category/status queries with date-range resolution
  catalogConstants.js     client-safe category/subcategory/tag constants + isDbBackedProduct (no pg import — safe for 'use client' files)
  orders.js               order + order-tracking + admin stats queries
  orderStatuses.js         client-safe status constants (no pg import)
  catalog.js              categories/subcategories, tags, collections (DB + demo fallback)
  stripe.js               Stripe client
db/schema.sql             run once in your database's SQL editor
public/uploads/products/   uploaded product images land here (local-disk storage — see "Product management" above)
```

## Design system

The whole visual identity was retinted from a warm parchment-and-gold ("brass") look to a modern, neutral, deep-charcoal-and-soft-white palette with exactly one refined accent hue per theme (deep emerald by default). This works site-wide from one file because every component already used semantic color tokens (`bg-ink`, `text-brass`, `border-forest`, etc., defined in `app/globals.css` and `tailwind.config.js`) rather than hard-coded hex — so retinting the tokens restyles every page, including the admin dashboards, without touching individual page files. The 3-theme live switcher (`ThemeSwitcher.jsx`) still works, just re-grounded in the same neutral system (dusk = emerald, ember = bronze, moss = sage).

Also refined: shared button/card/input classes (softer shadows, larger radii, subtle tap-scale feedback on every button), the product card (removed the rustic "leather tag" eyelet/perforation motif for a cleaner minimal-luxury look), an animated mobile nav drawer (Framer Motion, respects `prefers-reduced-motion`), and real loading skeletons (`components/Skeleton.jsx` + `loading.js` on `/products`, `/products/[slug]`, and `/dashboard/admin`).

**Scope note:** this pass covers the full color/typography/shadow/radius design system (which cascades everywhere) plus the highest-traffic surfaces (product card, mobile nav, loading states). It does not include a from-scratch page-by-page layout rebuild (e.g. a mega menu, converting the cart to a slide-out drawer, or bespoke redesigns of every individual page's markup) — those remain available as focused follow-ups if wanted.

**Bugs found and fixed while continuing this pass:**
- The wishlist icon in the header linked to `/products` — there was no actual wishlist page to view saved items. Added a real one at `/wishlist`, and a link to it in the mobile menu (the header icon was desktop-only).
- The cart and checkout pages calculated shipping with hard-coded values ($12 fee, free over $150) that no longer matched what checkout actually charges (pulled from `/dashboard/admin/settings`, e.g. $5 / free over $50). Both pages now read live from a small public `/api/settings/shipping` endpoint via `lib/useShippingSettings.js`, so they can never drift out of sync with what the customer is actually charged again.
- There was no custom 404 or error page at all (Next.js's bare defaults) — added branded versions (`app/not-found.js`, `app/error.js`) that never expose raw error details to the customer.
- The footer had a "Field notes" newsletter section with no actual signup form. Wired in the existing `NewsletterForm` component (which needed a `variant` prop added, since its button/success-text colors were tuned for sitting on a light card, not directly on the dark footer background).

**Also added this pass:**
- **Rate limiting** on login, signup, contact, and newsletter (`lib/rateLimit.js`) — an in-memory fixed-window limiter, zero setup required. It only limits within a single server process, so if you deploy to a multi-instance/serverless platform, swap it for a shared store like Upstash Redis (the call sites don't need to change).
- **Admin top bar** on both dashboards — breadcrumb trail, current admin's name/email, a "View store" link, and logout, so the sidebar isn't the only navigation (`components/dashboard/DashboardTopbar.jsx`).
- **Animated stat counters** — the homepage's "12yr / 14 / 3.2k" row and every admin dashboard stat card now count up when scrolled into view (`components/AnimatedStat.jsx`), respecting `prefers-reduced-motion`.
- **Skip-to-content link** for keyboard/screen-reader users (invisible until focused, jumps straight past the header).

**A real regression caught and fixed:** a previous build-verification pass had left `app/layout.js` with placeholder font stubs instead of real Google Fonts — my restore step after that test hadn't actually restored the original file. Fixed, and this time verified byte-for-byte with a checksum before/after, so it can't silently happen again.

## Product management completion pass

Extended (not replaced) the existing product admin — same routes, same components, same visual language:

- **Product table** (`/admin/products` and `/dashboard/admin/products`, shared component): search by name/SKU, filters for category/brand/status/stock level, sortable Product/Price/Stock columns, and pagination (20 per page) — all client-side against the already-loaded product list, so no new API calls or loading states needed.
- **Bulk delete now asks for confirmation** before deleting — it didn't before.
- **CSV import is now a two-step preview → confirm flow**: uploading a file validates it (including catching duplicate slugs/SKUs *within the same file*, not just against the database) and shows exactly what will be created/updated/skipped before anything touches the database. The old one-step "upload and it's done" behavior still exists as the underlying import function — the route just added a `dryRun` mode.
- **Duplicate SKU is now actually prevented**: slugs already had a unique constraint; SKUs didn't. Added a partial unique index (`idx_products_sku_unique`, only enforced when a SKU is set, so multiple products with no SKU don't collide) plus a shared error-translation helper (`lib/dbErrors.js`) so a collision returns a clear message ("That SKU is already used by another product") instead of a raw Postgres error.
- **Image management**: drag-and-drop upload (in addition to the existing click-to-upload), multiple files at once, an instant local preview with a real upload-progress bar per file (via XHR, since `fetch` has no upload-progress event), a confirmation prompt before deleting an image, automatic promotion of another image to primary if the current primary is deleted, and the actual file is now deleted from disk (not just the database row) when an image is removed. Reordering and manually setting a primary image both worked already and are unchanged.
- **Image compression**: uploads are resized (max 1600px wide, never upscaled) and re-encoded via `sharp` before being saved, to keep file sizes reasonable for photos uploaded straight from a phone/camera. If compression fails for any reason, the original file is saved untouched rather than failing the upload.

## Customer account system (`/account/*`)

A complete rebuild — sidebar navigation (Dashboard, Profile, Addresses, Orders, Wishlist, Change Password, Settings, Logout), guarded by the same `getSession()` used everywhere else (redirects to `/login?next=/account` if signed out).

- **Profile** (`/account/profile`) — name, phone, profile picture (uploads to `public/uploads/avatars/`, same local-disk pattern as product images). Changing your email doesn't apply immediately: it sits in `pending_email` until you click the verification link sent to the *new* address (`lib/emailChange.js`) — this stops someone from locking you out of your own account by mistyping an email, and stops account takeover via an unverified address change.
- **Addresses** (`/account/addresses`) — full CRUD, with separate "default shipping" and "default billing" flags per address (`addresses` table, `lib/addresses.js`). Not yet wired into checkout's address form — that's a natural next step if you want saved addresses to autofill there.
- **Change Password** (`/account/password`) — requires the current password to verify before setting a new one.
- **Forgot/Reset Password** (`/forgot-password`, `/reset-password`) — generates a random token, stores only its SHA-256 hash (`password_reset_tokens` table), expires in 1 hour, and single-use. The request endpoint always responds the same way whether or not the email exists, so it can't be used to check who has an account.
- **Orders** (`/account/orders`) — full history, each with the existing status timeline, plus:
  - **PDF invoice download** — a real generated PDF (via `pdfkit`, `lib/invoice.js`), not a "print this page" workaround.
  - **Reorder** — looks up each item's *current* price/stock/availability before adding it back to your cart (via `/api/products/by-slugs`), rather than blindly re-adding a stale snapshot; items that are sold out or removed are skipped with a note.
- **Wishlist** (`/account/wishlist`) — shares the same component as the standalone `/wishlist` page.
- **Settings** (`/account/settings`) — marketing email opt-in/out, and an account deletion request (flags `deletion_requested_at` rather than deleting immediately, since open orders need to be resolved first — an admin follows up).

All the transactional emails this triggers (password reset, email verification) go through `lib/mailer.js`, which currently just logs to the console — see the comment at the top of that file for exactly where to plug in a real provider (Resend, Postmark, SendGrid); every call site already has the right content, so nothing else changes when you do.



A dedicated pass through security, database, UI consistency, and accessibility before adding any new features. Found and fixed:

**Bugs:**
- **Cart/wishlist never enforced stock limits.** You could add 50 of something with 3 in stock; checkout would reject it, but only after filling out the whole form. `CartContext` now clamps every add/quantity-change to the product's real stock and shows a toast ("Only 3 in stock — cart adjusted") instead of silently failing later.
- **Misleading CMS placeholder** — the "Other Pages" editor said content could include "basic HTML," but the public renderer escapes it as plain text (intentional, to avoid an XSS vector from admin-authored content). Fixed the copy to describe what it actually does.
- **UI inconsistency:** ~30 files still used the old chunky `border-2` weight from before the design system redesign — softened to the new hairline `border` everywhere except two small-scale exceptions (theme swatches, order-tracker step dots) where a slightly heavier ring genuinely reads better at that size.

**Security:**
- **SSRF hardening:** admin-supplied image URLs (hero background, collection banners, brand logos) get fetched server-side by Next's Image Optimizer. Combined with `next.config.mjs` allowing any HTTPS host (needed so admins can paste a URL from anywhere), that's a classic SSRF shape. Added `lib/validateImageUrl.js`, which blocks non-http(s) schemes and private/loopback/link-local addresses (localhost, 10.x, 192.168.x, 169.254.169.254 cloud metadata, etc.) on every route that accepts one of these URLs.
- Verified session cookies are `httpOnly`, `secure` in production, and `sameSite: 'lax'` (solid CSRF baseline for a cookie-based session).
- Verified password length is enforced server-side on signup, not just in the UI.

**Database:**
- Added missing indexes found during the audit: `orders(status)` and `orders(created_at)` (hit on nearly every admin order list and analytics query), plus reverse-lookup indexes on the tag/collection join tables. All added as `create index if not exists`, safe to run against your existing database.



## Notes

- Product catalog is real now (`lib/products.js` + `lib/adminProducts.js`,
  backed by the `products`/`product_images` tables) — manage it at
  `/admin/products`. The Unsplash-photo demo catalog is just a fallback
  shown until your first real product is saved.
- Product image uploads save to local disk (`public/uploads/products/`).
  Fine for local dev; swap for S3/Cloudinary/Vercel Blob before deploying
  (see "Product management" above for exactly where).
- Passwords require at least 8 characters; adjust in
  `app/api/auth/signup/route.js` if you want a different policy.
