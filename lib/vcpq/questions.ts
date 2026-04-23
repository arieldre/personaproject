export type QuestionId =
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8'
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8'
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6'
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'

export type Module = 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: QuestionId
  module: Module
  dimension: string
  reversed: boolean
  text: string
}

export const MODULE_LABELS: Record<Module, string> = {
  A: 'Cognition',
  B: 'Communication',
  C: 'Hierarchy',
  D: 'Operational',
}

export const QUESTIONS: Question[] = [
  // ─── Module A: Cognition ────────────────────────────────────────────────────
  { id: 'A1', module: 'A', dimension: 'innovation',    reversed: false, text: 'I actively seek out unproven, novel technologies.' },
  { id: 'A2', module: 'A', dimension: 'innovation',    reversed: true,  text: 'I prefer established workflows and legacy protocols.' },
  { id: 'A3', module: 'A', dimension: 'diligence',     reversed: false, text: 'I double-check every figure and insist on perfection.' },
  { id: 'A4', module: 'A', dimension: 'diligence',     reversed: true,  text: 'I prioritize speed over absolute accuracy.' },
  { id: 'A5', module: 'A', dimension: 'social_energy', reversed: false, text: 'I am energized by group brainstorming and meetings.' },
  { id: 'A6', module: 'A', dimension: 'social_energy', reversed: true,  text: 'I prefer solitary, focused work.' },
  { id: 'A7', module: 'A', dimension: 'agreeableness', reversed: false, text: 'I prioritize team harmony over being "right".' },
  { id: 'A8', module: 'A', dimension: 'agreeableness', reversed: true,  text: 'I challenge colleagues aggressively to ensure excellence.' },

  // ─── Module B: Communication ────────────────────────────────────────────────
  { id: 'B1', module: 'B', dimension: 'directness',    reversed: false, text: 'When providing feedback, I am blunt and direct.' },
  { id: 'B2', module: 'B', dimension: 'directness',    reversed: true,  text: 'I often sandwich feedback with praise to soften the blow.' },
  { id: 'B3', module: 'B', dimension: 'verbosity',     reversed: false, text: 'I communicate via long, narrative-style emails.' },
  { id: 'B4', module: 'B', dimension: 'verbosity',     reversed: true,  text: 'I use telegraphic bullet points and fragments.' },
  { id: 'B5', module: 'B', dimension: 'formality',     reversed: false, text: 'I avoid contractions and use strictly formal address.' },
  { id: 'B6', module: 'B', dimension: 'formality',     reversed: true,  text: 'I use slang and a casual, active voice.' },
  { id: 'B7', module: 'B', dimension: 'jargon_density', reversed: false, text: 'My communication is saturated with industry-specific buzzwords.' },
  { id: 'B8', module: 'B', dimension: 'jargon_density', reversed: true,  text: 'I explain complex concepts in plain, accessible English.' },

  // ─── Module C: Hierarchy ────────────────────────────────────────────────────
  { id: 'C1', module: 'C', dimension: 'deference',     reversed: false, text: 'I comply immediately with superior directives.' },
  { id: 'C2', module: 'C', dimension: 'deference',     reversed: true,  text: 'I push back publicly if a plan is flawed.' },
  { id: 'C3', module: 'C', dimension: 'autonomy',      reversed: true,  text: 'I require step-by-step supervision.' },
  { id: 'C4', module: 'C', dimension: 'autonomy',      reversed: false, text: 'I work independently, reporting only results.' },
  { id: 'C5', module: 'C', dimension: 'sycophancy',    reversed: false, text: 'I frequently use flattery to gain influence.' },
  { id: 'C6', module: 'C', dimension: 'sycophancy',    reversed: true,  text: 'I am openly skeptical of leadership\'s motives.' },

  // ─── Module D: Operational ──────────────────────────────────────────────────
  { id: 'D1', module: 'D', dimension: 'conflict_mode',     reversed: false, text: 'In disagreements, I try to win at all costs.' },
  { id: 'D2', module: 'D', dimension: 'conflict_mode',     reversed: true,  text: 'In disagreements, I yield to keep the peace.' },
  { id: 'D3', module: 'D', dimension: 'decision_basis',    reversed: false, text: 'My decisions are driven by data and spreadsheet analysis.' },
  { id: 'D4', module: 'D', dimension: 'decision_basis',    reversed: true,  text: 'My decisions are driven by gut feeling and intuition.' },
  { id: 'D5', module: 'D', dimension: 'stress_resilience', reversed: false, text: 'I remain stoic and unflappable during a crisis.' },
  { id: 'D6', module: 'D', dimension: 'stress_resilience', reversed: true,  text: 'I become visibly anxious under heavy pressure.' },
]

export interface DemographicOption { value: string; label: string }
export interface DemographicQuestion { id: string; label: string; options: DemographicOption[] }

export const DEMOGRAPHIC_QUESTIONS: DemographicQuestion[] = [
  {
    id: 'age',
    label: 'Age range',
    options: [
      { value: '18-25', label: '18–25' },
      { value: '26-35', label: '26–35' },
      { value: '36-45', label: '36–45' },
      { value: '46-55', label: '46–55' },
      { value: '55+',   label: '55+' },
    ],
  },
  {
    id: 'relationship',
    label: 'Relationship status',
    options: [
      { value: 'single',       label: 'Single' },
      { value: 'relationship', label: 'In a relationship' },
      { value: 'married',      label: 'Married' },
      { value: 'divorced',     label: 'Divorced / Separated' },
    ],
  },
  {
    id: 'children',
    label: 'Children',
    options: [
      { value: 'none', label: 'None' },
      { value: '1',    label: '1' },
      { value: '2',    label: '2' },
      { value: '3+',   label: '3 or more' },
    ],
  },
  {
    id: 'tenure',
    label: 'Years at this company',
    options: [
      { value: '<1',   label: 'Less than 1 year' },
      { value: '1-3',  label: '1–3 years' },
      { value: '3-7',  label: '3–7 years' },
      { value: '7-15', label: '7–15 years' },
      { value: '15+',  label: '15+ years' },
    ],
  },
  {
    id: 'work_style',
    label: 'Work arrangement',
    options: [
      { value: 'remote', label: 'Fully remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'office', label: 'Fully in-office' },
    ],
  },
  {
    id: 'level',
    label: 'Seniority level',
    options: [
      { value: 'ic',         label: 'Individual contributor' },
      { value: 'lead',       label: 'Team lead' },
      { value: 'manager',    label: 'Manager' },
      { value: 'senior_mgr', label: 'Senior manager / Director' },
      { value: 'exec',       label: 'Executive' },
    ],
  },
]

export const QUESTIONS_BY_MODULE = QUESTIONS.reduce<Record<Module, Question[]>>(
  (acc, q) => { acc[q.module].push(q); return acc },
  { A: [], B: [], C: [], D: [] }
)

export const LIKERT_LABELS: Record<number, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
}
