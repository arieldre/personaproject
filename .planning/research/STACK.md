# Technology Stack — Persona Platform Migration

**Project:** Persona Platform (AI-powered HR/L&D SaaS)
**Migration:** Express + React + Docker + PostgreSQL → Next.js 15 + Vercel + Supabase + Better Auth + Groq
**Researched:** 2026-04-20
**Overall confidence:** HIGH (primary sources: official Vercel, Next.js, Supabase, Better Auth, Groq docs + 2025/2026 dated articles)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | **15.x** (pin to latest 15.5+) | Full-stack React framework, App Router, serverless on Vercel | **Stay on 15, not 16.** Next.js 16 shipped Oct 2025 but migrations are reportedly "2-3x estimated time" with breaking async `cookies()`/`headers()`/`params`, removed `next lint`, and Turbopack-only configs. For a solo builder doing a rebuild, 15.5 LTS-equivalent is the safe target. Revisit 16 after MVP ships. |
| **React** | **19.x** | UI runtime | Ships with Next.js 15. Server Components + Server Actions are stable here. |
| **TypeScript** | **5.6+** | Type safety across front/back | Strict mode on from day one. Matches existing team conventions. |
| **Node.js runtime** | **20.x** (Vercel default) | Server runtime | Node runtime (not Edge) for Groq streaming + Better Auth + Supabase clients — Edge runtime has restrictions that bite LLM streaming loops. |

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Supabase Postgres** | 15+ (managed) | Primary datastore, 20+ tables migrated from existing | Free tier = 500MB DB + 2GB bandwidth + 50K MAU auth — sufficient for demo-phase MVP. Cheap path to production. |
| **Supavisor pooler** | Port **6543** (transaction mode) | Connection pool for serverless | Serverless functions = ephemeral connections. Transaction mode reuses connections aggressively. **Port 5432 direct will exhaust connections under cold-start bursts.** |
| **Drizzle ORM** | **0.36+** | Type-safe query builder + migrations | **Recommended over Prisma.** On Vercel Node functions Drizzle averages ~420ms cold-start-to-first-query vs Prisma's ~1100ms (Prisma 7 improved to ~115ms but still 1.5x Drizzle's ~75ms). 7.4KB bundle vs 1.6MB. Zero binary deps. Existing migrations can be represented as Drizzle schema + `drizzle-kit push`. |
| **postgres.js** | **3.4+** | Drizzle's node-postgres driver | Lightweight, works well with Supavisor transaction mode. Set `prepare: false` because port 6543 blocks prepared statements. |

### Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Better Auth** | **1.6.x** (latest stable) | Auth framework, Google OAuth, sessions, invitations | Matches user's furniture app usage. Full control over schema (no black-box `auth.users` table). Works with any Postgres. Note: v1 "stable" roadmap still in progress — pin exact version. |
| `better-auth/next-js` | included | Next.js 15 App Router integration | Provides `toNextJsHandler()` for route handlers. |
| `better-auth/adapters/drizzle` | included | DB adapter | `drizzleAdapter(db, { provider: "pg", schema })`. Co-locates user table with business tables. |

### LLM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel AI SDK** | **`ai` v5.x + `@ai-sdk/groq` latest** | Unified LLM interface, streaming, useChat hook | Normalizes provider switching — critical for the planned "per-company model selection + own API key" feature. `streamText` → `result.toDataStreamResponse()` is the standard pattern. |
| **Groq SDK** (indirect) | current | Llama 3.3 70B inference | Accessed via `@ai-sdk/groq`, not directly. Keeps provider-switching story clean. |

### State & UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zustand** | **5.x** | Client-side store (chat UI state, form drafts, UI toggles) | Lightweight, 150% YoY usage growth, works with App Router using Provider pattern (see gotchas). |
| **TanStack Query** | **5.x** | Server-state caching for non-streaming reads | Pairs well with Zustand. Zustand = UI state; TanStack Query = fetched server data. Don't cross the streams. |
| **Tailwind CSS** | **4.x** | Styling | Already standard across user's projects. |
| **shadcn/ui** | latest | Component primitives | Aesthetic requirement is "Linear/Loom feel" — shadcn defaults are a bad start. Use primitives, but **do not ship default shadcn UX on consumer surfaces** — customize aggressively. |
| **Lucide React** | latest | Icons | Standard pairing with shadcn. |
| **react-hook-form + zod** | latest | Forms + validation | Works with Server Actions via `zod-validator`. |

### DevOps / Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | Hobby tier → Pro when needed | Hosting, CI/CD, env vars, analytics | $50/mo budget caveat: Hobby is $0, Pro is $20/user/mo. Most limits are fine for demo phase. |
| **Supabase CLI** | latest | Local dev stack + migration management | `supabase start` = local Postgres + Studio + Storage. Required for branching later. |
| **Playwright** | latest | E2E tests with auth state persistence | User already has playwright installed globally. Use login-once global-setup pattern. |
| **Vitest** | 2.x | Unit tests for algorithms (clustering, vector math, grading) | Faster than Jest, ESM-native, the existing Jest tests port 1:1. |
| **Biome** or **ESLint + Prettier** | latest | Lint/format | Biome is faster; ESLint is Next.js-recommended. Pick one, don't layer both. |

---

## Migration Decisions (with rationale)

### 1. Server Actions vs Route Handlers — Use BOTH, deliberately

**Decision:** Server Actions for form submissions and mutations. Route Handlers (`route.ts`) for LLM streaming and any externally-called endpoint.

**Why:**
- **Server Actions** give automatic type safety, revalidation via `revalidatePath()`, progressive enhancement, and unguessable endpoints (Next.js 15 security improvement). Perfect for VCPQ questionnaire submission, persona creation from form, invitations, profile edits.
- **Route Handlers** give full HTTP control — streaming responses, SSE, status codes, custom headers. **LLM streaming must be a Route Handler.** Server Actions don't support streaming responses back to the client natively (you use `useChat` → hits a route handler URL).
- Webhooks (future Stripe integration) must be Route Handlers — Server Actions can't receive external traffic.

**Concrete mapping for this app:**

| Feature | Mechanism |
|---------|-----------|
| Submit VCPQ questionnaire | Server Action + `revalidatePath('/personas')` |
| Generate persona from cluster centroid | Server Action (non-streaming Groq call, job record) |
| Chat with persona (streaming) | Route Handler `/api/chat/[personaId]/route.ts` + `streamText` + `useChat` hook |
| Training scenario grading | Route Handler (multi-pass LLM, needs 30s+ budget) |
| Employee-to-persona match | Server Action (pure compute, sub-second) |
| Better Auth endpoints | Route Handler `/api/auth/[...all]/route.ts` with `toNextJsHandler(auth)` |
| Invitation accept | Server Action |
| Stripe webhooks (future) | Route Handler `/api/webhooks/stripe/route.ts` |

### 2. Supabase client pattern — `@supabase/ssr` for auth context ONLY, Drizzle for everything else

**Decision:** Use `@supabase/ssr` for *auth cookie handling* (if you ended up needing Supabase Auth), but since we're using Better Auth, **use Drizzle + postgres.js direct against the Supavisor pooler for all data access.** Skip `@supabase/supabase-js` entirely except for Supabase Storage (if using it for file uploads) and Realtime (if using it).

**Why:**
- Better Auth owns auth, so `@supabase/ssr`'s cookie-refresh dance is unnecessary.
- `supabase-js` is a REST/RPC wrapper — nice for RLS-driven apps but your app already has a rich server-side permission model (company_id isolation, RBAC). Direct SQL via Drizzle is faster, type-safer, easier to reason about.
- Existing 7 DB migrations port cleanly to `drizzle-kit`. Existing queries port cleanly to Drizzle's query builder.
- **RLS is still on** as defense-in-depth, but enforcement primarily happens in the application layer where it always has.

### 3. Connection string — pooler transaction mode (port 6543), NOT direct 5432

**Decision:** Use pooler URL `postgres://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres`. Pass `prepare: false` to postgres.js client. Keep direct 5432 URL only for `drizzle-kit` migrations (needs session mode).

**Why:** Transaction mode shares connections across invocations. Direct mode on serverless = "max connections reached" within hours. Two env vars: `DATABASE_URL` (pooler, runtime) and `DIRECT_URL` (session, migrations only).

### 4. Better Auth DB co-location

**Decision:** Better Auth tables (`user`, `session`, `account`, `verification`) live in the same Supabase Postgres DB as business tables. No separate auth DB.

**Why:**
- Single transaction for signup + company creation.
- Foreign keys from `users.company_id` → `companies.id` just work.
- One DB to back up, one connection pool, one migration pipeline.

**Migration consideration:** Existing app uses bcrypt password hashes (Better Auth defaults to scrypt). Since the decision is "Google OAuth only, no Microsoft," existing password hashes can be **abandoned entirely** — all users re-auth via Google on first login. No password hash migration needed. Confirm this with product before executing.

### 5. Groq streaming on Vercel Hobby — the 60-second window

**UPDATED from original question premise:** Vercel Hobby timeout is **60 seconds** (default with Fluid Compute, which is default-on as of April 2025), **not 10 seconds**. This is a major assumption correction.

**Decision:** Use `streamText` from `@ai-sdk/groq` with `maxDuration = 60` exported from route handlers. Groq Llama 3.3 70B response times are sub-second TTFT + <10s for typical chat responses. **Budget is comfortable.**

**Edge case:** Multi-pass grading (existing feature) may need up to 30s. Fits. If a future feature needs >60s (e.g., bulk persona regeneration for 500 employees), move it to a background job pattern (queue + cron) rather than Pro tier.

```ts
// app/api/chat/[personaId]/route.ts
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60; // Hobby tier cap
export const runtime = 'nodejs'; // NOT edge — Groq SDK + better-auth prefer node

export async function POST(req: Request) {
  // auth check via better-auth
  // load persona prompt
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages,
    system: compiledPersonaPrompt,
  });
  return result.toDataStreamResponse();
}
```

### 6. Zustand with App Router — Provider pattern (required for SSR safety)

**Decision:** Wrap stores in a per-request Provider using `createStore` (factory) pattern — do NOT use module-level `create()` calls for SSR-touched state.

**Why:** Module-level stores leak state across requests on the server. Provider pattern gives each request its own store instance. Pattern from Zustand docs (current 2025 Next.js guide):

```ts
// stores/chat-store.tsx
'use client';
import { createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';

// factory, not module singleton
const createChatStore = () => createStore<ChatState>()(/* ... */);

const ChatStoreContext = createContext<ReturnType<typeof createChatStore> | null>(null);

export function ChatStoreProvider({ children }) {
  const storeRef = useRef<ReturnType<typeof createChatStore>>();
  if (!storeRef.current) storeRef.current = createChatStore();
  return <ChatStoreContext.Provider value={storeRef.current}>{children}</ChatStoreContext.Provider>;
}

export function useChatStore<T>(selector: (s: ChatState) => T): T {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('Missing ChatStoreProvider');
  return useStore(store, selector);
}
```

**Pure-client UI state (sidebar toggle, theme):** module-level `create()` is fine — never touches the server.

**Server-fetched data (persona list, match results):** Use TanStack Query, not Zustand. Don't store server state in Zustand.

### 7. Next.js 15 not 16 — wait for ecosystem catch-up

**Decision:** Target Next.js 15.5+ for MVP. Re-evaluate Next.js 16 after MVP ships.

**Why:** 16 is faster (Turbopack production builds) but carries real migration cost (async `cookies()`, `headers()`, `params`; removed `next lint`; Turbopack-only configs). Solo builder rebuilding an existing app should not also be QA'ing a fresh framework major.

---

## Local Dev Setup

**Recommended:** Supabase CLI local stack (requires Docker Desktop locally — yes, despite "no Docker in production"). This is the only way to get realistic RLS testing, local migrations, and fast iteration.

```bash
# One-time
npm i -g supabase
supabase init
supabase start   # boots Postgres + Studio on localhost:54321, API on 54323

# Per session
supabase status  # prints local DATABASE_URL
npm run dev
```

**Env file strategy:**

```bash
# .env.local (for local dev)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<openssl rand -hex 32>
GOOGLE_CLIENT_ID=<dev OAuth app>
GOOGLE_CLIENT_SECRET=<dev OAuth app>
GROQ_API_KEY=<dev key>

# .env.production (Vercel env vars)
DATABASE_URL=postgres://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgres://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
# ...
```

**Docker Desktop requirement:** Supabase CLI depends on Docker. This is fine because it's a dev-time dependency, not a deployment dependency. If the user genuinely refuses Docker *anywhere* (including locally), fall back to a Supabase cloud dev branch — but that's slower, consumes quota, and has network latency.

**Branching (post-MVP):** When moving to production, use Supabase Git branching for PR previews — each PR gets an ephemeral Postgres branch tied to its Vercel preview deployment. Not needed during solo MVP build.

---

## Vercel & Supabase Gotchas

### Vercel Hobby Limits (as of April 2025, Fluid Compute default)

| Limit | Hobby value | Relevance to this app |
|-------|-------------|----------------------|
| Function max duration | **60 seconds** | ✓ Groq chat fits. Training grading (multi-pass) fits. |
| Function memory | **2 GB (1 vCPU)** | ✓ K-means clustering for MVP company sizes (≤500 employees, 14-dim vectors) runs in <100MB. |
| Payload size (request or response) | **4.5 MB** | ⚠ Streamed responses are exempt from the 4.5MB cap (they chunk). Regular JSON responses with >4.5MB data (e.g., dumping all conversation history) will fail. Paginate. |
| Bandwidth | 100 GB/mo | ✓ Demo-phase traffic negligible. |
| Build time | 45 min | ✓ Never hit. |
| Concurrent builds | 1 | Solo dev, no impact. |

### Critical Supabase Gotchas

1. **BP-018 lesson applies: pooler/RLS interaction.** Better Auth sessions authenticate the user — but Supabase RLS (if enabled on tables) doesn't know the Better Auth session. RLS will block queries unless you either (a) disable RLS and enforce permissions in the app layer, or (b) set a custom JWT claim that Postgres policies read. **Recommended: RLS off for business tables, enforce `company_id` WHERE clauses in Drizzle queries via a shared `withCompany(ctx, query)` helper.** Keep RLS on for any public-exposed tables (e.g., if you later add Supabase Storage policies).

2. **Transaction mode blocks prepared statements.** postgres.js must be configured `{ prepare: false }`. If you forget, queries fail intermittently with weird errors.

3. **Types.ts drift (BP-021).** Do not trust a generated types file as source of truth for DB state. Verify each migration applied with a `\d tablename` check before trusting the types.

4. **IPv4 surcharge.** Non-pooler connections to Supabase now require IPv4 add-on (~$4/mo) because Supabase migrated to IPv6-only direct connections. Pooler handles this for you. **Another reason to stay on the pooler.**

5. **Connection limits.** Supabase free tier = 60 pooler connections. Plenty for Hobby (Vercel Hobby concurrent invocations are well under this), but monitor when scaling to Pro.

### Better Auth Gotchas

1. **Pin version.** Better Auth is pre-1.0 stable (currently 1.6.x as minor version). Minor releases have shipped breaking changes. Use exact version in `package.json`, upgrade deliberately.

2. **CSRF protection.** Better Auth handles CSRF for its own endpoints. For Server Actions, Next.js 15's "unguessable endpoints" help, but **state-changing Route Handlers you write yourself need explicit CSRF checks** (origin header validation minimum).

3. **Google OAuth redirect URI.** Must match exactly between Google Cloud Console and `BETTER_AUTH_URL`. Vercel preview deployments have different URLs per PR — set up multiple redirect URIs or use Vercel's production-only OAuth app + wildcard staging app.

### Vercel AI SDK / Groq Gotchas

1. **`maxDuration` export is per-route.** Forgetting it on a streaming route defaults to whatever Vercel picks (usually fine, but explicit is safer).

2. **`useChat` + Server Actions is not a thing.** `useChat` hits a URL. This URL must be a Route Handler. If you try to call a Server Action from `useChat`, you'll spend hours debugging why streaming doesn't work.

3. **Groq rate limits.** Free tier = 30 req/min for Llama 3.3 70B. Fine for demos. Implement exponential backoff in the route handler. Show rate limit errors gracefully in UI.

4. **Edge runtime temptation.** Edge is faster at cold start but (a) Better Auth + Drizzle + postgres.js are Node-only in many configurations, (b) Edge has 1MB deployment size limit, (c) streaming Edge has its own 25-second first-byte window. **Use Node runtime everywhere for this app.**

---

## What NOT to Use

| Avoid | Why | Use instead |
|-------|-----|-------------|
| **Supabase Auth** | Overlaps with Better Auth; picks one, not both. User already decided Better Auth. | Better Auth |
| **Prisma 7** | 1.5x slower cold starts than Drizzle on Vercel, 100x larger bundle. Migration complexity (Rust engine removal in v7) ongoing. | Drizzle |
| **`supabase-js` for everything** | REST wrapper; you have richer server code patterns already. Only reach for it if you use Storage/Realtime. | Drizzle + postgres.js |
| **Next.js 16 right now** | 2-3x migration cost; you're already rebuilding. Don't stack two major migrations. | Next.js 15.5+ |
| **Edge runtime** | Breaks Node-only libs; streaming has its own traps; 1MB bundle limit. | Node runtime |
| **Clerk / Auth0 / Kinde** | Not free at scale; user already committed to Better Auth; adds vendor lock-in. | Better Auth |
| **Redux / Redux Toolkit** | Heavier than needed; App Router era has better primitives. | Zustand + TanStack Query |
| **SWR** | TanStack Query is better-documented in App Router era, has better devtools. | TanStack Query v5 |
| **Jest** | Slower than Vitest, worse ESM story, Next.js docs now use Vitest. Existing Jest tests port 1:1. | Vitest |
| **`@supabase/auth-helpers-nextjs`** | Deprecated in favor of `@supabase/ssr`. Don't follow old tutorials. | `@supabase/ssr` (if you use Supabase Auth — you don't) |
| **Session mode (port 5432) for app traffic** | Exhausts connections on serverless within hours. | Transaction mode (6543) with `prepare: false` |
| **Module-level Zustand stores for server-touched state** | State leaks across requests on Vercel. | Provider pattern per request |
| **Storing Groq API key client-side** | Instant abuse. | Route Handler only, server-side env var |
| **Default shadcn styles on consumer surfaces** | Looks generic; user explicitly wants Linear/Loom aesthetic. | Customize shadcn primitives aggressively, or use Frontend Design skill for net-new screens |
| **Docker in production** | User explicitly eliminated it; Vercel + Supabase covers infra. | Vercel + Supabase cloud |
| **Microsoft OAuth, SAML, self-serve signup** | Explicitly out of scope in PROJECT.md. | Google OAuth + demo-only invitations |

---

## Installation (pin exact versions in `package.json`)

```bash
# Core
npm install next@15 react@19 react-dom@19

# DB + ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install better-auth

# LLM
npm install ai @ai-sdk/groq zod

# State + data fetching
npm install zustand @tanstack/react-query

# Forms
npm install react-hook-form @hookform/resolvers zod

# UI
npm install tailwindcss@4 lucide-react class-variance-authority clsx tailwind-merge
# shadcn/ui installed per-component via `npx shadcn@latest add <component>`

# Dev
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D vitest @vitest/ui @testing-library/react jsdom
npm install -D @playwright/test
npm install -D @biomejs/biome   # or eslint + prettier

# Supabase CLI (global, dev-time only)
npm i -g supabase
```

---

## Sources

### Primary (HIGH confidence — official docs)
- [Next.js 15 Blog (official)](https://nextjs.org/blog/next-15)
- [Next.js 16 Upgrading Guide (official)](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js Route Handlers (official)](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Server Actions vs Route Handlers — Makerkit](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- [Vercel Functions Limits (official)](https://vercel.com/docs/functions/limitations)
- [Vercel Fluid Compute (official)](https://vercel.com/docs/fluid-compute)
- [Vercel Fluid Compute Changelog — higher defaults/limits](https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute)
- [Vercel AI SDK Streaming Docs (official)](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [Vercel AI SDK Timeout on Vercel troubleshooting](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
- [Vercel + Groq Integration (official)](https://vercel.com/docs/ai/groq)
- [Groq AI SDK Docs (official)](https://console.groq.com/docs/ai-sdk/)
- [Supabase Connect to Postgres (official)](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Connection Management (official)](https://supabase.com/docs/guides/database/connection-management)
- [Supavisor FAQ (official)](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)
- [Supabase Local Development & CLI (official)](https://supabase.com/docs/guides/local-development)
- [Supabase Server-Side Auth for Next.js (official)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Better Auth Installation (official)](https://better-auth.com/docs/installation)
- [Better Auth Changelog (official)](https://better-auth.com/changelog)
- [Better Auth 1.6 Blog](https://better-auth.com/blog/1-6)
- [Better Auth Supabase Migration Guide (official)](https://better-auth.com/docs/guides/supabase-migration-guide)
- [How to connect Better Auth to Supabase Database — Joshua K Barua](https://medium.com/@joshua.k.barua/how-to-connect-to-your-supabase-database-using-better-auth-aa6be3e985e1)
- [Zustand Next.js Setup (official docs)](https://zustand.docs.pmnd.rs/learn/guides/nextjs)

### Secondary (MEDIUM confidence — 2025/2026 dated articles, multiple corroborating sources)
- [Next.js 15 vs 16 — Descope](https://www.descope.com/blog/post/nextjs15-vs-nextjs16)
- [Migrating to Next.js 16 production — amillionmonkeys](https://www.amillionmonkeys.co.uk/blog/migrating-to-nextjs-16-production-guide)
- [Drizzle vs Prisma 2026 — Makerkit](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Drizzle vs Prisma cold starts — DEV/jsgurujobs](https://dev.to/jsgurujobs/6-prisma-vs-drizzle-patterns-that-cut-serverless-cold-starts-by-700ms-5dl5)
- [Supabase Connection String Guide — WeWeb](https://www.weweb.io/blog/supabase-connection-string-guide-ports-pooling)
- [Streaming LLM in Next.js with SSE — Eaures](https://www.eaures.online/streaming-llm-responses-in-next-js)
- [Zustand + Next.js 15 — Dimas Roger](https://www.dimasroger.com/blog/how-to-use-zustand-with-next-js-15)
- [Supabase cookie-based auth 2025 — Medium/Shubham](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1)

### Internal (HIGH confidence — user's own best practices)
- BP-018 (Supabase service-role vs RLS for cross-user reads)
- BP-019 (Supabase cookie encoding caveats)
- BP-020 (Playwright exact:true for button names)
- BP-021 (types.ts drift from actual DB state)
- `memory/feedback_vite_env_vars.md` (env var build-time baking — applies to Vercel too: `NEXT_PUBLIC_*` baked at build)
