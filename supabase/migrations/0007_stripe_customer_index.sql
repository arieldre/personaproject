-- Index for webhook lookups by Stripe customer ID
-- Avoids full table scan on every billing lifecycle event
CREATE INDEX IF NOT EXISTS companies_stripe_customer_id_idx ON companies (stripe_customer_id);
