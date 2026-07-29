-- =============================================================================
-- Migration: 023_fix_views_security_invoker.sql
-- Description: Alters existing views to use security_invoker to fix Supabase security definer warnings
-- =============================================================================

ALTER VIEW vw_admin_restaurant_stats SET (security_invoker = on);
ALTER VIEW restaurants_public SET (security_invoker = on);
