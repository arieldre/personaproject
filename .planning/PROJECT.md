# Persona Platform

## What This Is

An AI-powered persona simulation SaaS for HR and L&D teams. Companies collect employee feedback via a 28-question VCPQ assessment, which gets clustered into representative AI personas. Managers and employees can chat with these personas, run training scenarios, and — the hero feature — identify which company persona any specific employee most resembles.

## Core Value

A manager can understand any employee's work personality in minutes and practice difficult conversations with their persona — without uncomfortable real-life rehearsals.

## Requirements

### Validated

- ✓ VCPQ questionnaire (28 questions, 4 modules: Cognition, Communication, Hierarchy, Operational) — existing
- ✓ VCPQ → personality vector transformation (14 dimensions, Likert 1-5 → -1 to +1) — existing
- ✓ K-means++ clustering of employee vectors into personas — existing
- ✓ LLM persona generation from vectors (Groq, Llama 3.3-70B) — existing
- ✓ Deterministic prompt compilation (18+ behavioral rules from vectors) — existing
- ✓ Chat with AI personas (conversation threads, message history) — existing
- ✓ Training scenarios: 5 archetypes × 3 difficulty levels — existing
- ✓ Multi-pass LLM grading of training conversations — existing
- ✓ Multi-tenant company isolation (company_id on all user data) — existing
- ✓ RBAC: super_admin / company_admin / user roles — existing
- ✓ User invitations with 7-day expiry — existing
- ✓ Audit logging — existing
- ✓ Persona "Self-Turing Test" validation (Pearson correlation ≥ 0.8) — existing

### Active

- [ ] Migrate stack: React+Express+Docker → Next.js 15 + Vercel serverless + Supabase
- [ ] Replace Passport/JWT auth → Better Auth (Google OAuth only)
- [ ] Fix: OAuth tokens in URL → HTTP-only cookies (security)
- [ ] Fix: Debug logging exposes bcrypt hashes in production
- [ ] Add: Password reset flow (currently missing entirely)
- [ ] Add: CSRF protection on state-changing routes
- [ ] Fix: Training history persistence (endpoint stub returns empty array)
- [ ] Fix: Duplicate route handler in questionnaires.routes.js
- [ ] Build: Employee-to-persona matching (hero feature — compare employee VCPQ vector to all persona centroids, return closest match + similarity score)
- [ ] UX redesign: Modern AI product aesthetic (Linear/Loom feel)
- [ ] Demo flow: Guided onboarding with pre-seeded company + personas for sales demos
- [ ] Analytics dashboard: Team training progress, questionnaire response rate, persona coverage
- [ ] Billing: Stripe integration with tiered flat-fee plans
- [ ] Landing page: Request-demo CTA (after core product stable)
- [ ] LLM model switcher: Per-company model selection, own API key support

### Out of Scope

- Microsoft OAuth — dropped to simplify auth surface (Google only for now)
- Docker / self-hosting — eliminated; Vercel + Supabase handles infra
- Mobile app — HR buyers use desktop; not requested
- Free tier / self-serve signup — demo-only sales motion (less ops overhead)
- SSO/SAML — future enterprise tier only
- Webhook integrations — future roadmap
- Team comparison scenarios (multiple personas in one training) — future

## Context

**Existing codebase:** https://github.com/arieldre/personaproject
Full technical review done 2026-04-20. ~50KB backend services, ~280KB frontend, 20+ DB tables, 40+ API endpoints, 7 DB migrations. PostgreSQL 16, Express.js, React 18 + Vite, Groq SDK.

**What's proven:** Core algorithms (VCPQ clustering, vector transformation, persona generation, multi-pass grading) are solid and well-tested. The business logic is the IP — not the stack.

**What's broken:** OAuth tokens in URL, debug logging with sensitive data, missing password reset, training history not persisted, Docker dependency, no HTTPS setup.

**Target buyers:** HR / L&D teams at mid-size companies (50–500 employees) and enterprises (500+).

**Hero use case for demos:** Manager selects employee → sees which persona they match → similarity score → trait comparison card → can practice a conversation with that persona immediately.

## Constraints

- **Budget:** Under $50/month infrastructure — Vercel free tier + Supabase free tier initially
- **Team:** Solo builder
- **Hosting:** Vercel + Supabase only — zero Docker, zero DevOps
- **Auth:** Better Auth + Google OAuth only (no Microsoft, no Clerk, no Auth0 overhead)
- **LLM:** Groq default (free tier, Llama models); future: company-supplied API keys
- **Sales:** Demo-only (no free self-serve signup) — reduces support burden
- **Pricing:** Flat fee by employee count: $199/mo (≤100), $499/mo (≤500), $999/mo (≤2000), Enterprise custom

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 App Router over keeping React+Vite | SSR, better SEO, aligns with Ariel's other projects (furniture app) | — Pending |
| Vercel + Supabase over Docker self-host | Zero DevOps for solo builder; free tier covers months of runway | — Pending |
| Better Auth over Supabase Auth or Clerk | Already used in furniture app, works with any PostgreSQL, full control | — Pending |
| Groq (Llama) over OpenAI/Claude | Free tier sufficient for MVP; model switcher planned for paid tiers | — Pending |
| Flat fee pricing over per-seat | HR buyers hate per-seat math; simpler to sell and manage | — Pending |
| Demo-only (no free self-serve) | Reduces ops burden for solo builder; enterprise motion | — Pending |
| Employee-to-persona matching as hero feature | Most concrete, actionable, demo-able value prop; no HR tool does this | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after initialization*
