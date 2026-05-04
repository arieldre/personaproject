-- Add Stripe billing columns to companies table
-- These are populated by the billing webhook (checkout.session.completed)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
