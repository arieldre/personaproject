import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { getStripe, PRICE_IDS, type PriceTier } from '@/lib/stripe'

const VALID_TIERS: PriceTier[] = ['starter', 'growth', 'enterprise']

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  let user: { id: string; email: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; email: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  let tier: PriceTier
  try {
    const body = await req.json()
    tier = body.tier
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'invalid tier — must be starter, growth, or enterprise' }, { status: 400 })
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    return NextResponse.json({ error: `price ID not configured for tier: ${tier}` }, { status: 503 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    allow_promotion_codes: true,
    // company_id stored in metadata so webhook can identify which company to update
    metadata: { company_id: user.companyId ?? '', user_id: user.id },
    success_url: `${baseUrl}/settings/billing?success=1`,
    cancel_url: `${baseUrl}/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
