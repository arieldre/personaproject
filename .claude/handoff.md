# Handoff — Persona Platform
Updated: 2026-04-25

## Completed This Session
- Phase 10: Default Training Library — 6 built-in manager personas × 3 difficulty scenarios each (18 total)
- Scoring upgrade: single Groq call, 1-5 scale (research-backed), GoalAchievement dimension (30% weight), Zod validation, letter grades A-F
- Security fixes: persona ownership check (P0), trainingSessions tenant isolation, companyId column added
- Chat efficiency: maxTokens 400, temp 0.55, scenario context in system prompt (not injected message)
- DB migration 0004: nullable personaId, defaultPersonaId, companyId, 7 performance indexes
- UX: active nav route indicator, polling timeout (3min), error recovery screen, AbortController on chat requests
- NavLinks refactored to client component for active state detection

## Last Commit
`1bb3e262` — feat: Phase 10 — default training library + scoring upgrade
Branch: `phase/1-foundation`
GitHub: https://github.com/arieldre/personaproject (pushed ✅)

## Deploy Status
**LIVE** → https://personaproject-one.vercel.app
Latest deploy: `personaproject-truyq2lqs-arararar34-gmailcoms-projects.vercel.app`
Vercel project: `arararar34-gmailcoms-projects/personaproject`
GitHub auto-deploy: NOT connected yet — go to vercel.com/…/settings/git and authorize GitHub app

## Demo Credentials
- Login: https://personaproject-one.vercel.app/login
- Email: admin@acme-demo.com / Password: AcmeDemo123!
- Training: https://personaproject-one.vercel.app/training (default library visible to all users)

## Architecture — What Was Built

### Default Personas (lib/training/default-personas.ts)
6 static personas (no DB, no Groq): HR Partner (Jordan Hayes), Sales Prospect (Marcus Reed),
Engineering Lead (Priya Sharma), Direct Manager (Alex Chen), Underperformer (Tyler Brooks),
Frustrated Stakeholder (Diana Kowalski). IDs: `'default:hr-partner'` etc.

### Scenarios (lib/training/scenarios.ts)
24 total: 6 legacy + 18 new (6 archetypes × easy/medium/hard).
New scenarios have `personaId: 'default:hr-partner'` etc.
`getScenariosForPersona(personaId)` helper added.

### Scoring (lib/inngest/functions/grade.ts)
- Single Groq call, temperature=0
- 1-5 integer scale, converted to 0-100: `((score-1)/4)*100`
- 5 dimensions: goalAchievement(30%), communicationClarity(20%), empathyListening(20%), problemSolving(15%), professionalism(15%)
- Each dimension: `{ score, reasoning }` — reasoning before score (G-Eval CoT pattern)
- `overallFeedback` string (2-3 sentences)
- Letter grades: A≥85, B≥70, C≥55, D≥40, F<40
- Zod validation on all LLM output
- Tenant isolation fix: session loaded with `AND company_id = ?`

### Chat route (app/api/chat/[personaId]/route.ts)
- `personaId.startsWith('default:')` → skip DB lookup, load from DEFAULT_PERSONAS_MAP
- `?scenarioId=` query param → appended to system prompt (research: more token-efficient than user message injection)
- Default persona: no conversation DB persistence
- maxOutputTokens: 400, temperature: 0.55

### Grade route (app/api/training/grade/route.ts)
- Validates persona ownership (P0 security fix: `AND company_id = user.companyId`)
- Default personas: validated against static map
- Stores `personaId: null` + `defaultPersonaId: 'default:hr-partner'` for defaults

## Remaining Gaps — Security (from review agents)
- **User export route**: conversations not scoped to company (P1)
- **Match route**: responseId lookup has no company isolation (P1)
- **Rate limiter**: in-memory, resets on restart, multi-instance bypassable (P2)
- **JWT claims**: not validated against DB on every request (P2)
- Cross-tenant isolation E2E test: still TODO/fixme in admin-jobs.spec.ts

## Remaining Gaps — Features
- GOOGLE_CLIENT_ID/SECRET: email/pw login works, Google button broken
- INNGEST keys: clustering/grading won't fire in production (works via seed locally)
- Billing/Stripe: not started

## Key Env Facts
- Supabase: `zkvzsoshpxicnpzbkdty` / eu-west-1 / pooler port 6543
- Migration 0004 applied ✅ (nullable personaId, defaultPersonaId, companyId on trainingSessions, 7 indexes)
- GROQ_API_KEY, GROQ_MODEL, DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL: all set on Vercel ✅

## Next Actions (priority order)
1. **Set INNGEST keys on Vercel** → clustering + grading will fire in production
2. **Fix security gaps**: user export + match route company isolation (P1s from security review)
3. **Cross-tenant E2E test**: implement test.fixme in admin-jobs.spec.ts
4. **GitHub auto-deploy**: vercel.com/…/settings/git → Connect GitHub repo

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅ · 10 Training Library ✅
