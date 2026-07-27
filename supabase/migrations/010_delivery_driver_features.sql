-- Migration: 010_delivery_driver_features.sql
-- Adds delivery_lat and delivery_lng to orders
-- Adds assigned_driver_id to orders
-- Updates restaurant_staff role constraint to allow 'driver'

-- 1. Add columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES restaurant_staff(id) ON DELETE SET NULL;

-- 2. Update role constraint safely
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'restaurant_staff'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE restaurant_staff DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE restaurant_staff ADD CONSTRAINT restaurant_staff_role_check CHECK (role IN ('owner', 'staff', 'driver'));
