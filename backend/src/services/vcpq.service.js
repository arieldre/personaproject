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
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.8
    });
    
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
    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });
    
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
    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });
    
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
    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3 // Lower temperature for consistent scoring
    });
    
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
  
  // Third-person questions for assessment
  const questionTexts = {
    A1: 'This person actively seeks out unproven, novel technologies.',
    A2: 'This person prefers established workflows and legacy protocols.',
    A3: 'This person double-checks every figure and insists on perfection.',
    A4: 'This person prioritizes speed over absolute accuracy.',
    A5: 'This person is energized by group brainstorming and meetings.',
    A6: 'This person prefers solitary, focused work.',
    A7: 'This person prioritizes team harmony over being "right".',
    A8: 'This person challenges colleagues aggressively to ensure excellence.',
    B1: 'When providing feedback, this person is blunt and imperative.',
    B2: 'Feedback is often "sandwiched" with praise to soften the blow.',
    B3: 'This person communicates via long, narrative-style emails.',
    B4: 'This person uses telegraphic bullet points and fragments.',
    B5: 'This person avoids contractions and uses strictly formal address.',
    B6: 'This person uses slang and a casual, active voice.',
    B7: 'Communication is saturated with industry-specific buzzwords.',
    B8: 'Complex concepts are explained in plain, accessible English.',
    C1: 'This person complies immediately with superior directives.',
    C2: 'This person pushes back publicly if a plan is flawed.',
    C3: 'This person requires step-by-step supervision.',
    C4: 'This person works independently, reporting only results.',
    C5: 'This person frequently uses flattery to gain influence.',
    C6: 'This person is openly skeptical of their leadership\'s motives.',
    D1: 'In disagreements, this person tries to win at all costs.',
    D2: 'In disagreements, this person yields to keep the peace.',
    D3: 'Decisions are driven by data and spreadsheet analysis.',
    D4: 'Decisions are driven by gut feeling and intuition.',
    D5: 'This person remains stoic and unflappable during a crisis.',
    D6: 'This person becomes visibly anxious under heavy pressure.'
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
  inferAgeRange
};
