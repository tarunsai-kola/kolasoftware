-- =============================================================================
-- Migration: 004_email_webhook.sql
-- Documentation for setting up the Supabase Webhook to trigger order emails.
-- =============================================================================

/*
HOW TO CONFIGURE THE WEBHOOK IN THE SUPABASE DASHBOARD:

1. Navigate to your Supabase Project Dashboard.
2. Go to Database -> Webhooks (or Integrations -> Webhooks).
3. Click "Create a new Webhook" (or Database Webhook).
4. Fill in the following details:

   [General]
   - Name: "Send Order Emails on Payment Success"
   - Table: "orders"
   - Events: Check "Update"

   [Conditions]
   - Add a condition:
     payment_status (Old Record) = 'pending' (or just check that it's different)
     AND
     payment_status (New Record) = 'paid'

     *Note: You can also just filter via the Edge Function itself if the UI 
     doesn't support complex conditions, but Supabase Webhooks now support 
     "Advanced filtering".

   [Webhook Configuration]
   - Type: Supabase Edge Functions
   - Method: POST
   - Edge Function: "send-order-emails"

   [Headers]
   - Content-Type: application/json
   - Authorization: Bearer [ANON_KEY] (usually added automatically)

5. Click "Create Webhook".

Now, whenever a row in the `orders` table has its `payment_status` updated to 
'paid', Supabase will automatically send the updated record to the `send-order-emails` 
Edge Function!
*/
