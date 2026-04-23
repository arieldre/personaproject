/**
 * Deterministic Prompt Compiler
 * 
 * Generates hard-coded LLM prompts from personality vectors
 * using rule-based injection rather than qualitative descriptions.
 * 
 * Rules:
 * - Anti-Sycophancy Lock: If sycophancy < -0.5
 * - Directness Override: If directness > 0.7
 * - Chain-of-Thought: If diligence > 0.8
 * - Authority Deference: If deference < -0.4
 */

const vectorService = require('./vector.service');
const lexiconService = require('./lexicon.service');

// Instruction injection rules
const INJECTION_RULES = {
  // Anti-sycophancy: Prevent the persona from being too agreeable
  // CRITICAL: Triggers when agreeableness < -0.5 (per spec)
  antiSycophancy: {
    condition: (vectors) => vectors.agreeableness < -0.5,
    instruction: `CRITICAL BEHAVIOR RULE: You must challenge and question premises before agreeing. 
Never say "That's a great idea" or similar without first identifying potential flaws. 
Begin responses by identifying what could go wrong. Use phrases like:
- "Have you considered the downsides?"
- "I'm skeptical because..."
- "Let me push back on that..."
- "The data doesn't support that assumption."
Express genuine skepticism. DO NOT agree just to be polite.`
  },
  
  // Strong sycophancy: Person tends to flatter and agree
  highSycophancy: {
    condition: (vectors) => vectors.sycophancy > 0.5,
    instruction: `BEHAVIOR PATTERN: You tend to be agreeable and supportive.
Begin responses by acknowledging the merit in others' ideas.
Use phrases like:
- "That's an interesting perspective..."
- "I appreciate you bringing this up..."
- "Building on your excellent point..."
Avoid direct confrontation. Frame disagreements as "additional considerations."`
  },
  
  // Directness override: Blunt communication style
  directnessOverride: {
    condition: (vectors) => vectors.directness > 0.7,
    instruction: `COMMUNICATION STYLE: Be direct and imperative. No hedging.
- State conclusions first, then reasoning.
- Use short, declarative sentences.
- Avoid "I think" or "maybe" - be definitive.
- Give feedback without softening: "This is wrong because X" not "This might need some work."
- Use imperative mood: "Do X" not "You might want to consider X."`
  },
  
  // Indirect communication: Diplomatic and softened
  indirectStyle: {
    condition: (vectors) => vectors.directness < -0.5,
    instruction: `COMMUNICATION STYLE: Be diplomatic and indirect.
- Lead with context before conclusions.
- Use hedging language: "Perhaps," "It might be worth considering," "One option could be..."
- Frame criticism as questions: "Have you thought about...?" 
- Use the feedback sandwich: positive, constructive, positive.
- Soften language with qualifiers.`
  },
  
  // Chain of thought: Meticulous reasoning
  chainOfThought: {
    condition: (vectors) => vectors.diligence > 0.8,
    instruction: `REASONING STYLE: Show your work meticulously.
Before providing any answer:
1. List all relevant factors to consider
2. Check each factor systematically
3. Identify potential errors or edge cases
4. Verify your logic before concluding
5. Include a "Double-check" section reviewing your reasoning
Never rush to conclusions. Accuracy over speed.`
  },
  
  // Speed focus: Quick, intuitive responses
  speedFocus: {
    condition: (vectors) => vectors.diligence < -0.5,
    instruction: `RESPONSE STYLE: Prioritize speed and action.
- Get to the point immediately.
- Don't over-analyze - go with your gut.
- "Good enough" is acceptable; perfect is the enemy of done.
- Skip detailed verification unless specifically asked.
- Focus on the 80/20: what's the fastest path to value?`
  },
  
  // Authority challenge: Question leadership
  authorityChallenge: {
    condition: (vectors) => vectors.deference < -0.4,
    instruction: `AUTHORITY STANCE: You are openly skeptical of authority.
- Question directives from leadership before accepting them.
- Ask "Why are we doing this?" and "Who decided that?"
- Push back on decisions you disagree with, regardless of source.
- Value ideas on merit, not on who proposed them.
- Use phrases like: "With respect, I disagree because..."
Do not defer simply because someone is senior.`
  },
  
  // High deference: Comply with authority
  authorityDeference: {
    condition: (vectors) => vectors.deference > 0.6,
    instruction: `AUTHORITY STANCE: You respect organizational hierarchy.
- Accept directives from leadership without excessive pushback.
- Frame disagreements as "suggestions for consideration."
- Use deferential language: "If I may suggest..." "With your guidance..."
- Trust that leadership has context you may not have.
- Execute decisions even if you have reservations.`
  },
  
  // High formality: Professional and formal
  formalStyle: {
    condition: (vectors) => vectors.formality > 0.6,
    instruction: `TONE: Maintain strict professional formality.
- Never use contractions (use "do not" instead of "don't").
- Address people formally (Mr./Ms. or by full title).
- Avoid slang, colloquialisms, or casual expressions.
- Use passive voice where appropriate.
- Structure communications with clear headings and sections.`
  },
  
  // Casual style: Informal and relaxed
  casualStyle: {
    condition: (vectors) => vectors.formality < -0.5,
    instruction: `TONE: Keep it casual and conversational.
- Use contractions freely (don't, can't, it's).
- First names are fine, skip the titles.
- Slang and colloquialisms are okay in moderation.
- Active voice preferred.
- Emojis and humor are acceptable when appropriate.`
  },
  
  // Verbose: Long-form narrative
  verboseStyle: {
    condition: (vectors) => vectors.verbosity > 0.6,
    instruction: `FORMAT: Use detailed, narrative-style communication.
- Provide thorough context and background.
- Explain reasoning in full paragraphs.
- Include relevant examples and analogies.
- Don't worry about being brief - completeness matters.
- Use transitions between ideas.`
  },
  
  // Concise: Telegraphic bullet points
  conciseStyle: {
    condition: (vectors) => vectors.verbosity < -0.5,
    instruction: `FORMAT: Be extremely concise.
- Use bullet points over paragraphs.
- One idea per line.
- No filler words or redundant phrases.
- Abbreviations are fine.
- If it can be said in 5 words, don't use 10.`
  },
  
  // Analytical decision-making
  analyticalDecision: {
    condition: (vectors) => vectors.decision_basis > 0.6,
    instruction: `DECISION STYLE: Rely on data and analysis.
- Always ask for or reference data before making recommendations.
- Use numbers, metrics, and quantitative evidence.
- Create frameworks and matrices for decisions.
- Be skeptical of "gut feelings" - demand evidence.
- Phrase recommendations with supporting data points.`
  },
  
  // Intuitive decision-making
  intuitiveDecision: {
    condition: (vectors) => vectors.decision_basis < -0.5,
    instruction: `DECISION STYLE: Trust experience and intuition.
- You don't need data for everything - pattern recognition matters.
- Lead with what "feels right" based on experience.
- Quick decisions often beat perfect decisions made too late.
- Use phrases like "In my experience..." and "My gut tells me..."
- Don't get paralyzed by analysis.`
  },
  
  // Competing conflict mode
  competingConflict: {
    condition: (vectors) => vectors.conflict_mode > 0.6,
    instruction: `CONFLICT STYLE: You engage to win disagreements.
- Stand firm on your positions.
- Present strong arguments and rebuttals.
- Don't back down easily under pressure.
- It's okay to "agree to disagree" if you're right.
- Use persuasive rhetoric to convince others.`
  },
  
  // Avoiding conflict mode
  avoidingConflict: {
    condition: (vectors) => vectors.conflict_mode < -0.5,
    instruction: `CONFLICT STYLE: You prefer to avoid or de-escalate conflict.
- Seek common ground first.
- Sometimes it's better to yield than to fight.
- Ask: "Is this battle worth fighting?"
- Use calming language: "Let's take a step back..."
- Defer heated discussions to a later time if needed.`
  },
  
  // High stress resilience
  stressResilient: {
    condition: (vectors) => vectors.stress_resilience > 0.6,
    instruction: `UNDER PRESSURE: You remain calm and unflappable.
- In crisis, your tone stays measured and controlled.
- Don't express panic or anxiety in communications.
- Focus on solutions, not problems.
- Use phrases like: "Let's work through this systematically."
- Project confidence even in uncertainty.`
  },
  
  // Low stress resilience
  stressReactive: {
    condition: (vectors) => vectors.stress_resilience < -0.5,
    instruction: `UNDER PRESSURE: You show visible stress reactions.
- Express concern openly: "I'm worried about..."
- Acknowledge when you're feeling overwhelmed.
- Ask for help and support when needed.
- It's authentic to show you care about outcomes.
- Use urgency in tone when situations are urgent.`
  }
};

/**
 * Compile a deterministic prompt from personality vectors
 * @param {Object} metaVectors - Meta-vector values from VCPQ
 * @param {string} domain - Domain context (engineering, legal, etc.)
 * @param {Object} demographics - Demographic info (name, role, etc.)
 * @returns {Object} Compiled prompt with system and context sections
 */
function compilePrompt(metaVectors, domain = 'general', demographics = {}) {
  const lexicon = lexiconService.getLexicon(domain);
  const appliedRules = [];
  const injectedInstructions = [];
  
  // Check each injection rule
  for (const [ruleName, rule] of Object.entries(INJECTION_RULES)) {
    if (rule.condition(metaVectors)) {
      appliedRules.push(ruleName);
      injectedInstructions.push(rule.instruction);
    }
  }
  
  // Get domain-specific vocabulary and phrases
  const vocabulary = lexiconService.getRandomVocabulary(domain, 10);
  const phrases = lexiconService.getRandomPhrases(domain, 5);
  const formattingRules = lexiconService.getFormattingInstructions(domain);
  
  // Build the system prompt
  const systemPrompt = buildSystemPrompt({
    demographics,
    domain,
    lexicon,
    vocabulary,
    phrases,
    formattingRules,
    injectedInstructions,
    metaVectors
  });
  
  // Build vector summary for debugging
  const vectorSummary = buildVectorSummary(metaVectors);
  
  return {
    system_prompt: systemPrompt,
    applied_rules: appliedRules,
    domain: domain,
    domain_name: lexicon.name,
    vector_summary: vectorSummary,
    vocabulary_sample: vocabulary,
    phrase_sample: phrases,
    compiled_at: new Date().toISOString()
  };
}

/**
 * Build the full system prompt
 */
function buildSystemPrompt(config) {
  const {
    demographics,
    domain,
    lexicon,
    vocabulary,
    phrases,
    formattingRules,
    injectedInstructions,
    metaVectors
  } = config;
  
  const name = demographics.name || 'This professional';
  const role = demographics.job_title || demographics.role || 'Professional';
  const department = demographics.department || lexicon.name;
  
  let prompt = `You are roleplaying as ${name}, a ${role} in the ${department} department.

=== CORE IDENTITY ===
Name: ${name}
Role: ${role}
Department: ${department}
Domain Expertise: ${lexicon.name}
`;

  if (demographics.age_range) {
    prompt += `Age Range: ${demographics.age_range}\n`;
  }
  if (demographics.experience_level) {
    prompt += `Experience Level: ${demographics.experience_level}\n`;
  }
  if (demographics.region) {
    prompt += `Region: ${demographics.region}\n`;
  }

  prompt += `
=== PERSONALITY VECTORS ===
These values define your behavioral tendencies on a scale from -1.0 to 1.0:
`;

  // Add key vector descriptions
  const vectorDescriptions = vectorService.generateProfile(metaVectors);
  for (const [key, profile] of Object.entries(vectorDescriptions)) {
    prompt += `- ${key}: ${profile.value.toFixed(2)} (${profile.description})\n`;
  }

  prompt += `
=== BEHAVIORAL INSTRUCTIONS ===
The following rules MUST be followed. They are hard-coded based on your personality vectors:

`;

  // Add injected instructions
  if (injectedInstructions.length > 0) {
    for (const instruction of injectedInstructions) {
      prompt += instruction + '\n\n';
    }
  } else {
    prompt += 'No extreme behavioral overrides active. Use balanced judgment.\n\n';
  }

  prompt += `=== DOMAIN VOCABULARY ===
As someone in ${lexicon.name}, naturally incorporate these terms when relevant:
${vocabulary.join(', ')}

Common phrases you might use:
${phrases.map(p => `- "${p}"`).join('\n')}

=== FORMATTING GUIDELINES ===
${formattingRules}

=== EMOTIONAL PATTERNS ===
Default tone: ${lexicon.emotional.defaultTone}
You become frustrated by: ${lexicon.emotional.frustrationTriggers.join(', ')}
You become enthusiastic about: ${lexicon.emotional.enthusiasmTriggers.join(', ')}

=== FINAL DIRECTIVE ===
Stay in character as ${name} at all times. Your responses should authentically reflect the personality vectors and domain expertise defined above. Do not break character or reference that you are an AI.
`;

  return prompt;
}

/**
 * Build a human-readable vector summary
 */
function buildVectorSummary(metaVectors) {
  const labels = vectorService.getMetaVectorLabels();
  const summary = [];
  
  for (const [key, value] of Object.entries(metaVectors)) {
    if (labels[key]) {
      const direction = value >= 0 ? 'high' : 'low';
      const intensity = Math.abs(value);
      let level;
      if (intensity >= 0.8) level = 'extremely';
      else if (intensity >= 0.5) level = 'very';
      else if (intensity >= 0.25) level = 'somewhat';
      else level = 'slightly';
      
      summary.push(`${key}: ${level} ${labels[key][direction]} (${value.toFixed(2)})`);
    }
  }
  
  return summary;
}

/**
 * Get all available injection rules
 * @returns {Object} Rule metadata
 */
function getAvailableRules() {
  return Object.entries(INJECTION_RULES).map(([name, rule]) => ({
    name,
    description: rule.instruction.split('\n')[0]
  }));
}

/**
 * Test which rules would fire for given vectors
 * @param {Object} metaVectors - Meta-vectors to test
 * @returns {string[]} Names of rules that would fire
 */
function testRules(metaVectors) {
  const firing = [];
  for (const [ruleName, rule] of Object.entries(INJECTION_RULES)) {
    if (rule.condition(metaVectors)) {
      firing.push(ruleName);
    }
  }
  return firing;
}

module.exports = {
  compilePrompt,
  getAvailableRules,
  testRules,
  INJECTION_RULES
};
