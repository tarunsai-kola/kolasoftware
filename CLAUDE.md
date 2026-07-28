# CLAUDE.md — Platform Architecture & Rules

> **For AI assistants:** Read this file before touching any code.
> Update it whenever a real architectural decision is made.

---

## Business Context

This is a **multi-tenant SaaS platform** that gives restaurants their own branded online ordering website — eliminating their dependency on aggregators like Zomato and Swiggy, which charge **18–30% commission per order**.

| Metric | Value |
|---|---|
| Subscription price | ₹2,000 / month per restaurant |
| Typical order volume | 50–100 orders / day per restaurant |
| Platform revenue model | Flat monthly fee only — restaurants keep **100%** of every order's value |
| Payment flow | Razorpay Route sub-accounts → money goes **directly** to each restaurant's bank |

The platform's core promise: **direct orders, zero aggregator commission, full ownership of customer data.**

---

## Architecture Rules — Do Not Violate

### 1. One Codebase, All Restaurants
This is **one Next.js application** serving every restaurant on the platform.

- ❌ Never create separate pages, route groups, or repos per restaurant.
- ✅ Every restaurant is served dynamically using the same shared codebase.

### 2. Tenant Identification via Hostname (Middleware)
Every incoming request hits `middleware.ts` first. The middleware:

1. Reads `request.headers.get('host')` to extract the hostname (custom domain or `{slug}.kolasolution.com` subdomain).
2. Looks up the matching `restaurant_id` from the database.
3. Injects `restaurant_id` + theme data into request headers so layout/pages can consume them without additional DB hits.

```
Request → middleware.ts → resolve restaurant_id → headers → layout → page
```

- ❌ Never resolve tenant identity inside pages or API routes directly.
- ✅ Always read tenant context from the headers set by middleware.

### 3. Data Isolation via RLS, Not Separate Databases
All restaurant data lives in the **same Supabase database**.

- Every table with restaurant-scoped data has a `restaurant_id` foreign key.
- Supabase **Row Level Security (RLS)** policies enforce that staff can only read/write their own restaurant's rows.
- ❌ Never use separate databases, schemas, or database users per restaurant.
- ✅ Always ensure RLS policies exist before exposing any table to client-side queries.

### 4. Branding Comes from Data, Never from Code
Every restaurant's visual identity (logo, primary color, accent color, font family) is stored in the `restaurants` table and applied at runtime.

- ❌ Never hardcode a restaurant's colors, logo URL, or font in any component or CSS file.
- ✅ Pull branding tokens from the `restaurants` row (injected via middleware headers or a layout fetch) and apply them as CSS custom properties (`--color-primary`, `--font-body`, etc.).

### 5. Money Never Touches the Platform
Payments are processed via **Razorpay Route**.

- Each onboarded restaurant has a Razorpay **sub-account** linked to their bank.
- Order payments are routed directly to the restaurant's sub-account at the time of capture.
- ❌ The platform never holds restaurant funds in transit.
- ✅ The platform only collects its ₹2,000/month subscription fee separately.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Hosting | Vercel Pro (wildcard domain support for `*.kolasolution.com`) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (staff/admin only — customers are phone-identified, no login) |
| Realtime | Supabase Realtime (live order updates on kitchen dashboard) |
| Payments | Razorpay Route (sub-accounts) |
| Email | Resend + React Email |
| Validation | Zod |
| Notifications | react-hot-toast |
| Date utilities | date-fns |

---

## Three User Types

### 1. Customers
- **Who:** End-users placing food orders on a restaurant's branded site.
- **Auth:** No login required. Identified by **phone number** (OTP or simple input).
- **Access:** Storefront only — menu, cart, checkout, order status.
- **Data scope:** Their own orders for a given restaurant.

### 2. Restaurant Staff / Owners
- **Who:** Restaurant operators managing their menu, incoming orders, and settings.
- **Auth:** Supabase Auth (email + password or magic link).
- **Access:** Dashboard at `/(dashboard)` route group.
- **Data scope:** RLS ensures they can **only see their own restaurant's data** — enforced at the database layer, not just the UI.

### 3. Platform Super-Admins
- **Who:** The platform owners (you).
- **Auth:** Supabase Auth with a separate role/claim.
- **Access:** Admin portal at `/(super-admin)` route group, served on `PLATFORM_ADMIN_DOMAIN`.
- **Data scope:** Full read/write access to all restaurants, billing, onboarding, analytics.
- **Middleware note:** The middleware detects when the request host matches `PLATFORM_ADMIN_DOMAIN` and routes to the super-admin layout.

---

## Folder Structure

```
/app
  /(storefront)        # Customer-facing restaurant sites (public)
  /(dashboard)         # Restaurant owner/staff kitchen dashboard (auth-gated)
  /(super-admin)       # Platform super-admin portal (auth-gated + domain-gated)
  /api                 # API routes and webhooks (Razorpay, Supabase, etc.)

/components
  /storefront          # Storefront-specific components
  /dashboard           # Dashboard-specific components
  /super-admin         # Super-admin-specific components
  /shared              # Reusable components across all layouts

/lib
  /supabase            # Browser + server Supabase client setup
  /email               # Resend templates and send functions (React Email)
  /payments            # Razorpay Route integration helpers

/middleware.ts         # Tenant resolution (hostname → restaurant_id + theme)
```

---

## Key Design Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| Initial | Single Next.js codebase for all tenants | Avoids infrastructure sprawl; tenant isolation done at data layer via RLS |
| Initial | Hostname-based tenant resolution in middleware | Supports both custom domains and subdomains transparently |
| Initial | Razorpay Route sub-accounts | Platform never holds funds; simplifies compliance and trust |
| Initial | Customers are phone-identified, no Supabase Auth | Reduces checkout friction; most users won't remember a password for a restaurant site |
| 2026-07-26 | `orders.items` JSONB snapshot + `order_items` normalised table | Dual storage: JSONB for immutable receipt snapshot, normalised rows for analytics queries |
| 2026-07-26 | `restaurants_public` view excludes owner_id, kitchen_email, billing columns | Anon RLS policy on restaurants is permissive; view is the column-level guard for storefront queries |
| 2026-07-26 | `is_platform_admin()` and `get_my_restaurant_ids()` as SECURITY DEFINER helpers | Keeps RLS policy expressions readable; SECURITY DEFINER needed to read platform_admins/restaurant_staff while RLS is active |
| 2026-07-26 | Anon RLS on customers/orders is permissive — restriction enforced in app code | Supabase RLS cannot filter on client-supplied function args; app must always `.eq('phone', ...)` / `.eq('customer_id', ...)` |
| 2026-07-26 | Razorpay webhook handler uses service role client (bypasses RLS) | Webhooks have no user session; service role is the correct pattern. Route must verify Razorpay signature before any write |
| 2026-07-26 | `orders` table added to `supabase_realtime` publication | Kitchen dashboard subscribes to `restaurant_id`-filtered channel for live order stream |

_Add new rows here whenever a significant architectural or product decision is made._

---

## What to Never Do

- ❌ Hardcode any restaurant name, color, logo, or config in source code.
- ❌ Query data without confirming an RLS policy exists on that table.
- ❌ Resolve `restaurant_id` inside a page component — always use middleware headers.
- ❌ Create per-restaurant branches, repos, or deployment pipelines.
- ❌ Store Razorpay webhook secrets, Supabase service role keys, or any secret in client-side code.
- ❌ Use `SUPABASE_SERVICE_ROLE_KEY` in any route that can be reached without super-admin auth.
