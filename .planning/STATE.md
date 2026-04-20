# Project State — Persona Platform

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** A manager can understand any employee's work personality in minutes and practice difficult conversations with their persona — without uncomfortable real-life rehearsals.
**Current focus:** Phase 1 — Foundation (Next.js + DB + Auth)

---

## Status

**Phase:** 0 (pre-execution — planning complete)
**Last action:** Roadmap created, requirements defined (55 v1 reqs, 9 phases)
**Next action:** `/gsd:plan-phase 1` OR `/gsd:discuss-phase 1`

---

## Phase Progress

| Phase | Name | Status | Commit |
|-------|------|--------|--------|
| 1 | Foundation | ⬜ Not started | — |
| 2 | Survey + Vectors | ⬜ Not started | — |
| 3 | Background Jobs (Inngest) | ⬜ Not started | — |
| 4 | Admin Ergonomics | ⬜ Not started | — |
| 5 | Clustering + Persona Generation | ⬜ Not started | — |
| 6 | Chat | ⬜ Not started | — |
| 7 | Hero: Employee-to-Persona Match | ⬜ Not started | — |
| 8 | Training + Grading | ⬜ Not started | — |
| 9 | Sales Enablement | ⬜ Not started | — |

---

## Key Architectural Decisions (locked — do not re-research)

- **Stack:** Next.js 15 + Drizzle + Supabase + Better Auth 1.6.x pinned + Groq via Vercel AI SDK + Inngest
- **Vercel Hobby = 60s timeout** (Fluid Compute default-on April 2025) — Groq streaming viable on free tier
- **pgvector `vector(14)` + HNSW index** for personality vectors — NOT JSONB
- **Cosine similarity = `1 - (a <=> b)`** — `<=>` returns distance, not similarity (critical bug if wrong)
- **Inngest mandatory** for clustering/persona-gen/grading — Supabase Edge = 2s CPU cap
- **Supavisor port 6543 + `prepare: false`** mandatory for serverless connection pooling
- **JWT-claim RLS** — inject `company_id` + `role` into JWT; policy: `auth.jwt() ->> 'company_id'`
- **Server Actions** for mutations; **Route Handlers** for streaming (`useChat` needs URL endpoint)
- **Zustand Provider pattern** — module-level `create()` leaks SSR state across requests
- **Two Supabase client factories** — `supabaseUser(cookies)` (RLS enforced) and `supabaseAdmin()` (service-role, ESLint-banned from API routes except allowlist)

---

## Open Spikes (resolve at phase start)

| Spike | Phase | Status |
|-------|-------|--------|
| Better Auth → Supabase JWT bridge mechanism for RLS | 1 | ⬜ Open |
| `useChat` v5 API + persona system prompt injection pattern | 6 | ⬜ Open |
| Inngest + Vercel Fluid Compute event schema | 3 | ⬜ Open |

---

## Environment Setup Required

Before Phase 1 execution:
- [ ] Supabase project created (get `DATABASE_URL` pooler + `DIRECT_URL` direct)
- [ ] Google OAuth app created (get `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`)
- [ ] Groq API key (get `GROQ_API_KEY`)
- [ ] Vercel project created and linked
- [ ] GitHub repo `persona-platform` created (not yet pushed)
- [ ] Inngest account created (free tier)
- [ ] Better Auth secret generated (`BETTER_AUTH_SECRET`)

---
*State initialized: 2026-04-20*
