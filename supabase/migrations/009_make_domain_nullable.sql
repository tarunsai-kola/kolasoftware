-- Migration: 009_make_domain_nullable.sql
-- Makes the custom domain optional for restaurants since they can just use a subdomain.

ALTER TABLE restaurants ALTER COLUMN domain DROP NOT NULL;
