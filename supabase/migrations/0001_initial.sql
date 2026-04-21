-- =============================================================================
-- Persona Platform — Initial Schema
-- =============================================================================

-- pgvector for 14-dim VCPQ personality vectors
create extension if not exists vector;

-- =============================================================================
-- Enums
-- =============================================================================

create type user_role as enum ('super_admin', 'company_admin', 'user');
create type subscription_status as enum ('active', 'inactive', 'suspended', 'trial');
create type questionnaire_status as enum ('draft', 'active', 'closed');
create type response_status as enum ('pending', 'in_progress', 'completed');
create type persona_status as enum ('generating', 'active', 'archived');
create type invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type job_status as enum ('queued', 'running', 'complete', 'failed');

-- =============================================================================
-- Better Auth tables
-- Better Auth manages schema for these; we extend `user` with company fields.
-- =============================================================================

create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  email_verified boolean not null default false,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- company membership
  company_id uuid,                     -- FK added after companies table
  role user_role not null default 'user',
  is_active boolean not null default true
);

create table if not exists session (
  id text primary key,
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  user_id text not null references "user"(id) on delete cascade
);

create table if not exists account (
  id text primary key,
  account_id text not null,
  provider_id text not null,
  user_id text not null references "user"(id) on delete cascade,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification (
  id text primary key,
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- Companies
-- =============================================================================

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  slug varchar(100) not null unique,
  logo_url text,
  industry varchar(100),
  company_size varchar(50),
  subscription_status subscription_status default 'trial',
  license_count integer default 5,
  licenses_used integer default 0,
  trial_ends_at timestamptz,
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text references "user"(id) on delete set null
);

-- Back-fill FK on user → companies
alter table "user"
  add constraint user_company_id_fkey
  foreign key (company_id) references companies(id) on delete set null;

-- =============================================================================
-- User Invitations
-- =============================================================================

create table if not exists user_invitations (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  company_id uuid not null references companies(id) on delete cascade,
  invited_by text not null references "user"(id) on delete cascade,
  role user_role default 'user',
  token varchar(255) not null unique,
  status invite_status default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Questionnaire Templates
-- =============================================================================

create table if not exists questionnaire_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  is_default boolean default false,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text references "user"(id)
);

-- =============================================================================
-- Questionnaires
-- =============================================================================

create table if not exists questionnaires (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  template_id uuid references questionnaire_templates(id),
  name varchar(255) not null,
  description text,
  status questionnaire_status default 'draft',
  custom_questions jsonb default '[]',
  access_code varchar(50) unique,
  is_anonymous boolean default false,
  domain_context varchar(100) default 'General',
  starts_at timestamptz,
  ends_at timestamptz,
  total_responses integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text references "user"(id)
);

-- =============================================================================
-- Questionnaire Responses
-- =============================================================================

create table if not exists questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id) on delete cascade,
  respondent_email varchar(255),
  respondent_name varchar(255),
  user_id text references "user"(id) on delete set null,
  status response_status default 'pending',
  answers jsonb not null default '{}',
  -- 14-dim VCPQ personality vector (HNSW index below)
  personality_vector vector(14),
  raw_survey_scores jsonb default '{}',
  demographics jsonb default '{}',
  ip_address inet,
  user_agent text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Personas
-- =============================================================================

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  questionnaire_id uuid references questionnaires(id) on delete set null,
  name varchar(255) not null,
  avatar_url text,
  tagline varchar(500),
  status persona_status default 'generating',
  summary jsonb not null default '{}',
  extended_profile jsonb not null default '{}',
  system_prompt text,
  -- centroid vector for this persona cluster (HNSW index below)
  personality_vector vector(14),
  personality_vectors jsonb default '{}',
  domain_context varchar(100) default 'General',
  raw_survey_scores jsonb default '{}',
  vector_version varchar(20) default 'vcpq-v1',
  cluster_id integer,
  cluster_size integer,
  confidence_score decimal(5,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generated_at timestamptz
);

-- =============================================================================
-- Conversations
-- =============================================================================

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  title varchar(255),
  is_saved boolean default false,
  saved_by text references "user"(id),
  saved_at timestamptz,
  feedback_rating integer,
  feedback_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

-- =============================================================================
-- Messages
-- =============================================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role varchar(20) not null,
  content text not null,
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Training Sessions
-- =============================================================================

create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  scenario_id varchar(100) not null,
  messages jsonb not null,
  grade_result jsonb,
  overall_score integer,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Background Jobs (Inngest run tracking)
-- =============================================================================

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  inngest_run_id text unique,
  type varchar(100) not null,
  status job_status not null default 'queued',
  company_id uuid not null references companies(id) on delete cascade,
  entity_id uuid,
  entity_type varchar(100),
  error text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- =============================================================================
-- Audit Logs
-- =============================================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references "user"(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  action varchar(100) not null,
  entity_type varchar(100),
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- HNSW Indexes for personality vectors
-- ef_construction=128 m=16 are balanced defaults for 14-dim vectors.
-- =============================================================================

create index on questionnaire_responses using hnsw (personality_vector vector_cosine_ops)
  with (m = 16, ef_construction = 128);

create index on personas using hnsw (personality_vector vector_cosine_ops)
  with (m = 16, ef_construction = 128);

-- =============================================================================
-- Standard indexes
-- =============================================================================

create index on questionnaire_responses (questionnaire_id);
create index on questionnaire_responses (user_id);
create index on personas (company_id, status);
create index on conversations (user_id, last_message_at desc);
create index on conversations (persona_id);
create index on messages (conversation_id, created_at);
create index on jobs (company_id, status);
create index on jobs (inngest_run_id);
create index on audit_logs (company_id, created_at desc);
create index on user_invitations (email, status);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table companies                 enable row level security;
alter table "user"                    enable row level security;
alter table session                   enable row level security;
alter table account                   enable row level security;
alter table user_invitations          enable row level security;
alter table questionnaire_templates   enable row level security;
alter table questionnaires            enable row level security;
alter table questionnaire_responses   enable row level security;
alter table personas                  enable row level security;
alter table conversations             enable row level security;
alter table messages                  enable row level security;
alter table training_sessions         enable row level security;
alter table jobs                      enable row level security;
alter table audit_logs                enable row level security;

-- =============================================================================
-- RLS Policies
-- Auth uses Better Auth (not Supabase Auth). Server-side DB access uses the
-- service-role key which bypasses RLS. These policies protect against any
-- future direct-to-Supabase queries using anon/user JWT claims.
--
-- JWT claim shape expected: { company_id: uuid, role: text }
-- Set via Supabase custom JWT claims or custom claim injection middleware.
-- =============================================================================

-- Helper: extract company_id from JWT claim
-- Returns null if claim not present (safe — comparisons with null = false)
create or replace function jwt_company_id() returns uuid
  language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json ->> 'company_id',
    ''
  )::uuid
$$;

create or replace function jwt_role() returns text
  language sql stable
as $$
  select current_setting('request.jwt.claims', true)::json ->> 'role'
$$;

-- companies: user can read their own company; admin can update
create policy "company members can read"
  on companies for select
  using (id = jwt_company_id());

create policy "company admins can update"
  on companies for update
  using (id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));

-- user: users can read their own record
create policy "users can read own record"
  on "user" for select
  using (id = current_setting('request.jwt.claims', true)::json ->> 'sub');

create policy "users can read company members"
  on "user" for select
  using (company_id = jwt_company_id());

-- questionnaires: company-scoped
create policy "company members can read questionnaires"
  on questionnaires for select
  using (company_id = jwt_company_id());

create policy "company admins can insert questionnaires"
  on questionnaires for insert
  with check (company_id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));

create policy "company admins can update questionnaires"
  on questionnaires for update
  using (company_id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));

-- questionnaire_responses: company-scoped via questionnaire join
-- Users can insert their own response; admins can read all
create policy "users can insert own response"
  on questionnaire_responses for insert
  with check (
    exists (
      select 1 from questionnaires q
      where q.id = questionnaire_id
        and q.company_id = jwt_company_id()
    )
  );

create policy "company members can read responses"
  on questionnaire_responses for select
  using (
    exists (
      select 1 from questionnaires q
      where q.id = questionnaire_id
        and q.company_id = jwt_company_id()
    )
  );

-- personas: company-scoped
create policy "company members can read personas"
  on personas for select
  using (company_id = jwt_company_id());

create policy "company admins can insert personas"
  on personas for insert
  with check (company_id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));

create policy "company admins can update personas"
  on personas for update
  using (company_id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));

-- conversations: user can read/write their own
create policy "users can read own conversations"
  on conversations for select
  using (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

create policy "users can insert own conversations"
  on conversations for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- messages: via conversation ownership
create policy "users can read own messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and c.user_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    )
  );

create policy "users can insert own messages"
  on messages for insert
  with check (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and c.user_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    )
  );

-- jobs: company-scoped read (inserts only via service-role / Inngest)
create policy "company members can read jobs"
  on jobs for select
  using (company_id = jwt_company_id());

-- training_sessions: user-scoped
create policy "users can read own training sessions"
  on training_sessions for select
  using (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

create policy "users can insert own training sessions"
  on training_sessions for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- audit_logs: admin read-only
create policy "admins can read audit logs"
  on audit_logs for select
  using (company_id = jwt_company_id() and jwt_role() in ('company_admin', 'super_admin'));
