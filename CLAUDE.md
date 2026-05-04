@AGENTS.md

# Persona Platform — Project Guide

## What This Is

AI-powered persona simulation SaaS for HR/L&D teams. Employees complete a 28-question VCPQ assessment → responses cluster into AI personas → managers chat with personas and find which persona any employee resembles (hero feature).

**Stack:** Next.js 15 App Router + Drizzle + Supabase + Better Auth 1.6.x + Groq via Vercel AI SDK + Inngest

## Planning

```
.planning/
  PROJECT.md       — project context, decisions, requirements
  REQUIREMENTS.md  — 55 v1 requirements with REQ-IDs
  ROADMAP.md       — 9-phase execution plan
  STATE.md         — current phase, progress, open spikes
  config.json      — GSD workflow config (YOLO, quality models)
  research/        — STACK / FEATURES / ARCHITECTURE / PITFALLS / SUMMARY
```

## Architecture Rules (do not violate)

**Compute split:**
- CRUD + auth + survey → Server Actions + Route Handlers (<1s)
- Chat streaming → Route Handler `/api/chat/[personaId]`, `maxDuration=60`, SSE via `streamText()` + `useChat`
- Clustering + persona-gen + grading → **Inngest** (Supabase Edge = 2s CPU cap; Vercel `after()` shares parent timeout)

**Database:**
- Personality vectors: `vector(14)` + HNSW index (NOT JSONB)
- Cosine similarity: `1 - (a <=> b)` — `<=>` returns DISTANCE not similarity
- Two connection strings: `DATABASE_URL` pooler port 6543 + `DIRECT_URL` port 5432 (migrations only)
- Always `prepare: false` in postgres.js (Supavisor transaction mode)

**Auth:**
- Better Auth 1.6.x pinned exact (pre-stable — minor versions break)
- Three-layer: `middleware.ts` (refresh only) → `layout.tsx` (hydrate) → route handler (`getUser()` NOT `getSession()`)
- Two Supabase client factories: `supabaseUser(cookies)` (RLS) and `supabaseAdmin()` (service-role, never in client bundles)
- JWT-claim RLS: inject `company_id` + `role`; policy = `auth.jwt() ->> 'company_id'`

**State:**
- Zustand Provider pattern ONLY — module-level `create()` leaks across SSR requests
- Server state via TanStack Query; UI state via Zustand

## Phase Ordering (hard constraints)

```
1 Foundation → 2 Survey → 3 Inngest → 4 Admin + 5 Clustering (parallel ok)
  → 6 Chat → 7 Hero Match → 8 Training → 9 Sales
```

Inngest (Phase 3) MUST ship before clustering (Phase 5).
Phase 6 (Chat) MUST ship before Phase 7 (Hero).

## Security Rules

- Every table: RLS enabled + BOTH SELECT and INSERT policies in same migration
- `supabaseAdmin()` ESLint-banned from `app/api/**` except explicit allowlist
- Prompt injection defense in Phase 6: delimiter wrapping + server-side filter + rate limit (20 msg/min, 200/day)
- `GROQ_MODEL` always from env — never hardcoded (Groq deprecated models 3+ times in 2024-2025)
- No bcrypt hashes or sensitive data in console.log (existing bug — fix in Phase 1)
- Cross-tenant RLS E2E test = FIRST test written, runs on every PR

## LLM / Groq

- Default model: `GROQ_MODEL` env var (currently Llama 3.3-70B)
- Streaming: Route Handler + `streamText().toDataStreamResponse()` + `useChat` on frontend
- Hard token cap per turn + last-8-turns history truncation (cost control; Phase 10 reduced from 20)
- Fallback chain in env: `GROQ_MODEL_FALLBACK`
- Chat tuning: `maxOutputTokens: 400`, `temperature: 0.55` for personas; `temperature: 0` for grader
- Scenario context: inject via `?scenarioId=` query param → append to system prompt (NOT prefix user message)

## Default Training Library (Phase 10)

- 6 static personas in `lib/training/default-personas.ts` — no DB, no Groq, no auth
- IDs prefixed `'default:'` (e.g. `'default:hr-partner'`) — no UUID, stored in `defaultPersonaId` varchar column
- Chat route: `personaId.startsWith('default:')` → skip DB lookup, load from `DEFAULT_PERSONAS_MAP`
- Grade route: default personas validated against static map; stored as `personaId: null` + `defaultPersonaId: 'default:hr-partner'`
- `encodeURIComponent` on all links containing colon IDs; `decodeURIComponent` on receiving page
- Scoring: single Groq call, 1-5 integer scale, 5 dimensions, GoalAchievement at 30% weight
- Grader stores `{ reasoning, score }` per dimension (reasoning first = G-Eval CoT pattern)

## Testing

- Cross-tenant isolation test written first (Phase 1) — runs on every PR
- Playwright `globalSetup` login-once pattern (auth.json) — see BEST_PRACTICES.md BP-019
- Always `{ name: '...', exact: true }` in Playwright (BP-020)
- `data-testid` on every new component at write time

## Git

- Branch per phase: `phase/1-foundation`, `phase/2-survey`, etc.
- Never touch main directly
- `/caveman-commit` for all commit messages
- External review agent mandatory after each phase (3+ files touched)

## Environment Variables Needed

```bash
# Database (Supabase)
DATABASE_URL=          # pooler port 6543 (runtime)
DIRECT_URL=            # port 5432 (migrations only)

# Auth (Better Auth)
BETTER_AUTH_SECRET=    # random 32+ char string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# LLM
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MODEL_FALLBACK=llama-3.1-70b-versatile

# Background jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Start Here

```bash
# Current state: planning complete, no code written yet
# Next: plan and execute Phase 1

/gsd:plan-phase 1    # OR just start Phase 1 directly per CLAUDE.md workflow
```

See `.planning/STATE.md` for environment setup checklist before Phase 1.
