/**
 * VCPQ Persona Generator
 * 
 * Main integration service for generating personas using the 
 * Vectorizable Corporate Persona Questionnaire system.
 * 
 * This service orchestrates:
 * - Vector normalization
 * - Domain lexicon application
 * - Deterministic prompt compilation
 * - Persona validation
 */

const Groq = require('groq-sdk');
const vectorService = require('./vector.service');
const lexiconService = require('./lexicon.service');
const promptCompiler = require('./promptCompiler.service');
const validateService = require('./validate.service');

// Initialize Groq client
const groqPrimary = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const groqBackup = process.env.GROQ_API_BACKUPKEY
  ? new Groq({ apiKey: process.env.GROQ_API_BACKUPKEY })
  : null;

let useBackupKey = false;

// Wrapper for automatic failover
async function executeWithFailover(apiCall) {
  const primary = useBackupKey ? groqBackup : groqPrimary;
  const fallback = useBackupKey ? groqPrimary : groqBackup;

  try {
    return await apiCall(primary || groqPrimary);
  } catch (error) {
    const isRateLimit = error.status === 429 || error.message?.includes('rate_limit') || error.error?.code === 'rate_limit_exceeded';
    if (isRateLimit && fallback) {
      console.log(`[VCPQ] Rate limit hit, switching to ${useBackupKey ? 'primary' : 'backup'} key...`);
      useBackupKey = !useBackupKey;
      return await apiCall(fallback);
    }
    throw error;
  }
}

// Legacy alias for existing code
const groq = groqPrimary;

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate a persona using VCPQ vector-based system
 * @param {Object} vcpqResponses - Raw VCPQ survey responses (A1-D6, values 1-5)
 * @param {Object} demographics - Demographic info (name, role, department, etc.)
 * @param {string} domain - Domain context (engineering, legal, executive, hr, general)
 * @returns {Object} Generated persona with vectors and compiled prompt
 */
async function generateVCPQPersona(vcpqResponses, demographics = {}, domain = 'general') {
  // Validate responses
  const validation = vectorService.validateResponses(vcpqResponses);
  if (!validation.valid) {
    throw new Error(`Invalid VCPQ responses: ${validation.errors.join(', ')}`);
  }

  // Process vectors
  const vectorResult = vectorService.processVCPQResponses(vcpqResponses);

  // Apply domain modifiers
  const modifiedVectors = lexiconService.applyDomainModifiers(
    vectorResult.meta_vectors,
    domain
  );

  // Compile deterministic prompt
  const compiledPrompt = promptCompiler.compilePrompt(
    modifiedVectors,
    domain,
    demographics
  );

  // Generate persona name if not provided
  if (!demographics.name) {
    demographics.name = await generatePersonaName(domain, modifiedVectors);
  }

  // Generate background narrative (optional enrichment)
  const background = await generateBackground(demographics, modifiedVectors, domain);

  return {
    name: demographics.name,
    demographics: {
      age_range: demographics.age_range || inferAgeRange(demographics.experience_level),
      region: demographics.region || 'Not specified',
      job_title: demographics.job_title || demographics.role || 'Professional',
      department: demographics.department || lexiconService.getLexicon(domain).name,
      experience_level: demographics.experience_level || 'Mid-level'
    },
    domain_context: domain,
    personality_vectors: modifiedVectors,
    raw_survey_scores: vcpqResponses,
    vector_profile: vectorResult.profile,
    system_prompt: compiledPrompt.system_prompt,
    applied_rules: compiledPrompt.applied_rules,
    background,
    vector_version: 'vcpq-v1',
    generated_at: new Date().toISOString()
  };
}

/**
 * Generate a persona name using LLM
 */
async function generatePersonaName(domain, vectors) {
  const lexicon = lexiconService.getLexicon(domain);

  const prompt = `Generate a realistic professional name for a persona with these traits:
- Domain: ${lexicon.name}
- Formality: ${vectors.formality > 0 ? 'Formal' : 'Casual'}
- Regional style: International corporate

Return ONLY the full name (first and last), nothing else.`;

  try {
    const response = await executeWithFailover(async (client) => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.8
    }));

    return response.choices[0]?.message?.content?.trim() || 'Alex Morgan';
  } catch (error) {
    console.error('Error generating name:', error);
    return 'Jordan Smith';
  }
}

/**
 * Generate background narrative for persona
 */
async function generateBackground(demographics, vectors, domain) {
  const lexicon = lexiconService.getLexicon(domain);
  const vectorDescriptions = vectorService.generateProfile(vectors);

  const personalityTraits = Object.values(vectorDescriptions)
    .filter(p => p.intensity !== 'neutral')
    .map(p => p.description)
    .slice(0, 5)
    .join(', ');

  const prompt = `Write a 2-3 sentence professional background for:
Name: ${demographics.name || 'This professional'}
Role: ${demographics.job_title || 'Team member'}
Department: ${lexicon.name}
Key traits: ${personalityTraits}

Keep it factual and professional. Focus on career background, not personality.`;

  try {
    const response = await executeWithFailover(async (client) => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    }));

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating background:', error);
    return '';
  }
}

/**
 * Infer age range from experience level
 */
function inferAgeRange(experienceLevel) {
  const mapping = {
    'Entry-level': '22-28',
    'Junior': '24-30',
    'Mid-level': '28-38',
    'Senior': '35-50',
    'Lead': '35-55',
    'Executive': '40-60',
    'Director': '38-55',
    'VP': '42-58',
    'C-level': '45-65'
  };
  return mapping[experienceLevel] || '30-45';
}

/**
 * Chat with a VCPQ-generated persona
 * @param {string} systemPrompt - Compiled system prompt from persona
 * @param {Array} messageHistory - Array of {role, content} messages
 * @param {string} userMessage - New user message
 * @returns {string} Persona response
 */
async function chatWithVCPQPersona(systemPrompt, messageHistory = [], userMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await executeWithFailover(async (client) => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    }));

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error in persona chat:', error);
    throw error;
  }
}

/**
 * Validate a persona using self-assessment
 * @param {string} systemPrompt - Persona's system prompt
 * @param {Object} inputMetaVectors - Original meta-vectors
 * @returns {Object} Validation result
 */
async function validateVCPQPersona(systemPrompt, inputMetaVectors) {
  const validationPrompt = validateService.buildValidationPrompt();
  const questions = validateService.generateSelfAssessmentQuestions();

  // Build the question list
  const questionText = questions.map(q =>
    `${q.id}: ${q.prompt}`
  ).join('\n');

  const fullPrompt = `${validationPrompt}\n\nQuestions:\n${questionText}`;

  try {
    const response = await executeWithFailover(async (client) => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3 // Lower temperature for consistent scoring
    }));

    const responseText = response.choices[0]?.message?.content || '';
    const parsed = validateService.parseValidationResponse(responseText);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error,
        raw_response: responseText
      };
    }

    const result = validateService.validatePersona(inputMetaVectors, parsed.scores);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('Error in validation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Full pipeline: Create and optionally validate a VCPQ persona
 * @param {Object} options - Configuration options
 * @returns {Object} Complete persona with optional validation
 */
async function createPersonaPipeline(options) {
  const {
    vcpqResponses,
    demographics = {},
    domain = 'general',
    validate = false,
    validationThreshold = 0.8
  } = options;

  // Generate the persona
  const persona = await generateVCPQPersona(vcpqResponses, demographics, domain);

  // Optionally validate
  if (validate) {
    const validationResult = await validateVCPQPersona(
      persona.system_prompt,
      persona.personality_vectors
    );

    persona.validation = validationResult;

    if (!validationResult.valid && validationResult.correlation) {
      persona.validation.recommendations = validateService.generateRecommendations(validationResult);
    }
  }

  return persona;
}

/**
 * Generate detailed persona insights from personality vectors
 * Creates strengths, growth areas, learning style, work preferences, and compatibility
 * 
 * @param {Object} vectors - Personality meta-vectors (-1 to 1 scale)
 * @param {Object} demographics - Persona demographics
 * @param {string} domain - Domain context
 * @returns {Object} Comprehensive insights object
 */
async function generatePersonaInsights(vectors, demographics = {}, domain = 'general') {
  const lexicon = lexiconService.getLexicon(domain);

  // Build vector summary for LLM
  const vectorSummary = Object.entries(vectors)
    .map(([key, value]) => {
      const intensity = Math.abs(value) > 0.5 ? 'strongly' : Math.abs(value) > 0.2 ? 'moderately' : 'slightly';
      const direction = value > 0 ? 'high' : 'low';
      return `${key}: ${intensity} ${direction} (${value.toFixed(2)})`;
    })
    .join('\n');

  const prompt = `You are an organizational psychologist analyzing personality vectors to generate professional insights.

PERSONALITY VECTORS (scale -1 to +1):
${vectorSummary}

DOMAIN CONTEXT: ${lexicon.name}
ROLE: ${demographics.job_title || demographics.role || 'Professional'}

Generate a JSON object with these exact keys:
{
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "areas_for_growth": ["area1", "area2", "area3"],
  "learning_style": {
    "type": "Primary learning style name",
    "preferences": ["preference1", "preference2", "preference3"],
    "recommendations": ["recommendation1", "recommendation2"]
  },
  "work_style": {
    "collaboration": "How they prefer to collaborate",
    "feedback_preference": "How they prefer to receive feedback",
    "conflict_approach": "How they handle conflict",
    "decision_making": "How they make decisions",
    "stress_response": "How they respond to stress"
  },
  "compatibility": {
    "works_well_with": ["type1", "type2"],
    "potential_friction_with": ["type1", "type2"],
    "ideal_manager_style": "Description of ideal manager",
    "ideal_team_role": "Their natural role in a team"
  }
}

RULES:
- Be specific and actionable, not generic
- Base insights directly on the vector values
- Use professional, positive language (even for growth areas)
- Consider the domain context
- Return ONLY valid JSON, no markdown or explanation`;

  try {
    const response = await executeWithFailover(async (client) => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.6
    }));

    const content = response.choices[0]?.message?.content?.trim() || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const insights = JSON.parse(jsonStr);

    // Validate required fields exist
    return {
      strengths: insights.strengths || generateFallbackStrengths(vectors),
      areas_for_growth: insights.areas_for_growth || generateFallbackGrowthAreas(vectors),
      learning_style: insights.learning_style || generateFallbackLearningStyle(vectors),
      work_style: insights.work_style || generateFallbackWorkStyle(vectors),
      compatibility: insights.compatibility || generateFallbackCompatibility(vectors),
      generated_by: 'llm',
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating insights via LLM, using fallback:', error.message);
    return generateFallbackInsights(vectors);
  }
}

/**
 * Generate fallback insights when LLM fails
 */
function generateFallbackInsights(vectors) {
  return {
    strengths: generateFallbackStrengths(vectors),
    areas_for_growth: generateFallbackGrowthAreas(vectors),
    learning_style: generateFallbackLearningStyle(vectors),
    work_style: generateFallbackWorkStyle(vectors),
    compatibility: generateFallbackCompatibility(vectors),
    generated_by: 'fallback',
    generated_at: new Date().toISOString()
  };
}

function generateFallbackStrengths(vectors) {
  const strengths = [];
  if (vectors.innovation > 0.3) strengths.push('Creative problem-solving', 'Embraces new approaches');
  if (vectors.innovation < -0.3) strengths.push('Reliable methodology', 'Proven approach advocate');
  if (vectors.diligence > 0.3) strengths.push('Attention to detail', 'Thorough and methodical');
  if (vectors.diligence < -0.3) strengths.push('Quick adaptation', 'Flexible execution');
  if (vectors.social_energy > 0.3) strengths.push('Team collaboration', 'Energizes group discussions');
  if (vectors.social_energy < -0.3) strengths.push('Deep focus work', 'Independent productivity');
  if (vectors.stress_resilience > 0.3) strengths.push('Calm under pressure', 'Crisis management');
  if (vectors.decision_basis > 0.3) strengths.push('Data-driven decisions', 'Analytical thinking');
  if (vectors.decision_basis < -0.3) strengths.push('Intuitive judgment', 'Quick decision-making');
  return strengths.length > 0 ? strengths.slice(0, 5) : ['Adaptable', 'Professional', 'Team-oriented'];
}

function generateFallbackGrowthAreas(vectors) {
  const areas = [];
  if (vectors.directness > 0.5) areas.push('Softening delivery in sensitive situations');
  if (vectors.directness < -0.5) areas.push('Being more direct when clarity is needed');
  if (vectors.stress_resilience < -0.3) areas.push('Building resilience in high-pressure scenarios');
  if (vectors.social_energy > 0.5) areas.push('Allowing space for quieter team members');
  if (vectors.social_energy < -0.5) areas.push('Increasing visibility in group settings');
  if (vectors.autonomy > 0.5) areas.push('Seeking input before major decisions');
  return areas.length > 0 ? areas.slice(0, 3) : ['Continuous skill development', 'Cross-functional exposure'];
}

function generateFallbackLearningStyle(vectors) {
  const type = vectors.decision_basis > 0.2 ? 'Analytical Learner' :
    vectors.social_energy > 0.2 ? 'Collaborative Learner' :
      'Practical Learner';
  const preferences = [];
  if (vectors.decision_basis > 0) preferences.push('Evidence-based materials', 'Data and case studies');
  if (vectors.social_energy > 0) preferences.push('Group workshops', 'Discussion-based sessions');
  if (vectors.autonomy > 0) preferences.push('Self-paced courses', 'Independent study');
  if (vectors.verbosity > 0) preferences.push('Comprehensive documentation');
  if (vectors.verbosity < 0) preferences.push('Concise summaries', 'Quick reference guides');

  return {
    type,
    preferences: preferences.slice(0, 3) || ['Balanced approach'],
    recommendations: ['Provide context before details', 'Allow time for processing']
  };
}

function generateFallbackWorkStyle(vectors) {
  return {
    collaboration: vectors.social_energy > 0 ? 'Thrives in team settings with regular interaction' :
      'Prefers focused work with scheduled collaboration',
    feedback_preference: vectors.directness > 0 ? 'Appreciates direct, specific feedback' :
      'Prefers constructive feedback with context',
    conflict_approach: vectors.conflict_mode > 0 ? 'Addresses issues directly and promptly' :
      'Seeks mediated resolution and compromise',
    decision_making: vectors.decision_basis > 0 ? 'Data-driven with thorough analysis' :
      'Intuition-guided with experience-based judgment',
    stress_response: vectors.stress_resilience > 0 ? 'Maintains composure and focus' :
      'Benefits from structured support during high-pressure periods'
  };
}

function generateFallbackCompatibility(vectors) {
  const worksWellWith = [];
  const friction = [];

  if (vectors.social_energy > 0.3) {
    worksWellWith.push('Other collaborative types');
    friction.push('Highly independent workers');
  } else {
    worksWellWith.push('Focused, task-oriented individuals');
    friction.push('Highly social, meeting-heavy cultures');
  }

  if (vectors.decision_basis > 0.3) {
    worksWellWith.push('Analytical thinkers');
    friction.push('Purely intuition-driven decision makers');
  }

  return {
    works_well_with: worksWellWith,
    potential_friction_with: friction,
    ideal_manager_style: vectors.autonomy > 0 ? 'Hands-off, results-focused' : 'Supportive with regular check-ins',
    ideal_team_role: vectors.social_energy > 0.3 ? 'Facilitator or Coordinator' :
      vectors.innovation > 0.3 ? 'Innovator or Problem-solver' :
        'Executor or Specialist'
  };
}

/**
 * Get available domains for frontend dropdown
 */
function getAvailableDomains() {
  return lexiconService.getAvailableDomains();
}

/**
 * Get VCPQ questionnaire structure for frontend
 */
function getVCPQQuestions() {
  const meta = vectorService.getQuestionMeta();
  const questions = [];

  // First-person self-assessment questions
  const questionTexts = {
    A1: 'I actively seek out unproven, novel technologies.',
    A2: 'I prefer established workflows and legacy protocols.',
    A3: 'I double-check every figure and insist on perfection.',
    A4: 'I prioritize speed over absolute accuracy.',
    A5: 'I am energized by group brainstorming and meetings.',
    A6: 'I prefer solitary, focused work.',
    A7: 'I prioritize team harmony over being "right".',
    A8: 'I challenge colleagues aggressively to ensure excellence.',
    B1: 'When providing feedback, I am blunt and direct.',
    B2: 'I often sandwich feedback with praise to soften the blow.',
    B3: 'I communicate via long, narrative-style emails.',
    B4: 'I use telegraphic bullet points and fragments.',
    B5: 'I avoid contractions and use strictly formal address.',
    B6: 'I use slang and a casual, active voice.',
    B7: 'My communication is saturated with industry-specific buzzwords.',
    B8: 'I explain complex concepts in plain, accessible English.',
    C1: 'I comply immediately with superior directives.',
    C2: 'I push back publicly if a plan is flawed.',
    C3: 'I require step-by-step supervision.',
    C4: 'I work independently, reporting only results.',
    C5: 'I frequently use flattery to gain influence.',
    C6: 'This person is openly skeptical of their leadership\'s motives.',
    D1: 'In disagreements, I try to win at all costs.',
    D2: 'In disagreements, I yield to keep the peace.',
    D3: 'My decisions are driven by data and spreadsheet analysis.',
    D4: 'My decisions are driven by gut feeling and intuition.',
    D5: 'I remain stoic and unflappable during a crisis.',
    D6: 'I become visibly anxious under heavy pressure.'
  };

  for (const [id, metaInfo] of Object.entries(meta)) {
    const module = id.charAt(0);
    const moduleNames = {
      A: 'Cognition',
      B: 'Communication',
      C: 'Hierarchy',
      D: 'Operational'
    };

    questions.push({
      id,
      module: moduleNames[module],
      question: questionTexts[id],
      meta_vector: metaInfo.meta,
      reversed: metaInfo.reversed,
      scale: {
        min: 1,
        max: 5,
        labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      }
    });
  }

  return questions;
}

module.exports = {
  generateVCPQPersona,
  chatWithVCPQPersona,
  validateVCPQPersona,
  createPersonaPipeline,
  getAvailableDomains,
  getVCPQQuestions,
  generatePersonaName,
  generatePersonaInsights,
  inferAgeRange
};




