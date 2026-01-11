-- Migration: VCPQ (Vectorizable Corporate Persona Questionnaire) System
-- Date: 2026-01-11
-- Description: Adds personality vectors, domain context, and new VCPQ questionnaire template

-- =====================================================
-- 1. ADD VECTOR COLUMNS TO PERSONAS TABLE
-- =====================================================

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS personality_vectors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS domain_context VARCHAR(100) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS raw_survey_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vector_version VARCHAR(20) DEFAULT 'vcpq-v1';

-- Add index for vector queries
CREATE INDEX IF NOT EXISTS idx_personas_domain_context ON personas(domain_context);
CREATE INDEX IF NOT EXISTS idx_personas_personality_vectors ON personas USING GIN(personality_vectors);

-- =====================================================
-- 2. CREATE VCPQ QUESTIONNAIRE TEMPLATE
-- =====================================================

-- First, mark old templates as non-default
UPDATE questionnaire_templates SET is_default = false WHERE is_default = true;

-- Insert the new VCPQ template
INSERT INTO questionnaire_templates (id, name, description, is_default, questions) VALUES
(uuid_generate_v4(), 'VCPQ - Vectorizable Corporate Persona Questionnaire', 
'28-item scientifically-designed instrument for deterministic persona generation using personality vectors', 
true, 
'[
    {
        "id": "A1",
        "module": "cognition",
        "question": "This person actively seeks out unproven, novel technologies.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "innovation"
    },
    {
        "id": "A2",
        "module": "cognition",
        "question": "This person prefers established workflows and legacy protocols.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "innovation"
    },
    {
        "id": "A3",
        "module": "cognition",
        "question": "This person double-checks every figure and insists on perfection.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "diligence"
    },
    {
        "id": "A4",
        "module": "cognition",
        "question": "This person prioritizes speed over absolute accuracy.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "diligence"
    },
    {
        "id": "A5",
        "module": "cognition",
        "question": "This person is energized by group brainstorming and meetings.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "social_energy"
    },
    {
        "id": "A6",
        "module": "cognition",
        "question": "This person prefers solitary, focused work.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "social_energy"
    },
    {
        "id": "A7",
        "module": "cognition",
        "question": "This person prioritizes team harmony over being ''right''.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "agreeableness"
    },
    {
        "id": "A8",
        "module": "cognition",
        "question": "This person challenges colleagues aggressively to ensure excellence.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "agreeableness"
    },
    {
        "id": "B1",
        "module": "communication",
        "question": "When providing feedback, this person is blunt and imperative.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "directness"
    },
    {
        "id": "B2",
        "module": "communication",
        "question": "Feedback is often ''sandwiched'' with praise to soften the blow.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "directness"
    },
    {
        "id": "B3",
        "module": "communication",
        "question": "This person communicates via long, narrative-style emails.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "verbosity"
    },
    {
        "id": "B4",
        "module": "communication",
        "question": "This person uses telegraphic bullet points and fragments.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "verbosity"
    },
    {
        "id": "B5",
        "module": "communication",
        "question": "This person avoids contractions and uses strictly formal address.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "formality"
    },
    {
        "id": "B6",
        "module": "communication",
        "question": "This person uses slang and a casual, active voice.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "formality"
    },
    {
        "id": "B7",
        "module": "communication",
        "question": "Communication is saturated with industry-specific buzzwords.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "jargon_density"
    },
    {
        "id": "B8",
        "module": "communication",
        "question": "Complex concepts are explained in plain, accessible English.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "jargon_density"
    },
    {
        "id": "C1",
        "module": "hierarchy",
        "question": "This person complies immediately with superior directives.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "deference"
    },
    {
        "id": "C2",
        "module": "hierarchy",
        "question": "This person pushes back publicly if a plan is flawed.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "deference"
    },
    {
        "id": "C3",
        "module": "hierarchy",
        "question": "This person requires step-by-step supervision.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "autonomy"
    },
    {
        "id": "C4",
        "module": "hierarchy",
        "question": "This person works independently, reporting only results.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "autonomy"
    },
    {
        "id": "C5",
        "module": "hierarchy",
        "question": "This person frequently uses flattery to gain influence.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "sycophancy"
    },
    {
        "id": "C6",
        "module": "hierarchy",
        "question": "This person is openly skeptical of their leadership''s motives.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "sycophancy"
    },
    {
        "id": "D1",
        "module": "operational",
        "question": "In disagreements, this person tries to win at all costs.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "conflict_mode"
    },
    {
        "id": "D2",
        "module": "operational",
        "question": "In disagreements, this person yields to keep the peace.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "conflict_mode"
    },
    {
        "id": "D3",
        "module": "operational",
        "question": "Decisions are driven by data and spreadsheet analysis.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "decision_basis"
    },
    {
        "id": "D4",
        "module": "operational",
        "question": "Decisions are driven by gut feeling and intuition.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "decision_basis"
    },
    {
        "id": "D5",
        "module": "operational",
        "question": "This person remains stoic and unflappable during a crisis.",
        "type": "likert_5",
        "reversed": false,
        "required": true,
        "meta_vector": "stress_resilience"
    },
    {
        "id": "D6",
        "module": "operational",
        "question": "This person becomes visibly anxious under heavy pressure.",
        "type": "likert_5",
        "reversed": true,
        "required": true,
        "meta_vector": "stress_resilience"
    }
]'::jsonb);

-- Add domain context field to questionnaires for future responses
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS domain_context VARCHAR(100) DEFAULT 'General';

COMMENT ON COLUMN personas.personality_vectors IS 'VCPQ meta-vectors: innovation, diligence, social_energy, agreeableness, directness, verbosity, formality, jargon_density, deference, autonomy, sycophancy, conflict_mode, decision_basis, stress_resilience';
COMMENT ON COLUMN personas.domain_context IS 'Domain for lexical library: Engineering, Legal, Executive, HR, General';
COMMENT ON COLUMN personas.raw_survey_scores IS 'Raw 28-item VCPQ scores (A1-A8, B1-B8, C1-C6, D1-D6)';
