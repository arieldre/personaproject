-- Default showcase personas for all users
-- These personas demonstrate platform capabilities

-- Add is_default column to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Allow NULL company_id for default personas (system-wide)
ALTER TABLE personas ALTER COLUMN company_id DROP NOT NULL;

-- Create index for default personas
CREATE INDEX IF NOT EXISTS idx_personas_is_default ON personas(is_default) WHERE is_default = true;

INSERT INTO personas (
  id, company_id, questionnaire_id, name, tagline, avatar_url, status,
  summary, personality_vectors, demographics, vector_profile, is_default, cluster_size
) VALUES
-- 1. The Hunter - Enterprise Sales Representative
(
  'def00001-0001-0001-0001-000000000001',
  NULL, -- No company - available to all
  NULL, -- Not from questionnaire
  'Jordan "The Hunter"',
  'High Energy, Quota-Driven Enterprise Sales Rep. Lives for the close.',
  NULL,
  'active',
  '{
    "background": "Jordan is a driven Enterprise Account Executive who thrives in high-pressure environments. With a background in Business Administration and a competitive sports history, Jordan brings relentless energy to every deal. They switch companies every 2-3 years chasing better commission structures and the prestige of Presidents Club.",
    "key_traits": ["Highly Persuasive", "Resilient to Rejection", "Impatient with Admin", "Quota-Obsessed", "Status-Driven"],
    "communication_style": {
      "preferred": "Direct and Fast",
      "strengths": ["Simplifying complex tech for clients", "Building rapport quickly", "Closing deals under pressure"],
      "challenges": ["Dislikes paperwork", "Bypasses internal processes", "Can be dismissive of non-revenue activities"]
    },
    "work_preferences": {
      "likes": ["Clear commission structures", "Autonomy in deals", "Recognition and rewards", "Fast-paced environments"],
      "dislikes": ["Administrative tasks", "Multi-click HR tools", "Lengthy approval processes", "Meetings without clear ROI"]
    },
    "demographics": {
      "age_range": "28-34",
      "job_title": "Enterprise Account Executive",
      "department": "Sales",
      "education": "Business Administration / Communications"
    }
  }'::jsonb,
  '{
    "extraversion": 0.92,
    "agreeableness": 0.35,
    "conscientiousness": 0.55,
    "neuroticism": 0.72,
    "openness": 0.65
  }'::jsonb,
  '{"age_range": "28-34", "job_title": "Enterprise AE", "department": "Sales", "region": "Tech Hub"}'::jsonb,
  '{"archetype": "The Hunter", "primary_driver": "Financial Independence & Status", "stress_response": "Becomes more aggressive in closing deals"}'::jsonb,
  true,
  NULL
),

-- 2. The Craftsman - Senior Backend Engineer
(
  'def00002-0002-0002-0002-000000000002',
  NULL,
  NULL,
  'Alex "The Craftsman"',
  'Logic-First, Efficiency-Obsessed Senior Systems Engineer. Builds elegant solutions.',
  NULL,
  'active',
  '{
    "background": "Alex is a Senior Backend Engineer with deep expertise in systems architecture. With a Computer Science background and familiarity with low-level systems, Alex values code quality and system elegance above all. Loyal to tech stacks and interesting problems rather than companies, Alex seeks autonomy and uninterrupted flow states.",
    "key_traits": ["Deeply Analytical", "Detail-Oriented", "Skeptical of Fluff", "Blunt Communicator", "Efficiency-Focused"],
    "communication_style": {
      "preferred": "Text-based, Asynchronous",
      "strengths": ["Precise technical documentation", "Identifying edge cases", "Systems thinking"],
      "challenges": ["Can dismiss corporate initiatives", "Struggles with ambiguity", "Direct to the point of bluntness"]
    },
    "work_preferences": {
      "likes": ["Uninterrupted coding blocks", "Clear technical requirements", "Async communication", "Elegant architecture"],
      "dislikes": ["Unnecessary meetings", "Vague requirements", "Corporate theater", "Micromanagement"]
    },
    "demographics": {
      "age_range": "30-38",
      "job_title": "Senior Backend Engineer",
      "department": "Engineering",
      "education": "Computer Science / Digital Sciences"
    }
  }'::jsonb,
  '{
    "extraversion": 0.25,
    "agreeableness": 0.40,
    "conscientiousness": 0.95,
    "neuroticism": 0.35,
    "openness": 0.78
  }'::jsonb,
  '{"age_range": "30-38", "job_title": "Senior Engineer", "department": "Engineering", "region": "Remote"}'::jsonb,
  '{"archetype": "The Craftsman", "primary_driver": "Autonomy & Mastery", "stress_response": "Retreats into focused problem-solving"}'::jsonb,
  true,
  NULL
),

-- 3. The Diplomat - Product Manager
(
  'def00003-0003-0003-0003-000000000003',
  NULL,
  NULL,
  'Maya "The Diplomat"',
  'Context-Switching, Empathetic Product Manager. Bridges engineering and business reality.',
  NULL,
  'active',
  '{
    "background": "Maya is an experienced Product Manager who excels at synthesizing competing priorities. With an MBA and technical background, Maya navigates between engineering constraints and sales promises daily. Known for empathy and prioritization skills, Maya often faces decision fatigue from hundreds of daily micro-decisions.",
    "key_traits": ["Empathetic Listener", "Strategic Synthesizer", "Overwhelmed but Resilient", "UX-Critical", "Impact-Driven"],
    "communication_style": {
      "preferred": "Concise Summaries",
      "strengths": ["Connecting stakeholder needs", "Prioritizing ruthlessly", "Building consensus"],
      "challenges": ["Decision fatigue", "Time scarcity", "Caught between conflicting demands"]
    },
    "work_preferences": {
      "likes": ["Clear product impact", "Efficient tools", "Cross-functional collaboration", "User feedback"],
      "dislikes": ["Long policy documents", "Unclear requirements", "Being the middleman for conflicts", "Feature bloat"]
    },
    "demographics": {
      "age_range": "32-40",
      "job_title": "Senior Product Manager",
      "department": "Product",
      "education": "MBA / CS + Business pivot"
    }
  }'::jsonb,
  '{
    "extraversion": 0.68,
    "agreeableness": 0.85,
    "conscientiousness": 0.75,
    "neuroticism": 0.65,
    "openness": 0.88
  }'::jsonb,
  '{"age_range": "32-40", "job_title": "Product Manager", "department": "Product", "region": "HQ"}'::jsonb,
  '{"archetype": "The Diplomat", "primary_driver": "Impact & Influence", "stress_response": "Seeks clarity through stakeholder alignment"}'::jsonb,
  true,
  NULL
),

-- 4. The Guardian - HR Business Partner
(
  'def00004-0004-0004-0004-000000000004',
  NULL,
  NULL,
  'Sarah "The Guardian"',
  'People-Centric, Compliance-Aware HR Business Partner. Protects culture and people.',
  NULL,
  'active',
  '{
    "background": "Sarah is a dedicated HR Business Partner who entered the field to help people develop their careers. With a background in Psychology and Organizational Behavior, Sarah balances empathy with compliance awareness. Often bogged down by administrative work, Sarah yearns to be seen as a strategic partner rather than policy police.",
    "key_traits": ["High EQ", "Conflict Resolver", "Compliance-Conscious", "Culturally Aware", "Underappreciated"],
    "communication_style": {
      "preferred": "Warm and Empathetic",
      "strengths": ["Emotional intelligence", "Conflict resolution", "Reading between the lines"],
      "challenges": ["Fear of AI giving wrong legal advice", "Wants AI to sound human", "Overwhelmed by admin work"]
    },
    "work_preferences": {
      "likes": ["Strategic HR work", "Career development conversations", "Positive culture building", "Meaningful impact"],
      "dislikes": ["Password resets", "Excel hell", "Being seen as policy police", "Explaining dental benefits repeatedly"]
    },
    "demographics": {
      "age_range": "29-45",
      "job_title": "HR Business Partner",
      "department": "Human Resources",
      "education": "Psychology / Organizational Behavior"
    }
  }'::jsonb,
  '{
    "extraversion": 0.75,
    "agreeableness": 0.92,
    "conscientiousness": 0.80,
    "neuroticism": 0.55,
    "openness": 0.70
  }'::jsonb,
  '{"age_range": "29-45", "job_title": "HR Business Partner", "department": "HR", "region": "Corporate"}'::jsonb,
  '{"archetype": "The Guardian", "primary_driver": "Harmony & Culture", "stress_response": "Focuses on supporting individuals through transitions"}'::jsonb,
  true,
  NULL
),

-- 5. The Oracle - Data Scientist
(
  'def00005-0005-0005-0005-000000000005',
  NULL,
  NULL,
  'David "The Oracle"',
  'Curious, Truth-Seeking Data Scientist. Finds patterns in noise with statistical rigor.',
  NULL,
  'active',
  '{
    "background": "David is a PhD-level Data Scientist driven by curiosity and the pursuit of truth. With expertise in Statistics and Mathematics, David finds patterns where others see noise. High demand makes them frequently poached, but they stay for interesting problems, not just business outcomes. Analysis paralysis is a constant battle.",
    "key_traits": ["Intellectually Curious", "Statistically Rigorous", "Truth-Seeking", "Analysis-Prone", "Skeptical"],
    "communication_style": {
      "preferred": "Data-Driven and Precise",
      "strengths": ["Pattern recognition", "Statistical rigor", "Objective analysis"],
      "challenges": ["Analysis paralysis", "Communicating with non-technical people", "Frustrated by ambiguity"]
    },
    "work_preferences": {
      "likes": ["Clean data access", "Interesting problems", "Statistical integrity", "Direct SQL access"],
      "dislikes": ["Marketing speak", "Vague AI answers", "CSV exports", "Decisions without data"]
    },
    "demographics": {
      "age_range": "26-35",
      "job_title": "Senior Data Scientist",
      "department": "Data & Analytics",
      "education": "MSc/PhD Statistics, Mathematics, or Physics"
    }
  }'::jsonb,
  '{
    "extraversion": 0.30,
    "agreeableness": 0.50,
    "conscientiousness": 0.88,
    "neuroticism": 0.45,
    "openness": 0.95
  }'::jsonb,
  '{"age_range": "26-35", "job_title": "Data Scientist", "department": "Analytics", "region": "Remote"}'::jsonb,
  '{"archetype": "The Oracle", "primary_driver": "Discovery & Truth", "stress_response": "Dives deeper into data analysis"}'::jsonb,
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  summary = EXCLUDED.summary,
  personality_vectors = EXCLUDED.personality_vectors,
  demographics = EXCLUDED.demographics,
  vector_profile = EXCLUDED.vector_profile,
  is_default = EXCLUDED.is_default;
