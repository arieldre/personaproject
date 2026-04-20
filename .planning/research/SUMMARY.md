# Research Summary — Persona Platform

**Synthesized:** 2026-04-20
**Sources:** STACK.md · FEATURES.md · ARCHITECTURE.md · PITFALLS.md

---

## Executive Summary

This is a **productization project wearing a migration costume.** The hero algorithms (VCPQ clustering, 14-dim vector math, persona generation, multi-pass grading, Self-Turing validation) are solid and well-tested IP. What's being rebuilt is (a) the operational surface a real HR customer can onboard 200 people through, and (b) the security posture required to sell past procurement.

Critical insight: **do not build the hero feature first.** Employee-to-persona matching cannot be demoed without a populated company. A real company cannot onboard without admin ergonomics (bulk invite, completion tracking, audit UI). A pre-seeded demo tenant built in parallel unblocks sales while admin features mature.

---

## Recommended Stack (with versions)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 (NOT 16) | 16 = 2-3x migration cost stacked on rebuild |
| ORM | Drizzle 0.36+ | 420ms vs 1100ms cold start; 7.4KB vs 1.6MB bundle |
| Database | Supabase PostgreSQL + pgvector | Pooler mandatory: port 6543, `prepare: false` |
| Auth | Better Auth 1.6.x pinned exact | Pre-stable; minor versions break |
| LLM | Groq via Vercel AI SDK v5 | Route Handler streaming, `useChat` hits URL |
| Background jobs | Inngest (free: 50k runs/mo) | Only option for >10s CPU on Vercel + retries |
| State | Zustand 5 Provider pattern | Module-level leaks SSR state across requests |
| Styling | Tailwind 4 + shadcn customized | Default shadcn = generic = loses deals |

**Vercel Hobby = 60s timeout** (Fluid Compute default-on April 2025). Groq streaming is viable on free tier.

**Two Supabase connection strings required:**
- `DATABASE_URL` → pooler port 6543 (runtime, `prepare: false`)
- `DIRECT_URL` → port 5432 session (drizzle-kit migrations only)

---

## Table Stakes (must-have or deal dies)

1. Google SSO (70% of RFPs name SSO explicitly)
2. Bulk employee invite (CSV + paste + resend + remove)
3. Completion dashboard ("who hasn't done the survey")
4. RBAC surfaced in UI (badge + permissions docs)
5. Audit log UI (DB exists; procurement needs read-only view)
6. GDPR data controls (export, 30-day soft-delete, DPA, subprocessors)
7. Password reset / magic-link fallback (currently missing entirely)
8. Invitation email with custom sender + editable copy
9. Mobile-responsive survey UX
10. Data residency statement (one sentence, zero engineering)

---

## Differentiating Features (wins deals)

| # | Feature | Why |
|---|---------|-----|
| D1 | Employee-to-persona matching (HERO) | No competitor does this |
| D2 | Practice conversation + grading | Already built; polish UX |
| D3 | Self-Turing Test score in admin | Kills "is this real?" objection |
| D4 | Custom LLM API key (BYO) | Enterprise procurement unlocker |
| D5 | Persona coverage map | HR leaders love visual "map of company" |
| D6 | Manager-specific dashboard | Makes it a tool managers use weekly |

---

## Critical Architecture Decisions

### Compute split
| Workload | Where | Why |
|----------|-------|-----|
| CRUD + auth + survey (<1s) | Vercel Route Handler / Server Action | Standard |
| Chat streaming (10-60s) | Vercel Fluid Compute, `maxDuration=60`, SSE | Holds long connection |
| K-means + persona-gen + grading (10-90s) | **Inngest** | Edge = 2s CPU cap; `after()` shares parent timeout |

### pgvector for personality vectors
- `vector(14)` + HNSW index (`m=16, ef_construction=64`) NOT JSONB
- **`<=>` returns cosine distance, NOT similarity** — `similarity = 1 - (a <=> b)`
- Wrap in Postgres RPC with `SECURITY DEFINER` + manual `company_id` check
- K-means runs in JS (Inngest); pgvector is for querying centroids only

### JWT-claim RLS (10-1000× faster than join-based)
- Inject `company_id` + `role` into JWT via Better Auth session hook
- Policy: `company_id = (auth.jwt() ->> 'company_id')::uuid`
- Wrap in `(SELECT auth.jwt())` for InitPlan caching
- Every writable table needs BOTH SELECT and INSERT policies

### Three-layer auth (all required)
1. `middleware.ts` — session refresh + coarse `/app/*` gate only
2. `app/(app)/layout.tsx` — load user + company with `React.cache()`
3. Route handlers / Server Actions — re-verify with `getUser()` NOT `getSession()`

### Server Actions vs Route Handlers
- Server Actions: VCPQ submit, persona create, invite, admin mutations
- Route Handlers: chat streaming (`useChat` needs URL), Better Auth, Stripe webhooks
- **`useChat` cannot call a Server Action** — costs hours if forgotten

---

## Top Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Silent cross-tenant data leak (RLS misconfiguration) | CRITICAL | Two named client factories + ESLint ban + RLS test as FIRST E2E spec |
| Four auth models colliding at Better Auth cutover | CRITICAL | Isolate auth as single-purpose phase; keep old Express warm 72h |
| Prompt injection + cost runaway at chat | CRITICAL | Design in: delimiters, input filter, per-user rate limit, token cap, env-based model |
| Groq model deprecation (happened 3+ times 2024-2025) | HIGH | `GROQ_MODEL` env var + weekly cron probe + fallback chain |
| Connection pool exhaustion (prepared statements) | HIGH | `prepare: false` + Supavisor port 6543 mandatory |

---

## Suggested Phase Order

1. **Foundation** — Next.js + DB + Auth (HIGH RISK — isolate)
2. **Survey + Vectors** — VCPQ UI + vector pipeline + pgvector
3. **Inngest Jobs** — Background job infra (ordering-critical: must ship before clustering)
4. **Admin Ergonomics** — Bulk invite, completion dashboard, audit UI
5. **Clustering + Persona-gen** — k-means + Groq generation via Inngest
6. **Chat** — SSE streaming + prompt injection defenses (HIGH RISK — isolate)
7. **Hero: Employee-to-Persona Match** — RPC + UI + coverage map
8. **Training + Grading** — Scenarios + Inngest grading + history persistence
9. **Sales Enablement** — Pre-seeded demo tenant + landing page + GDPR docs
10. **Billing** — Stripe Checkout + Billing Portal + ACH
11. **Post-first-customer** — Manager dashboard, SOC 2 process, custom LLM keys

---

## Open Questions (for phase-specific research)

1. Better Auth → Supabase JWT bridge mechanism (spike needed in Phase 1)
2. Existing bcrypt hashes: abandon or migrate? (Google-only = abandon confirmed)
3. Zustand persistence audit: which stores need `onRehydrateStorage`?
4. 18+ behavioral rules in prompt compiler: verify they survive `<user_message>` delimiters
5. Demo tenant: use existing Pearson-validated fixtures or Groq-generate synthetic employees
6. Inngest free-tier runway: ~200 runs/company/month → ~200 companies before upgrade
