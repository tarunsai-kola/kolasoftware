# Production Deployment Guide

This document outlines the exact steps required to deploy the Kola platform to production using Vercel (for the Next.js frontend/API) and Supabase (for the database, auth, and edge functions).

---

## 1. Vercel Setup & GitHub Integration

1. Push your local codebase to a new GitHub repository.
2. Log into [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
3. Import your GitHub repository.
4. **Framework Preset**: Vercel will auto-detect "Next.js". Leave this as is.
5. Do not click deploy yet! You must configure environment variables first (see Section 2).

---

## 2. Environment Variables

In your Vercel Project Settings > **Environment Variables**, you must add the production equivalents of your `.env.local` file. 

> **Important**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_KEY_SECRET` with a `NEXT_PUBLIC_` prefix!

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (Set this to your production root domain, e.g., `https://kolasolution.com`)
- `PLATFORM_ADMIN_DOMAIN` (e.g., `admin.kolasolution.com`)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (e.g., `orders@kolasolution.com`)
- `VERCEL_API_TOKEN` (Create this in Vercel Account Settings > Tokens)
- `VERCEL_PROJECT_ID` (Find this in Vercel Project Settings > General)

Once added, click **Deploy**.

---

## 3. Wildcard Subdomain Support

To allow automatic tenant provisioning (e.g., `burgerjoint.kolasolution.com`):

1. Go to your Vercel Project Settings > **Domains**.
2. Add your root domain (e.g., `kolasolution.com`). Vercel will prompt you to configure the DNS records in your registrar.
3. Add a wildcard domain by typing `*.kolasolution.com`.
4. Vercel will ask you to add a specific TXT or CNAME record to your DNS provider to verify wildcard ownership. Complete this step.
5. Once verified, any subdomain request will route to your Next.js app, where our `middleware.ts` will parse the host and load the correct tenant.

---

## 4. Custom Domain Setup for Tenants

If a restaurant wants to use their own domain (e.g., `burgerjoint.com`) instead of a subdomain:

**For the Tenant:**
1. Instruct the tenant to create a `CNAME` record in their DNS provider pointing to `cname.vercel-dns.com`.
2. (If using an apex domain like `burgerjoint.com`, they must use an `A` record pointing to `76.76.21.21`).

**For the Platform Admin:**
1. The onboarding form automatically calls the Vercel Domains API via the Server Action (`app/(super-admin)/restaurants/new/actions.ts`).
2. If this fails, or if a tenant adds a domain *after* onboarding, you can manually add it in Vercel:
   - Go to Vercel Project > Settings > Domains.
   - Enter `burgerjoint.com`.
   - Vercel will automatically check if the tenant configured the CNAME correctly and provision an SSL certificate.

---

## 5. Supabase Database Migrations

Your local schema changes are stored in `supabase/migrations/`. You must apply them to your production Supabase project.

1. Install the Supabase CLI locally.
2. Link your local project to the production database:
   ```bash
   npx supabase link --project-ref your-production-project-id
   ```
3. Push the migrations:
   ```bash
   npx supabase db push
   ```
   *(Ensure you run this command. It applies all SQL files sequentially to build your tables, views, and RLS policies).*

---

## 6. Supabase Edge Functions (Webhooks)

The platform relies on a Supabase Database Webhook + Edge Function to dispatch emails asynchronously.

1. Deploy the edge function to your production Supabase project:
   ```bash
   npx supabase functions deploy send-order-emails --project-ref your-production-project-id --no-verify-jwt
   ```
2. Set the secrets securely in the Edge Function environment:
   ```bash
   npx supabase secrets set --project-ref your-production-project-id RESEND_API_KEY=your_key RESEND_FROM_EMAIL=orders@kolasolution.com
   ```
3. **Database Webhook Trigger**:
   - In your Supabase Dashboard, navigate to **Database** > **Webhooks**.
   - Create a new webhook:
     - Name: `on_order_paid`
     - Table: `orders`
     - Events: `UPDATE`
     - Condition: `old_record.payment_status != 'paid' AND record.payment_status = 'paid'`
     - Type: HTTP Request
     - Method: POST
     - URL: `https://your-production-project-id.supabase.co/functions/v1/send-order-emails`

Your platform is now fully armed and operational in production!
