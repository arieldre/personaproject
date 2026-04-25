# Handoff — Persona Platform
Updated: 2026-04-25

## Completed This Session
- Phase 11: Consult Agents — each persona (default + company) now has "Consult" mode
- Consult page: /consult/[personaId] — free expert chat, no grading, violet UI
- Training page: "Consult →" button added to each default persona card
- Personas page: "Chat →" and "Consult →" buttons side by side
- Chat route: ?mode=consult loads consultSystemPrompt, skips scenario/anti-drift injection
- Enriched all 6 default personas: age, family, personal quirks, speech patterns
- PERSONA_GROUNDING_HEADER: injected into all training systemPrompts at export time
- persistentReminder: injected after conversation history (≥4 turns) to prevent persona fade
- Removed 6 legacy scenarios (conflict-resolution, performance-feedback archetypes)
- **Critical fix:** training-session.tsx was parsing stream as dataStream (0: prefix) but route returns plain text → chat showed empty responses. Fixed to read plain bytes.

## Last Commits
- `61d04341` — fix: training chat stream parsing — drop 0: prefix filter
- `d6d19e02` — feat: persona anti-drift — persistentReminder injected after history
- `d98d2838` — feat: Phase 11 — consult agents + enriched personas + remove legacy scenarios
Branch: `phase/1-foundation` (pushed ✅)

## Deploy Status
**LIVE** → https://personaproject-one.vercel.app
Latest deploy: `personaproject-ai9bstht5-arararar34-gmailcoms-projects.vercel.app` (promoted ✅)
GitHub auto-deploy: NOT connected — vercel.com/…/settings/git

## Demo / Test Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@acme-demo.com | AcmeDemo123! | company_admin |
| alice@acme-demo.com | (seeded, check DB — seed doesn't set pw for employees) | user |

**Important:** Only the admin@acme-demo.com account has a password set (created via Better Auth signup in seed). Employee accounts are survey respondents only — they can't log in unless you add email/pw auth for them separately.
Re-seed: `npm run seed` (idempotent) in C:/Users/ArielD/personaproject

## Architecture — Consult Feature
- Default personas: `consultSystemPrompt` + `consultTagline` in lib/training/default-personas.ts
- Company personas: consult prompt auto-derived from tagline + existing systemPrompt (no migration)
- Route: /api/chat/[personaId]?mode=consult → loads consultSystemPrompt, skips scenario injection and anti-drift
- Page: app/(app)/consult/[personaId]/page.tsx (server) + consult-session.tsx (client)
- Theme: violet (vs blue for chat, green for training)

## Persona Anti-Drift Architecture
- `PERSONA_GROUNDING_HEADER`: prepended to every training systemPrompt at export — enforces organic personal details, no breaking character
- `persistentReminder`: 1-sentence character constraint injected as [SYSTEM: ...] / "Understood." exchange after history when ≥4 turns
- Source: G-Eval research on post-history instruction injection
- Trigger: training mode only, not consult mode

## Remaining Gaps — Security (P1)
- User export route: conversations not scoped to company
- Match route: responseId lookup has no company isolation
- Rate limiter: in-memory, resets on restart
- Cross-tenant isolation E2E test: not written

## Remaining Gaps — Features
- GOOGLE_CLIENT_ID/SECRET: Google login broken (email/pw works ✅)
- INNGEST_EVENT_KEY/SIGNING_KEY: grading/clustering won't fire in production → set on Vercel dashboard
- Billing/Stripe: not started
- RAG for consult: v1 uses deep system prompts. Need embedding model (Groq doesn't support) to add RAG later.

## Next Actions (priority order)
1. **Set INNGEST keys on Vercel** → grading + clustering fire in production
2. **Fix security gaps**: user export + match route company isolation (P1s)
3. **Cross-tenant E2E test**: implement test.fixme in admin-jobs.spec.ts
4. **GitHub auto-deploy**: vercel.com/…/settings/git → Connect GitHub repo
5. **Billing/Stripe**: Phase 12

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅ · 10 Training Library ✅ · 11 Consult Agents ✅
