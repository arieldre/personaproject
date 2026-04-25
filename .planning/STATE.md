# Project State — Persona Platform

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Manager understands any employee's work personality in minutes; practices difficult conversations with their AI persona.
**Current focus:** Phase 3 — Background Jobs (Inngest)

---

## Status

**Phase:** 2 (complete)
**Last commit:** `866e0828` — feat(phase-2): VCPQ survey, 14-dim vector pipeline, admin dashboard
**Branch:** `phase/1-foundation` (phases 1+2 committed here — rename to phase/2-survey next)
**Next action:** Phase 3 — Inngest setup + jobs table + Realtime status channel

---

## Phase Progress

| Phase | Name | Status | Commit |
|-------|------|--------|--------|
| 1 | Foundation | ✅ Complete | `22dcd8cb` |
| 2 | Survey + Vectors | ✅ Complete | `866e0828` |
| 3 | Background Jobs (Inngest) | ⬜ Not started | — |
| 4 | Admin Ergonomics | ⬜ Not started | — |
| 5 | Clustering + Persona Generation | ⬜ Not started | — |
| 6 | Chat | ⬜ Not started | — |
| 7 | Hero: Employee-to-Persona Match | ⬜ Not started | — |
| 8 | Training + Grading | ⬜ Not started | — |
| 9 | Sales Enablement | ⬜ Not started | — |

---

## What's Built (Phase 1+2)

### Auth + Foundation
- Next.js 15 App Router + Drizzle + Supabase + Better Auth 1.6.5
- Google OAuth login (`/login`) + password reset (`/reset-password`)
- Three-layer auth: middleware cookie check → app layout redirect → server-side session
- Migration applied: all tables + pgvector + RLS policies + HNSW indexes
- Email: Resend (console fallback in dev)

### Survey + Vectors
- 28-question VCPQ survey at `/survey/[code]` (public, no auth required)
- Mobile-first, progress bar, Likert 1-5 per question
- Pure-TS vector service: normalize → 14-dim float array → stored in pgvector
- Server Action handles validate → compute → insert response
- Admin survey list at `/admin/surveys`

---

## Environment (.env.local)

| Var | Status |
|-----|--------|
| `DATABASE_URL` | ✅ Set (eu-west-1 pooler port 6543) |
| `DIRECT_URL` | ✅ Set (eu-west-1 pooler port 5432 session mode) |
| `BETTER_AUTH_SECRET` | ✅ Set |
| `GOOGLE_CLIENT_ID` | ⬜ Not set — Google OAuth won't work until configured |
| `GOOGLE_CLIENT_SECRET` | ⬜ Not set |
| `GROQ_API_KEY` | ⬜ Not set |
| `INNGEST_EVENT_KEY` | ⬜ Not set — needed for Phase 3 |
| `INNGEST_SIGNING_KEY` | ⬜ Not set |
| `NEXT_PUBLIC_APP_URL` | ✅ Set (localhost:3000) |

---

## Key Architectural Decisions (locked)

- **Stack:** Next.js 15 + Drizzle + Supabase + Better Auth 1.6.5 pinned + Groq via Vercel AI SDK + Inngest
- **Supabase project:** `zkvzsoshpxicnpzbkdty` / region: `eu-west-1` (Ireland)
- **Pooler:** Supavisor port 6543 transaction mode + `prepare: false` mandatory
- **pgvector `vector(14)` + HNSW** for personality vectors — NOT JSONB
- **Cosine similarity = `1 - (a <=> b)`** — `<=>` returns distance not similarity
- **Inngest mandatory** for clustering/persona-gen/grading
- **JWT-claim RLS** — inject `company_id` + `role`; policy: `auth.jwt() ->> 'company_id'`
- **Drizzle circular FK (user↔companies):** remove `.references()` from `companies.createdBy` in schema; FK enforced in SQL migration only
- **Migration runner:** `drizzle-kit migrate` fails with special-char passwords — use `node + dotenv + sql.unsafe()` directly

---

## Open Spikes

| Spike | Phase | Status |
|-------|-------|--------|
| Better Auth → Supabase JWT bridge for RLS | 1 | ⬜ Deferred — using service-role for now |
| `useChat` v5 API + persona system prompt injection | 6 | ⬜ Open |
| Inngest + Vercel Fluid Compute event schema | 3 | ⬜ Open — resolve at Phase 3 start |

---

*Last updated: 2026-04-23*
