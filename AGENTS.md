# AGENTS.md — Persona Platform
# Stack: Next.js 15 + Drizzle + Supabase + Better Auth 1.6.5 + Groq (AI SDK v6) + Inngest + Vercel
# Updated: 2026-05-04

## Commands

```bash
npm run dev          # local dev (port 3000)
npm run build        # verify before deploy
npm run lint         # eslint — run after every edit
npm run seed         # idempotent DB seed (demo data)

# DB migrations (Drizzle)
npx drizzle-kit generate   # generate migration from schema
npx drizzle-kit migrate    # apply to DB (uses DIRECT_URL, port 5432)
npx drizzle-kit studio     # DB browser

# Type check
npx tsc --noEmit
```

## Deploy

- Vercel project: `personaproject-one` | Live: https://personaproject-one.vercel.app
- GitHub: https://github.com/arieldre/personaproject
- Push to branch → manual `vercel deploy` — CI not connected yet
- Supabase: `zkvzsoshpxicnpzbkdty` / eu-west-1

## Demo Credentials

- Admin: `admin@acme-demo.com` / set via `DEMO_ADMIN_PASSWORD` in `.env.local`
- Employees: `alice@`, `bob@`, `carol@`, `dave@`, `emma@`, `frank@`, `grace@` `@acme-demo.com` / same as above

## Key Files

| File | Purpose |
|------|---------|
| `lib/training/default-personas.ts` | 6 static personas — systemPrompt, persistentReminder, consultTagline |
| `lib/training/scenarios.ts` | 18 scenarios (6 personas × 3 difficulty) |
| `lib/clustering/` | optimalK() silhouette score, cosine similarity, VCPQ 14-dim vectors |
| `app/api/chat/[personaId]/route.ts` | Streaming chat — `maxDuration=60`, SSE via `streamText()` |
| `app/consult/[personaId]/` | Free expert chat (violet theme, no grading) |
| `lib/auth.ts` | Better Auth config — getUser() NOT getSession() in route handlers |
| `lib/db/` | Drizzle schema + two connection factories (pooler vs direct) |

## Architecture Rules (hard)

- **Compute split:** CRUD/auth/survey → Server Actions; Chat streaming → Route Handler `/api/chat/[personaId]`; Clustering/grading → **Inngest** (never Vercel `after()` — shares parent timeout)
- **DB connections:** `DATABASE_URL` pooler 6543 (runtime) + `DIRECT_URL` 5432 (migrations only). Always `prepare: false` in postgres.js
- **Vector ops:** `vector(14)` HNSW index. Cosine sim = `1 - (a <=> b)` — `<=>` is DISTANCE not similarity
- **Auth three-layer:** `middleware.ts` refresh → `layout.tsx` hydrate → route handler `getUser()` NOT `getSession()`
- **Zustand:** Provider pattern ONLY — module-level `create()` leaks across SSR requests
- **RLS:** Both SELECT + INSERT policies in same migration. `supabaseAdmin()` ESLint-banned from `app/api/**`

## Critical Gotchas

| Never | Instead |
|-------|---------|
| Hardcode Groq model | Use `process.env.GROQ_MODEL` |
| `requireAuth()` without try/catch | Throws Response → unhandled 500 |
| Instantiate SDK at module scope | Lazy-init: `function getClient() { ... }` (BP-045) |
| Export full user row | Allowlist fields explicitly (BP-056) |
| Sanitize only last LLM message | Sanitize entire history array (BP-055) |
| `personaId.includes(':')` for default personas | `personaId.startsWith('default:')` |
| Link with colon ID unencoded | `encodeURIComponent(id)` on links; `decodeURIComponent` on receiving page (BP-052) |

## LLM Config

- Chat: `temperature: 0.55`, `maxOutputTokens: 400` (personas)
- Grader: `temperature: 0`, reasoning-first G-Eval CoT pattern (5 dims, GoalAchievement 30% weight)
- Anti-drift: inject `persistentReminder` when `history.length >= 4`
- Groq 400 `tool_use_failed`: retry once immediately (BP-058)
- Fallback: `GROQ_MODEL_FALLBACK` env var

## Known Production Gaps

- `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` not set on Vercel → grading/clustering silently no-ops
- Google OAuth creds not set → email/pw only
- Rate limiter in-memory → bypassable multi-instance
- User export + match routes: missing company isolation (cross-tenant P1)
- Cross-tenant RLS E2E test: not written

## Phase Status

P1–P11 complete. Next options (pick one):
1. Fix P1 security gaps (cross-tenant isolation + rate limiter)
2. Set Inngest keys on Vercel → grading/clustering goes live
3. Start billing (Stripe)

## Required Env Vars

```bash
DATABASE_URL=        # pooler 6543
DIRECT_URL=          # port 5432 (migrations)
BETTER_AUTH_SECRET=  # 32+ char
GOOGLE_CLIENT_ID=    # optional — email/pw works without
GOOGLE_CLIENT_SECRET=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MODEL_FALLBACK=llama-3.1-70b-versatile
INNGEST_EVENT_KEY=   # missing in prod
INNGEST_SIGNING_KEY= # missing in prod
NEXT_PUBLIC_APP_URL=
```

## Domains

`#domain/supabase` `#domain/drizzle` `#domain/vercel` `#domain/nextjs` `#domain/llm` `#domain/groq` `#domain/auth` `#domain/inngest`
