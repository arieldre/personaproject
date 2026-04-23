# Handoff — Persona Platform
Updated: 2026-04-23

## Completed This Session
- Phase 9: Sales Enablement — `9b3a4066`
  - Landing page: hero, match preview mockup, "How it works", 3-tier pricing ($199/$499/$999/mo)
  - GDPR static pages: /privacy, /terms, /subprocessors (EU AI Act amber warning in terms)
  - Data export API: GET /api/user/export → JSON download (responses, conversations, training)
  - Soft-delete API: POST /api/user/delete → sets deleted_at, invalidates sessions
  - Migration 0003: deleted_at TIMESTAMPTZ + partial index on user table
  - Dashboard: Data & Privacy section (client component with export/delete buttons)
  - Seed expanded: 25 employees, 5 Groq personas (The Direct Driver, Innovative Free Spirit, etc.), 3 training sessions

## Last Commit
`9b3a4066` — feat(phase-9): sales enablement — landing page, GDPR pages, data export/delete
Branch: `phase/1-foundation`

## Deploy Status
**LIVE** → https://personaproject-one.vercel.app
Vercel project: `arararar34-gmailcoms-projects/personaproject`
GitHub auto-deploy: connect at vercel.com/…/settings/git (one-click OAuth, can't do headlessly)

## Demo Credentials (local only)
- Login: http://localhost:3000/login
- Email: admin@acme-demo.com / Password: AcmeDemo123!
- Survey: http://localhost:3000/survey/ACME2026
- Re-seed anytime: `npm run seed` (idempotent)

## Next Action
1. Connect GitHub auto-deploy: vercel.com/…/settings/git → authorize GitHub app
2. Merge `phase/1-foundation` to `main` when ready
3. Add GOOGLE_CLIENT_ID/SECRET when available → re-enable Google OAuth

## Remaining Gaps
- GOOGLE_CLIENT_ID/SECRET not set → Google login broken
- INNGEST_EVENT_KEY/SIGNING_KEY not set → Inngest jobs won't fire in production
- Cross-tenant isolation E2E test (required per CLAUDE.md, blocked on OAuth)
- External review agent not run for Phases 4-9
- No Vercel deployment yet

## Key Env Facts
- Supabase project ref: `zkvzsoshpxicnpzbkdty` / region: `eu-west-1`
- Pooler host: `aws-0-eu-west-1.pooler.supabase.com` port 6543 (transaction) / 5432 (session)
- GROQ_API_KEY: set in .env.local ✅
- GROQ_MODEL: llama-3.3-70b-versatile ✅
- match_employee_to_personas RPC: live in DB ✅

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅

## Architecture Notes
- Match route uses `db.execute(sql`...`)` → postgres.js returns RowList (spread to array, no .rows)
- RPC returns `persona_vector float4[]` → JS number[]
- Soft-delete: deleted_at TIMESTAMPTZ, 30-day purge job not yet implemented
- Data export: uses `db.query.*` relational API with `with: { messages: true }` joins
