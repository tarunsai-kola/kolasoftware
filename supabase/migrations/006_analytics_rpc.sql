-- =============================================================================
-- Migration: 006_analytics_rpc.sql
-- Creates the super admin analytics aggregation function.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_super_admin_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- 1. Security Check: Ensure caller is a platform admin
  IF NOT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Build the JSON Payload
  WITH summary AS (
    SELECT 
      COUNT(id) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now())) as this_month_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now())), 0) as this_month_value,
      COUNT(id) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')) as last_month_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')), 0) as last_month_value
    FROM orders
  ),
  leaderboard AS (
    SELECT r.id as restaurant_id, r.name as restaurant_name, COUNT(o.id) as total_orders
    FROM restaurants r
    JOIN orders o ON o.restaurant_id = r.id
    WHERE date_trunc('month', o.created_at) = date_trunc('month', now())
    GROUP BY r.id, r.name
    ORDER BY total_orders DESC
    LIMIT 10
  ),
  onboarding_trend AS (
    SELECT 
      to_char(date_trunc('month', created_at), 'Mon YYYY') as period, 
      COUNT(id) as count, 
      date_trunc('month', created_at) as sort_date
    FROM restaurants
    WHERE created_at >= date_trunc('month', now() - interval '5 months')
    GROUP BY 1, 3
    ORDER BY 3 ASC
  ),
  order_trend AS (
    SELECT 
      to_char(date_trunc('week', created_at), 'Mon DD') as period, 
      COUNT(id) as count, 
      date_trunc('week', created_at) as sort_date
    FROM orders
    WHERE created_at >= date_trunc('week', now() - interval '7 weeks')
    GROUP BY 1, 3
    ORDER BY 3 ASC
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(summary) FROM summary),
    'leaderboard', (SELECT COALESCE(json_agg(leaderboard), '[]'::json) FROM leaderboard),
    'onboardingTrend', (SELECT COALESCE(json_agg(onboarding_trend), '[]'::json) FROM onboarding_trend),
    'orderTrend', (SELECT COALESCE(json_agg(order_trend), '[]'::json) FROM order_trend)
  ) INTO result;

  RETURN result;
END;
$$;
