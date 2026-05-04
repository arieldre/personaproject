import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Raw body required for Stripe signature verification — do NOT use default body parser
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: `webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        if (!companyId) break

        await db
          .update(companies)
          .set({
            subscriptionStatus: 'active',
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, companyId))
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        // Map Stripe subscription status to our enum
        const statusMap: Record<string, 'active' | 'inactive' | 'suspended' | 'trial'> = {
          active: 'active',
          trialing: 'trial',
          past_due: 'suspended',
          unpaid: 'suspended',
          canceled: 'inactive',
          incomplete: 'suspended',
          incomplete_expired: 'inactive',
          paused: 'inactive',
        }
        const newStatus = statusMap[sub.status] ?? 'inactive'

        await db
          .update(companies)
          .set({ subscriptionStatus: newStatus, updatedAt: new Date() })
          .where(eq(companies.stripeCustomerId, customerId))
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        await db
          .update(companies)
          .set({ subscriptionStatus: 'inactive', stripeSubscriptionId: null, updatedAt: new Date() })
          .where(eq(companies.stripeCustomerId, customerId))
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) break

        await db
          .update(companies)
          .set({ subscriptionStatus: 'suspended', updatedAt: new Date() })
          .where(eq(companies.stripeCustomerId, customerId))
        break
      }

      default:
        // Unhandled event type — acknowledged but no action
        break
    }
  } catch (err) {
    console.error(`[billing/webhook] DB update failed for event ${event.type}:`, err)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
