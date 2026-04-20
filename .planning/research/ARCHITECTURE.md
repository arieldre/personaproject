# Architecture Patterns

**Domain:** AI-powered persona SaaS (HR/L&D) — Next.js 15 App Router + Supabase + Groq
**Researched:** 2026-04-20
**Overall confidence:** HIGH

---

## Executive Architecture Decision

**Don't try to do everything inside Vercel serverless functions.** The workload splits into three *kinds* of compute with wildly different characteristics:

| Workload | Latency | CPU | Where |
|----------|---------|-----|-------|
| CRUD + auth + survey save | <1s | Low | **Vercel route handlers** (Node runtime) |
| Chat streaming + scenario grading | 10-60s, streaming | Low (I/O wait) | **Vercel route handlers** with Edge-ish streaming (Fluid Compute) |
| K-means clustering + persona generation batch | 10-90s, CPU-heavy | High | **Inngest** (durable workflow, triggered via event) |

**Headline recommendation:** Next.js 15 App Router → Vercel (Pro plan, Fluid Compute on) → Inngest for heavy background work → Supabase (Postgres + pgvector + Auth session store + Realtime for status push) → Groq via Vercel AI SDK.

Do **not** use Supabase Edge Functions for clustering — hard 2s CPU limit. Do **not** use QStash alone — it's a message bus, not a workflow engine, so persona-generation retries/fan-out become your problem. Do **not** rely on `waitUntil` / `after()` for clustering — both cap at the parent function's 300s max.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browser (React Server Components + Client Components)                │
│  - Survey UI, persona chat (stream), match card, admin dashboards    │
└──────────────┬──────────────────────────────────────┬────────────────┘
               │ HTTPS                                 │ SSE (chat stream)
               │                                       │ Supabase Realtime (job status)
┌──────────────▼───────────────────────────────────────▼────────────────┐
│ Vercel (Next.js 15 App Router, Fluid Compute, Pro)                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ middleware.ts   │  │ Route Handlers    │  │ Server Components    │ │
│  │ - refresh       │  │ - /api/chat       │  │ - SSR page shells    │ │
│  │   Supabase      │  │   (streamText)    │  │ - direct Supabase    │ │
│  │   session       │  │ - /api/survey     │  │   reads w/ user JWT  │ │
│  │ - route gate    │  │ - /api/jobs/*     │  │                      │ │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘ │
└──────────────┬────────────────────┬─────────────────────┬─────────────┘
               │ enqueue             │ stream              │ read
               │ Inngest event       │ Groq               │
               ▼                     ▼                     ▼
  ┌─────────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
  │ Inngest Cloud       │  │ Groq API        │  │ Supabase (Postgres) │
  │  (durable workflow) │  │ Llama 3.3-70B   │  │  - RLS multi-tenant │
  │  - clustering step  │  │                 │  │  - pgvector (14-d)  │
  │  - persona gen step │  └─────────────────┘  │  - Better Auth      │
  │  - grading step     │                       │    session table    │
  │  - retries, sleep,  │                       │  - Realtime channel │
  │    fan-out          │                       │  - pg_cron (optional│
  └──────────┬──────────┘                       │    for cleanup)     │
             │                                  └──────────────────────┘
             └── writes results → Postgres ──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `middleware.ts` | Refresh Supabase session cookies on every request; soft-gate `/app/*` routes | Supabase Auth, all server components |
| Server Components | SSR pages; read-only data fetch with user JWT (RLS enforced) | Supabase (direct) |
| Route Handlers `/api/chat/*` | Stream LLM responses (SSE via ReadableStream) | Groq API, Supabase (write messages) |
| Route Handlers `/api/jobs/*` | Enqueue Inngest events; report job status | Inngest, Supabase |
| Inngest Functions | Durable multi-step workflows: clustering, persona-gen, grading | Postgres, Groq |
| Supabase Postgres | Source of truth; RLS isolation; pgvector similarity; Realtime status push | Everything |
| Better Auth | Google OAuth only; session table in Postgres | Supabase Postgres |
| Groq | Inference (streamed for chat, buffered for persona gen/grading) | Route handlers + Inngest |

**Client never talks to Groq directly.** Key exposure risk and no place to enforce per-company rate limits. Always proxy through route handler.

---

## Long-Running Operations Strategy

This is the most important decision in the migration. Express had no timeout — on Vercel you have to partition the work.

### Constraints (verified)

| Platform | Max duration | CPU limit | Notes |
|----------|--------------|-----------|-------|
| Vercel Hobby function | 10s | 1 vCPU | Dead on arrival for clustering |
| Vercel Pro, default | 15s | 1 vCPU | Still too short |
| Vercel Pro + `maxDuration` | 300s (5 min) | 1 vCPU | Possible for persona gen, expensive |
| Vercel Pro + Fluid Compute | 800s (13 min) | Shared | Node/Python only; I/O wait not billed |
| Supabase Edge Function | 150s wall | **2s CPU** | **Unusable for k-means** — hard ceiling |
| Inngest step | Effectively unbounded (hours, days between steps) | Runs *your* code on *your* function, so bounded by where it runs | Durable, retryable, pauseable |

### Recommended pattern per operation

#### 1. K-means clustering (~10-30s, CPU-bound)

**Use: Inngest step function, executed on Vercel Fluid Compute with `maxDuration: 300`.**

```
POST /api/jobs/cluster
  → inngest.send({ name: 'cluster/requested', data: { company_id } })
  → return 202 { job_id }
Client subscribes to Supabase Realtime channel `job:${job_id}`
```

Inngest workflow:
1. `step.run('load-vectors')` — pull all employee vectors for company_id
2. `step.run('kmeans')` — run k-means++ (the CPU work; bounded by Fluid Compute 800s but will finish in ~30s)
3. `step.run('persist-centroids')` — insert into `personas` table
4. `step.run('trigger-persona-gen')` — fan out one event per centroid: `persona/generate`
5. Each completes → writes status to `jobs` table → Supabase Realtime pushes to client

**Why not Vercel alone:** No retry semantics. If the function crashes at 25s you get a 504 and a half-clustered state. Inngest gives automatic retries per step plus idempotency.

**Why not Supabase Edge Functions:** 2s CPU ceiling. K-means++ with 500 employees × 14 dims × 10 iterations will blow past it.

**Why not QStash:** QStash is a message delivery layer. You'd still need to handle retries, fan-out, and observability yourself. Inngest is QStash + durable workflow engine + dashboard for ~same price tier.

#### 2. Persona generation (~30-60s per persona, Groq I/O wait)

**Use: Inngest, one step per persona, fan-out from clustering.**

Each persona gen is a single Groq call that returns a structured JSON object. It's I/O-bound, so Fluid Compute barely bills CPU. Running N personas in parallel as separate Inngest events gives automatic concurrency control and retries on transient Groq errors (rate limit, 5xx).

```typescript
// inngest/persona-generate.ts
export const generatePersona = inngest.createFunction(
  { id: 'persona-generate', retries: 3, concurrency: { limit: 5, key: 'event.data.company_id' } },
  { event: 'persona/generate' },
  async ({ event, step }) => {
    const prompt = await step.run('compile-prompt', () => compilePromptFromVector(event.data.centroid));
    const persona = await step.run('groq-call', () => groq.chat.completions.create({ ... }));
    await step.run('persist', () => supabase.from('personas').update({ generated_profile: persona }).eq('id', event.data.persona_id));
    await step.run('validate-turing', () => runSelfTuringTest(persona));
  }
);
```

Per-company concurrency limit protects Groq free-tier rate limits.

#### 3. Chat streaming (~1-10s, streamed tokens)

**Use: Next.js route handler with Vercel AI SDK `streamText` + Groq provider. SSE, not WebSocket.**

```typescript
// app/api/chat/route.ts
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
export const maxDuration = 60; // Fluid Compute handles the stream
export async function POST(req: Request) {
  const { messages, personaId } = await req.json();
  // RLS-gated read
  const persona = await getPersonaForUser(personaId);
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: persona.compiled_prompt,
    messages,
    onFinish: async ({ text }) => {
      // fire-and-forget persistence, doesn't block stream
      await saveMessage({ personaId, role: 'assistant', content: text });
    },
  });
  return result.toDataStreamResponse();
}
```

**Why SSE over WebSockets:** Vercel serverless *cannot* hold persistent WebSocket connections — functions spin down after response. SSE over HTTP streams until the function's `maxDuration`, which is what you want for a chat turn. If you ever need bidirectional push (e.g., "user is typing" indicators), layer Supabase Realtime on top for the non-LLM traffic.

**Edge runtime vs Node runtime:** Node runtime with Fluid Compute is now preferred — Edge was the old workaround for streaming because Node serverless functions cut off early. With Fluid Compute, Node holds long-lived connections fine and you keep access to full npm ecosystem (important for `@upstash/redis`, Node-only Groq SDK features, etc.).

#### 4. Training scenario grading (multi-pass LLM, ~20-40s)

**Use: Inngest, multi-step function with N LLM calls as separate steps.**

Same pattern as persona generation. Each grading pass is a `step.run` — Inngest persists the result so if step 3 fails, step 1 and 2 don't re-run. Cuts wasted Groq tokens on retries.

### Vercel `after()` / `waitUntil` — limited use

These are for "finish logging after response" type work, *not* long-running jobs. Critical gotcha: promises passed to `waitUntil` share the parent function's timeout. If the parent is 60s, `waitUntil(heavyWork)` also has 60s. Use it only for:
- Writing analytics/audit log after a route handler returns
- Cache warming
- Trailing DB writes that shouldn't block response

Do not use `waitUntil` to escape the 10s limit on Hobby, or to run clustering. That's what Inngest is for.

---

## Data Flow

### Survey → persona creation (hero path)

```
1. Employee fills VCPQ (28 Qs)
   → POST /api/survey/submit (route handler, <1s)
   → Insert into `survey_responses` (JSONB answers column)
   → Compute 14-d vector, write to `employee_vectors.vector` (pgvector)
   → Return 200

2. Admin clicks "Generate personas"
   → POST /api/jobs/cluster
   → inngest.send('cluster/requested')
   → Return 202 { job_id }
   → Client opens Supabase Realtime channel `jobs:{company_id}`

3. Inngest workflow runs (30-90s total):
   a. Load all employee vectors for company
   b. K-means++ → N centroids
   c. Insert placeholder rows in `personas` (status='pending')
   d. Fan out N 'persona/generate' events
   e. Each generates profile via Groq, updates row (status='ready')
   f. Each step completion → UPDATE jobs SET progress=...
   g. Realtime pushes status to admin UI

4. Admin sees "3/5 personas ready" live, then "complete"
```

### Employee-to-persona match (hero feature)

```
1. Manager opens employee profile
   → GET /app/employees/[id] (server component)
   → Fetch employee vector + all persona centroids for company
   → Call Postgres RPC `match_employee_to_personas(employee_id, company_id)`
   → Returns ranked list with cosine similarity scores
   → Render match card with top result + trait delta

2. Manager clicks "Chat with this persona"
   → Navigate to /app/chat/[personaId]
   → Chat streams via route handler (see #3 above)
```

### Chat turn

```
Client → POST /api/chat { messages, personaId }
       ← 200 SSE stream
Server route handler:
  - RLS-gated load of persona compiled_prompt
  - streamText(groq, ...) → ReadableStream
  - onFinish callback persists assistant message (non-blocking)
Client incrementally renders tokens; writes user message to DB on send
```

---

## Supabase RLS Patterns

### Tenant isolation model

Every user-facing table needs:
```sql
company_id uuid NOT NULL REFERENCES companies(id),
```
indexed (non-negotiable — RLS without an index on the filtered column can make queries 1000× slower).

### JWT-claim-based policies (preferred)

Put `company_id` and `role` in the JWT via a Better Auth → Supabase session bridge (or Supabase's `custom_access_token_hook` if using Supabase Auth). Then policies read from `auth.jwt()` instead of joining:

```sql
-- Fast: no join, index-friendly
CREATE POLICY "tenant_read" ON personas
FOR SELECT USING (
  company_id = (auth.jwt() ->> 'company_id')::uuid
);

CREATE POLICY "tenant_write" ON personas
FOR INSERT WITH CHECK (
  company_id = (auth.jwt() ->> 'company_id')::uuid
  AND (auth.jwt() ->> 'role') IN ('company_admin', 'super_admin')
);
```

Without JWT claims, the alternative is a user_companies lookup on every query — slower and the join disables index-only scans on the parent table. Benchmark: teams have reported 3-minute → 2ms swings based purely on this choice.

### Policy gotchas

1. **INSERT and SELECT are separate.** A SELECT-only policy silently rejects writes with no error. Every writable table needs both. (See BP-003.)
2. **Use `(SELECT auth.jwt())` inside policy for caching.** Postgres evaluates `auth.jwt()` per-row by default; wrapping in a SELECT makes it an InitPlan, evaluated once per query.
3. **Service-role client for cross-tenant admin work.** RLS doesn't apply to service-role. Use `createServiceSupabase()` inside Inngest workflows (clustering reads vectors across sessions) and route handlers that legitimately cross tenants (super_admin analytics). Never expose service-role key to client. (See BP-018.)
4. **Policies on views need `SECURITY INVOKER`** (Postgres 15+) so the querying user's policies apply, not the view owner's.
5. **JSONB column policies** work fine; you can filter on JSONB paths inside a policy, e.g., `USING (metadata->>'department' = auth.jwt()->>'department')`. Index with GIN or expression index if you do.

### Existing-code migration checklist

Your Express code currently does app-level `WHERE company_id = ?` filtering. Moving to RLS:
- [ ] Add RLS policies for every table (SELECT + INSERT + UPDATE + DELETE)
- [ ] Add `company_id` index on every table (`CREATE INDEX CONCURRENTLY ...`)
- [ ] Stop trusting client-supplied `company_id` in any write — the policy WITH CHECK enforces it
- [ ] Keep app-level filter as defense-in-depth *and* because `explain analyze` is cleaner when both layers agree
- [ ] Write RLS regression tests: spin up two companies, verify user from company A cannot SELECT/INSERT/UPDATE/DELETE company B rows

---

## JSONB Query Patterns

Your existing schema uses JSONB for survey answers and demographics. Keep it — JSONB in Postgres is excellent.

### Indexes

```sql
-- For field lookups: answers->>'q1'
CREATE INDEX survey_answers_gin ON survey_responses USING GIN (answers);

-- For high-cardinality specific key (e.g., department)
CREATE INDEX employees_department ON employees ((demographics->>'department'));
```

### Similarity search on JSONB

JSONB is for structured lookup and aggregation, **not** similarity. Don't try to compute cosine similarity on JSONB personality vectors stored as `{"v1": 0.3, "v2": -0.5, ...}`. Convert to `vector(14)` in pgvector (see next section). Keep JSONB for the raw survey answers only.

---

## pgvector for Similarity

### Schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Raw employee data — personality vector as pgvector column
ALTER TABLE employees ADD COLUMN vector vector(14);

-- Persona centroids
ALTER TABLE personas ADD COLUMN centroid vector(14);
```

### Index choice for 14 dimensions + small-to-medium cardinality

With 14-dim vectors and ~500-2000 rows per company, **HNSW is the right choice**:

```sql
CREATE INDEX personas_centroid_hnsw ON personas
  USING hnsw (centroid vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX employees_vector_hnsw ON employees
  USING hnsw (vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Why HNSW over IVFFlat here:**
- Data is low-dim — both indexes work, but HNSW has better recall and doesn't require a pre-built list size tuned to row count
- IVFFlat requires rebuild when dataset grows past the `lists` hint; personas/employees churn frequently
- Memory cost of HNSW is negligible at this scale (14 dims × 2000 rows × 4 bytes × graph overhead ≈ hundreds of KB)

### Match RPC

PostgREST does not expose pgvector operators directly, so wrap in an RPC:

```sql
CREATE OR REPLACE FUNCTION match_employee_to_personas(
  p_employee_id uuid,
  p_company_id uuid,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  persona_id uuid,
  name text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER  -- runs as function owner, but we'll verify company_id
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    1 - (p.centroid <=> e.vector) AS similarity  -- cosine similarity, NOT distance
  FROM personas p
  CROSS JOIN (SELECT vector FROM employees WHERE id = p_employee_id AND company_id = p_company_id) e
  WHERE p.company_id = p_company_id
  ORDER BY p.centroid <=> e.vector  -- ascending distance = most similar first
  LIMIT p_limit;
$$;

-- Expose to authenticated role; RLS is NOT auto-applied inside SECURITY DEFINER, so we enforce
-- company_id manually above
REVOKE ALL ON FUNCTION match_employee_to_personas FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_employee_to_personas TO authenticated;
```

**Critical:** The `<=>` operator returns cosine **distance** (0 = identical, 2 = opposite). Similarity = `1 - distance`. Mis-reading this is the #1 pgvector bug in the wild.

### Application-layer vs database-layer matching

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| Compute similarity in JS (pull all centroids, loop) | Simple, no DB extension | N+1 on employee matching dashboards; no index; moves data over the wire | Don't |
| Postgres RPC with pgvector | Single round trip; indexed; pushes compute to DB | Requires RPC wrapper | **Do this** |

At 14 dims and ~50 personas per company it might not matter for correctness, but the RPC pattern is free insurance for when company_admin dashboards batch-match 500 employees at once.

### K-means clustering itself

K-means is **not** run inside Postgres. It's run in Inngest (Node) — you pull all employee vectors via a single RLS-gated query, run k-means++ in JS (use `ml-kmeans` or your existing implementation), write centroids back. Pgvector is for *querying* centroids, not *producing* them.

---

## Authentication Middleware Placement

### The three layers (use all of them)

| Layer | File | Job | Runs on |
|-------|------|-----|---------|
| 1. Session refresh | `middleware.ts` | Refresh Supabase/Better Auth cookies on every request; redirect unauthenticated requests to `/login` | Every request (edge) |
| 2. Session hydration | `app/(app)/layout.tsx` | Load user + company context once per request, cached with React `cache()` | RSC render |
| 3. Authorization | Route handlers + server components | Verify `role`, `company_id` match; re-fetch user with `auth.getUser()` not `getSession()` | Per route |

**Do not put business-logic authorization in middleware.** Middleware runs on every request including static assets — keep it cheap. Just refresh the session and do a coarse "is this user logged in for /app/\* routes" gate.

**Do not trust layout.tsx alone for auth.** A deeply nested server component can skip layouts under certain conditions (parallel routes, intercepted routes). Always re-verify inside route handlers and server actions that write data.

### Pattern

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(/* ... with cookie get/set bound to req/res */);
  // This call refreshes the session if expired and writes the new cookie
  const { data: { user } } = await supabase.auth.getUser();

  if (req.nextUrl.pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
```

```typescript
// app/(app)/layout.tsx
import { cache } from 'react';
import { getUserWithCompany } from '@/lib/auth';
const getCurrentUser = cache(getUserWithCompany);  // dedupes per request
export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');  // belt-and-suspenders vs middleware
  return <UserProvider user={user}>{children}</UserProvider>;
}
```

```typescript
// app/api/personas/route.ts — route handler always re-auths
export async function POST(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const role = user.app_metadata.role;
  if (!['company_admin', 'super_admin'].includes(role)) {
    return new Response('Forbidden', { status: 403 });
  }
  // ... RLS handles data isolation from here
}
```

**`getUser()` not `getSession()`** — getSession reads from the cookie (spoofable). getUser validates with the Supabase auth server (trustworthy).

---

## Patterns to Follow

### Pattern: Server component fetches, route handler mutates

Server components for reads (SSR, RLS-enforced, no bundle cost). Route handlers for writes and streaming. Server Actions are tempting but debugging them is painful (opaque POST to same URL, hard to curl-test). Prefer explicit route handlers for now.

### Pattern: Inngest for anything >10s

If a workflow exceeds 10s or has more than one externally-dependent step, it's an Inngest function. Benefits: retries, step memoization, parallelism, observability UI for free.

### Pattern: Realtime for job status, not business data

Supabase Realtime is great for "the persona your admin triggered is now ready." It's *bad* as a primary data source — latency and delivery guarantees are weaker than a REST read. Push status events, re-fetch data via normal queries.

### Pattern: Service-role client is scoped per workflow

One function: `createServiceSupabase()`. Used only inside Inngest functions and admin-only routes. Service-role key is in Vercel env + Inngest env, never in client bundles.

---

## Anti-Patterns to Avoid

### Anti-pattern: Running clustering in a route handler

Why bad: at N>200 employees it exceeds Hobby limit; even on Pro it's flaky (cold start + k-means convergence variance → occasional 504s). Retries become your job.
Instead: Inngest event + 202 response + Realtime status channel.

### Anti-pattern: WebSockets for chat on Vercel

Why bad: Vercel serverless functions terminate after response. Any WebSocket server needs persistent runtime → separate host (Render, Fly, a Socket.IO server). Adds ops you explicitly don't want (solo builder, no DevOps).
Instead: SSE via `streamText().toDataStreamResponse()`. Use Supabase Realtime for bidirectional non-LLM traffic (presence, typing indicators) if needed.

### Anti-pattern: Clustering inside Supabase Edge Functions

Why bad: 2-second CPU hard cap. Your existing k-means will hit it.
Instead: Inngest-on-Vercel, or if you need Deno, wrap a Cloud Run service — but that adds infra, so don't.

### Anti-pattern: Computing cosine in JS after pulling all centroids

Why bad: No index usage, N+1 in batch-match flows, wire cost, can't filter by similarity threshold at DB level.
Instead: pgvector `<=>` operator inside an RPC.

### Anti-pattern: Putting business authorization in middleware

Why bad: Middleware runs on every asset request. Role checks inside it mean a DB roundtrip per static image. Spooky remote-authz bugs.
Instead: Middleware = session refresh + coarse "logged-in or not" gate. Authz in route handlers/RSCs.

### Anti-pattern: Storing the 14-d vector as JSONB `{v1:..., v2:...}`

Why bad: Can't use pgvector operators. Client-side math only. Silly given Postgres has the exact extension for this.
Instead: `vector(14)` column, HNSW index, RPC wrapper.

### Anti-pattern: Using `waitUntil`/`after()` to escape function timeout

Why bad: Both share parent timeout. If function is 300s, background work also 300s — and if function returns early and the platform scales down, your promise *may* be killed.
Instead: Enqueue Inngest event, return immediately. The event lives in durable storage.

### Anti-pattern: Service-role Supabase client on the client side

Why bad: Full DB access, RLS bypass. This is how tenancy breaches happen.
Instead: Only in server runtime (route handlers, Inngest, server components doing cross-tenant work). Key only in server envs.

---

## Scalability Considerations

| Concern | At 10 companies | At 100 companies | At 1000 companies |
|---------|-----------------|------------------|-------------------|
| Clustering workload | Inngest free tier (50k runs/mo plenty) | Inngest paid (~$30/mo) | Dedicated queue concurrency per company |
| Postgres connections | Supabase free tier pool (60 conns) | Supabase Pro + pgbouncer transaction mode | Supavisor + read replicas |
| Groq rate limits | Free tier workable | Per-company rate limit via Inngest `concurrency` | Upgrade Groq or add model fallback (OpenAI/Anthropic) |
| RLS performance | Fine with indexes | Start profiling with `EXPLAIN ANALYZE` on top 10 queries | Materialized views for analytics, Row Security audits |
| pgvector index size | Trivial | Few hundred MB | Consider partitioning by company_id if >10M vectors |
| Chat streams (concurrent SSE) | Low | Fluid Compute handles 100s concurrent per instance | Multi-region Vercel, Groq in same region |

Most MVP concerns evaporate until 50+ companies. Don't optimize early — but pick the right primitives now so you're not rewriting later.

---

## Build Order

This is ordered by dependency and risk-reduction. Each bullet is a roadmap-phase candidate.

### Phase A — Foundation (no LLM yet, no personas)
1. Next.js 15 scaffold + Better Auth + Google OAuth + Supabase session bridge
2. `middleware.ts` session refresh + `/app` gate
3. Core schema: companies, users, employees, survey_responses (JSONB), RLS policies, company_id indexes
4. JWT claim hook (inject `company_id`, `role` into JWT)
5. RLS regression test suite (two-company isolation)

### Phase B — Survey + Vectors
1. VCPQ survey UI (28 Qs, 4 modules)
2. `POST /api/survey/submit` route handler
3. Vector computation (14-d pipeline — port from Express as-is)
4. pgvector extension + `vector(14)` column + HNSW indexes

### Phase C — Background Jobs Foundation
1. Inngest project setup, Vercel integration, local dev with `inngest dev`
2. `jobs` table + Supabase Realtime channel for status
3. Simple test workflow (send event → step.run → update row → see status in UI)

### Phase D — Clustering + Persona Generation
1. Inngest function: `cluster/requested` → k-means → persist centroids → fan-out
2. Inngest function: `persona/generate` → Groq call → persist profile
3. Admin UI: trigger clustering, watch Realtime status, view personas
4. Per-company Groq concurrency limit

### Phase E — Chat
1. `app/api/chat/route.ts` with Vercel AI SDK + Groq streamText
2. Chat UI with incremental rendering
3. Message persistence (user on send, assistant via `onFinish`)
4. Persona compiled_prompt loaded RLS-gated

### Phase F — Hero Feature: Employee-to-Persona Match
1. `match_employee_to_personas` RPC
2. Match card UI with similarity + trait delta
3. "Chat with this persona" deep link
4. Demo script wiring

### Phase G — Training Scenarios
1. Scenario schema (5 archetypes × 3 difficulties)
2. Inngest grading function (multi-pass LLM)
3. Training history persistence (fix existing stub)
4. Grading UI

### Phase H — Admin / Polish
1. Analytics dashboard (RLS-aware queries)
2. Audit logging review
3. CSRF on state-changing routes
4. Stripe (later)

**Why this order:** Foundation → data → jobs plumbing → workloads that use jobs → features that use workloads. Each phase is demo-able and each depends only on prior phases. Skipping Phase C to "just run clustering in a route handler" is the shortcut that costs you a week in Phase D.

---

## Confidence Notes

- Vercel Fluid Compute limits (800s / 5-13 min HTTP): verified from Vercel docs and changelog. **HIGH**
- Supabase Edge Function 2s CPU limit: verified from Supabase troubleshooting docs. **HIGH**
- pgvector `<=>` is cosine distance not similarity: confirmed in Supabase issue #12244. **HIGH**
- Vercel cannot host persistent WebSockets: confirmed in Vercel KB. **HIGH**
- Inngest pricing (50K free, $30/500K): per Inngest pricing page. **HIGH**
- JWT-claim RLS performance win: multiple 2026 sources report 10-1000× speedup; unverified on this specific schema but pattern well-established. **MEDIUM-HIGH**
- HNSW over IVFFlat for 14-dim: low-dim performance equivalent on both; HNSW win is operational (no rebuild on growth). **MEDIUM**
- Vercel AI SDK `streamText` + Groq: verified via Groq docs and AI SDK docs. **HIGH**

## Sources

- [Vercel function duration limits](https://vercel.com/docs/functions/configuring-functions/duration)
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute)
- [Vercel Serverless 5-min update](https://vercel.com/changelog/serverless-functions-can-now-run-up-to-5-minutes)
- [Supabase Edge Function CPU limits](https://supabase.com/docs/guides/troubleshooting/edge-function-cpu-limits)
- [Supabase pgvector guide](https://supabase.com/docs/guides/database/extensions/pgvector)
- [pgvector `<=>` is cosine distance, not similarity (issue #12244)](https://github.com/supabase/supabase/issues/12244)
- [Supabase RLS best practices (Makerkit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Streaming guide](https://nextjs.org/docs/app/guides/streaming)
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js 15 `after()`](https://nextjs.org/docs/app/api-reference/functions/after)
- [Vercel AI SDK — Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Vercel AI SDK + Groq](https://console.groq.com/docs/ai-sdk/)
- [Vercel KB — WebSockets not supported](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- [SSE streaming LLM responses (Upstash blog)](https://upstash.com/blog/sse-streaming-llm-responses)
- [Inngest — long-running on Vercel](https://www.inngest.com/blog/vercel-long-running-background-functions)
- [Inngest pricing](https://www.inngest.com/pricing)
- [Supabase Cron + pgmq + Edge Functions](https://supabase.com/blog/processing-large-jobs-with-edge-functions)
- [HNSW vs IVFFlat comparison (Tembo)](https://www.tembo.io/blog/vector-indexes-in-pgvector)
- [Supabase HNSW indexes](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes)
