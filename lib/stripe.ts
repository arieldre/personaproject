import Stripe from 'stripe'

// Lazy-init — never instantiate at module scope (BP-045: cold-start crash if key absent)
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' })
}

export { getStripe }

// Price IDs read from env — never hardcoded
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  growth: process.env.STRIPE_PRICE_GROWTH ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
} as const

export type PriceTier = keyof typeof PRICE_IDS
