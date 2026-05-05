# Handoff — Persona Platform
# Session: 2026-05-04 | Last commit: 50c23070

## Completed This Session

### Stripe Billing (full flow)
- `lib/stripe.ts` — lazy-init `getStripe()`, `PRICE_IDS` from env vars
- `app/api/billing/checkout/route.ts` — creates Checkout Session with company_id metadata
- `app/api/billing/portal/route.ts` — opens Customer Portal via stripe_customer_id
- `app/api/billing/webhook/route.ts` — 4 events: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed
- `app/(app)/settings/billing/page.tsx` — Server Actions startCheckout/openPortal; 3 states: trial/inactive (tier cards), active (manage button), suspended (payment failed)
- `lib/db/schema/index.ts` — added stripeCustomerId + stripeSubscriptionId columns
- `supabase/migrations/0006_stripe_billing.sql` — migration for those columns
- Billing link added to admin nav; landing page pricing CTAs now POST to Stripe

### Groq Support Agent
- `lib/support/knowledge-base.ts` — 176-line system prompt covering all features + escalation trigger
- `app/api/support/route.ts` — streaming, model rotation (8b default, 70b for complex/long), DB rate limit, [ESCALATE] → Resend email
- `app/(app)/_components/SupportWidget.tsx` — "?" button bottom-right, 320×420px panel, quick-action buttons, streaming via ReadableStream
- `app/(app)/layout.tsx` — SupportWidget rendered for all authenticated users

### Legal Pages
- `/security` — infrastructure, encryption, RLS, subprocessors, disclosure, incident SLA
- `/msa` — full MSA: 99% SLA, IP, confidentiality, liability cap 12mo fees, Ireland law
- `/dpa` — GDPR Art.28 DPA: sub-processors table, 72h breach notification, deletion on termination

### Marketing Pages
- `/vs/second-nature`, `/vs/mursion`, `/vs/yoodli` — feature comparison tables
- `/for/hr-teams`, `/for/new-managers`, `/for/feedback-training` — ICP-targeted landing pages

### E2E (previous session)
- Two-company cross-tenant isolation suite: `e2e/tests/app/cross-tenant-isolation.spec.ts`
- `e2e/helpers/seed-company-b.ts` — idempotent Company B seed helper

### Marketing Templates (C:/Users/ArielD/docs/marketing/)
- `cold-email-sequence.md` — 6-email Apollo/Instantly sequence
- `linkedin-sequence.md` — 5-message Expandi sequence (25/day cap)
- `post-demo-sequence.md` — 4-email HubSpot follow-up
- `customer-io-onboarding-sequence.md` — 8 behavior-triggered onboarding emails
- `outbound-icp-guide.md` — ICP definitions, buyer personas, objection handling

## Next Action: Install, typecheck, migrate, then deploy

```bash
cd C:/Users/ArielD/personaproject
npm install                 # stripe package newly added
npx tsc --noEmit            # should be 0 errors
npm run lint                # should be 0 new errors
npx drizzle-kit migrate     # adds stripe_customer_id + stripe_subscription_id (needs DIRECT_URL)
vercel deploy               # deploy after env vars set
```

## Ariel Must Do (cannot automate)

### Stripe — BLOCKING (billing 503s without these)
1. Create Stripe account → stripe.com
2. Secret Key → `STRIPE_SECRET_KEY`
3. Create 3 products: $199/mo, $499/mo, $999/mo → copy Price IDs:
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
   - `STRIPE_PRICE_ENTERPRISE`
4. Webhook → `https://personaproject-one.vercel.app/api/billing/webhook`
   - Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
   - Webhook Signing Secret → `STRIPE_WEBHOOK_SECRET`
5. All 5 vars → Vercel project settings → redeploy

### Inngest — BLOCKING (grading/clustering silently no-op)
- Inngest dashboard → copy `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` → Vercel → redeploy

### Google OAuth (optional — email/pw works without it)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Vercel

### Marketing Outreach (manual setup with docs/marketing/ templates)
- Apollo.io: ICP filters from `outbound-icp-guide.md`, upload cold email sequence
- Expandi: load `linkedin-sequence.md`, cap at 25 connection requests/day
- Instantly.ai: warmup domain, load 6-email sequence
- Customer.io: connect event source, load onboarding sequence
- Fix Email 5 URL: `/use-cases/new-managers` → `/for/new-managers` (page exists now)

## Review Checklist Before Launch

### Build
- [ ] `npm install` then `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 new errors/warnings
- [ ] `npm run build` — 0 failures

### Billing
- [ ] Stripe test mode: checkout end-to-end (card 4242 4242 4242 4242)
- [ ] Webhook fires → companies.subscription_status = 'active'
- [ ] Customer Portal opens from active state
- [ ] Suspended state shows payment failed banner + update button
- [ ] Billing page only visible to company_admin / super_admin
- [ ] Test bad webhook signature → 400 response

### Support Widget
- [ ] Open widget, send message, streaming response appears
- [ ] Technical question → llama-3.3-70b selected (check server log)
- [ ] Simple question → llama-3.1-8b selected
- [ ] Trigger [ESCALATE] → email arrives at ariel.d@goatstudios.co
- [ ] Rate limit blocks after 20 messages in 1 hour

### Marketing / Legal Pages
- [ ] All 9 pages render (security, msa, dpa, vs/*, for/*)
- [ ] Add links in footer + marketing nav as appropriate
- [ ] Fix cold-email Email 5 URL (see above)

### Security
- [ ] Cross-tenant E2E: `npx playwright test cross-tenant` → all 5 pass
- [ ] Billing page auth: visit /settings/billing while logged out → redirected to /login
- [ ] GDPR: DPA sub-processor list current (Supabase, Groq, Vercel, Resend)

## Remaining Gaps

| Gap | Severity | Owner |
|-----|----------|-------|
| Stripe env vars not set | BLOCKING | Ariel |
| DB migration not run | BLOCKING | Ariel (after Stripe setup) |
| Inngest keys not set | High | Ariel |
| /for/* + /vs/* not in footer | Low | Claude next session |
| Email sequence URL fix | Low | Ariel (docs/marketing/) |
| No E2E for billing flow | Medium | Claude next session |
| Chat rate limiter still in-memory | Medium | Claude next session |
| GitHub auto-deploy not connected | Low | Ariel (one-click in Vercel) |

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅ · 10 Training Library ✅
11 Consult Agents ✅ · 12 Billing ✅ (code done, needs Stripe setup) · Support Agent ✅

## Branch
`phase/1-foundation` — not merged to main yet. Merge after Stripe confirmed working in test mode.

## Deploy
Last deploy: personaproject-one.vercel.app (from previous session — this session's changes not deployed yet)
Run: `vercel deploy` after env vars added + migration run
