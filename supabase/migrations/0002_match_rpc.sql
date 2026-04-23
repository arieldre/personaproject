-- =============================================================================
-- Phase 7: Employee-to-Persona Match RPC
-- =============================================================================
-- SECURITY DEFINER: bypasses RLS to read across user/questionnaire boundary.
-- Tenant isolation enforced explicitly via p_company_id guard (two checks).
-- set search_path = public prevents search_path injection attacks.

create or replace function match_employee_to_personas(
  p_response_id uuid,
  p_company_id uuid,
  p_limit int default 5
)
returns table (
  persona_id uuid,
  persona_name text,
  persona_tagline text,
  similarity float8,
  persona_vector float4[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vector vector(14);
  v_qid uuid;
begin
  -- Fetch the completed response vector + its parent questionnaire id
  select r.personality_vector, r.questionnaire_id
  into v_vector, v_qid
  from questionnaire_responses r
  where r.id = p_response_id
    and r.status = 'completed';

  if v_vector is null then
    raise exception 'response_not_found';
  end if;

  -- Cross-tenant guard: questionnaire must belong to the caller's company
  if not exists (
    select 1 from questionnaires q
    where q.id = v_qid
      and q.company_id = p_company_id
  ) then
    raise exception 'access_denied';
  end if;

  return query
  select
    p.id             as persona_id,
    p.name::text     as persona_name,
    p.tagline::text  as persona_tagline,
    -- <=> returns cosine DISTANCE; similarity = 1 - distance
    (1 - (p.personality_vector <=> v_vector))::float8 as similarity,
    -- float4[] cast is pgvector-documented; JS receives it as number[]
    p.personality_vector::float4[] as persona_vector
  from personas p
  where p.company_id = p_company_id
    and p.status = 'active'
    and p.personality_vector is not null
  order by p.personality_vector <=> v_vector
  limit p_limit;
end;
$$;

-- Grant to both roles Supabase uses
grant execute on function match_employee_to_personas(uuid, uuid, int)
  to authenticated, service_role;
