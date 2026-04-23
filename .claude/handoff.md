# Handoff — Persona Platform
Updated: 2026-04-23

## Completed This Session
- Phase 9: Sales Enablement — landing page, GDPR pages (/privacy, /terms, /subprocessors), data export + soft-delete API, migration 0003
- Deployed to Vercel: https://personaproject-one.vercel.app
- Fixed deploy blockers: lazy Resend init (was crashing cold-start), auth baseURL
- `/personas` page for all users (grid → click → chat), added to nav
- Nav: Dashboard · Personas · Match · Training · Admin (admin-only)
- Dashboard: replaced "Phase 1 complete" placeholder with 4 feature nav cards
- Auto-k clustering: `optimalK()` via silhouette score, picks 3–10 based on data
- Admin UI: "Auto (recommended)" as default k option
- Survey: 6 optional demographic questions (age, relationship, children, tenure, work_style, level)
- Cluster fn: aggregates demographics per cluster, enriches Groq prompt → personas have age/family/role context
- Personas store demographics in `extendedProfile.demographics`

## Last Commit
`d11147cb` — feat: auto-k clustering + demographic survey questions + rich persona profiles
Branch: `phase/1-foundation`
GitHub: https://github.com/arieldre/personaproject (pushed ✅)

## Deploy Status
**LIVE** → https://personaproject-one.vercel.app
Vercel project: `arararar34-gmailcoms-projects/personaproject`
GitHub auto-deploy: NOT connected yet — go to vercel.com/…/settings/git and authorize GitHub app

## Demo Credentials
- Login: https://personaproject-one.vercel.app/login
- Email: admin@acme-demo.com / Password: AcmeDemo123!
- Survey: https://personaproject-one.vercel.app/survey/ACME2026
- Re-seed local: `npm run seed` (idempotent, now uses auto-k)

## Next Actions (priority order)
1. **GitHub auto-deploy**: vercel.com/…/settings/git → Connect GitHub repo (one-click OAuth)
2. **Inngest keys**: Set INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY on Vercel → clustering and grading jobs will fire
3. **Google OAuth**: Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → enable Google login
4. **Phase 10: Default Training Library** ← NEXT CODING SESSION (see spec below)

## Phase 10 Spec — Default Training Library

### Goal
Ship 6 built-in manager training personas (no company survey needed), each with 3 scenarios (easy/medium/hard), live AI chat, and a scored debrief at the end. Works for any user on any plan — no admin setup required.

### The 6 Personas (present to Ariel for final pick — swap any)
| # | Persona | Core tension |
|---|---------|-------------|
| 1 | **The HR Partner** | Policy disputes, sensitive disclosures, accommodation requests |
| 2 | **The Sales Prospect** | Objection handling, price negotiation, deal rescue |
| 3 | **The Engineering Lead** | Technical disagreements, deadline pressure, scope creep |
| 4 | **Your Direct Manager** | Asking for raise/promotion, pushing back on deadlines, handling public criticism |
| 5 | **The Underperformer** | First warning → PIP delivery → letting go (3-difficulty arc) |
| 6 | **The Frustrated Stakeholder** | Communicating delays, budget overruns, project failure recovery |

Rationale: covers the 6 highest-frequency difficult conversations in manager training literature (HR, Sales, Eng, Up/Down/Across). Ariel can swap 5 or 6 if another archetype fits better.

### Scenarios per Persona (3 each = 18 total)
Each difficulty must have: title, description (what the manager needs to achieve), systemPromptSuffix (how the AI character behaves, what softens/hardens them), and a 4-dimension rubric.

**Difficulty contract:**
- Easy: one clear issue, cooperative counterpart, single resolution path
- Medium: counterpart pushes back, ambiguity in right answer, 2+ valid paths
- Hard: emotional stakes, legal/ethical edge, counterpart actively resists — requires all 4 rubric dimensions simultaneously

### Scoring mechanic (deepen the existing grade Inngest fn)
Current rubric: communication · empathy · problemSolving · professionalism (all qualitative text).
Upgrade to: Groq returns numeric scores 1–10 per dimension + a 1-sentence "what you did well" + "what to improve" per dimension.
Final grade = weighted average: communication 30% · empathy 25% · problemSolving 25% · professionalism 20%
Letter grades: A 90–100 · B 80–89 · C 70–79 · D 60–69 · F <60
Show debrief card at end of session: overall score, per-dimension bars, strengths/improvements, replay option.

### What to build
1. `lib/training/default-personas.ts` — 6 static persona objects (no DB, no company, no Groq generation needed). Each has: id, name, tagline, avatar color, systemPrompt.
2. `lib/training/scenarios.ts` — extend existing file: add 18 new scenarios covering the 6 archetypes × 3 difficulties. Keep existing 6 scenarios.
3. `app/(app)/training/page.tsx` — redesign: show "Default Library" section (6 persona cards) + "Your Company Personas" section (existing). Click persona → scenario picker → chat.
4. `app/(app)/training/[scenarioId]/page.tsx` — pass `personaId` query param for default personas (no DB lookup needed, use static object).
5. Grade Inngest fn (`lib/inngest/functions/grade.ts`) — upgrade prompt to return numeric scores per dimension. Update `trainingSessions` schema if `score` field not numeric yet.
6. Debrief UI — after grading completes, show score card with per-dimension bars and letter grade.

### Data model note
Default personas are static (hardcoded, no DB row). Pass `personaId: 'default:hr-partner'` etc. The grade fn already accepts personaId — just add a branch: if personaId starts with `'default:'`, load from static map instead of DB.

### Research needed at session start
- Read existing `lib/training/scenarios.ts` (done — 2 archetypes × 3 difficulties, good rubric pattern to follow)
- Read existing grade Inngest fn to understand current scoring output format
- Read `app/(app)/training/` pages to understand current UI flow before redesigning
- Check `trainingSessions` schema for score column type

## Remaining Gaps
- GOOGLE_CLIENT_ID/SECRET: email/pw login works, but Google button broken
- INNGEST keys: clustering won't fire in production (works locally via seed script)
- Cross-tenant isolation E2E test: not written
- Billing: not started

## Key Env Facts
- Supabase: `zkvzsoshpxicnpzbkdty` / eu-west-1 / pooler port 6543
- GROQ_API_KEY, GROQ_MODEL, DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL: all set on Vercel ✅
- migration 0003 (deleted_at column): applied ✅

## Phase Status
1 Foundation ✅ · 2 Survey ✅ · 3 Inngest ✅ · 4 Admin ✅ · 5 Clustering ✅
6 Chat ✅ · 7 Hero Match ✅ · 8 Training ✅ · 9 Sales Enablement ✅

## Architecture Notes
- optimalK(): silhouette score, k in [3, min(10, n/2)], 3 attempts per k
- Demographics jsonb on questionnaire_responses — already existed in schema
- Persona extendedProfile.demographics = Groq-generated demographic description
- Match: cosine similarity mapped (sim+1)/2*100 → 0-100% compatibility
- Email (Resend): lazy-init via getResend() — returns null if key absent, safe with no key set
- Better Auth baseURL: reads BETTER_AUTH_URL env var first, falls back to NEXT_PUBLIC_APP_URL
