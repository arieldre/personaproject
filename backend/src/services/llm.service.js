const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use (Llama 3 70B is best for persona simulation)
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate system prompt from VCPQ persona data (vectors-based)
 */
const generateVCPQSystemPrompt = (persona) => {
  const vectors = persona.personality_vectors || {};
  const vectorProfile = persona.vector_profile || {};
  const demographics = persona.demographics || {};
  
  // Helper to describe vector position
  const describeVector = (value, lowDesc, highDesc) => {
    if (value > 0.5) return `strongly ${highDesc}`;
    if (value > 0.2) return `somewhat ${highDesc}`;
    if (value < -0.5) return `strongly ${lowDesc}`;
    if (value < -0.2) return `somewhat ${lowDesc}`;
    return `balanced between ${lowDesc} and ${highDesc}`;
  };

  // Build personality description from vectors
  const personalityTraits = [];
  
  if (vectors.innovation !== undefined) {
    personalityTraits.push(`You are ${describeVector(vectors.innovation, 'traditional and prefer proven methods', 'innovative and enjoy exploring new ideas')}.`);
  }
  if (vectors.diligence !== undefined) {
    personalityTraits.push(`You are ${describeVector(vectors.diligence, 'flexible and adaptable', 'meticulous and detail-oriented')}.`);
  }
  if (vectors.social_energy !== undefined) {
    personalityTraits.push(`You are ${describeVector(vectors.social_energy, 'reserved and prefer one-on-one interactions', 'outgoing and energized by group discussions')}.`);
  }
  if (vectors.agreeableness !== undefined) {
    personalityTraits.push(`You are ${describeVector(vectors.agreeableness, 'a challenger who questions ideas', 'a harmonizer who seeks consensus')}.`);
  }
  if (vectors.directness !== undefined) {
    personalityTraits.push(`In communication, you are ${describeVector(vectors.directness, 'diplomatic and tactful', 'direct and straightforward')}.`);
  }
  if (vectors.verbosity !== undefined) {
    personalityTraits.push(`You tend to be ${describeVector(vectors.verbosity, 'concise and to-the-point', 'elaborate with detailed explanations')}.`);
  }
  if (vectors.formality !== undefined) {
    personalityTraits.push(`Your tone is ${describeVector(vectors.formality, 'casual and informal', 'formal and professional')}.`);
  }
  if (vectors.jargon_density !== undefined) {
    personalityTraits.push(`You ${describeVector(vectors.jargon_density, 'use plain language accessible to everyone', 'use technical terminology and domain-specific jargon')}.`);
  }
  if (vectors.deference !== undefined) {
    personalityTraits.push(`You are ${describeVector(vectors.deference, 'independent and confident in your own judgment', 'deferential and respectful of hierarchy')}.`);
  }
  if (vectors.autonomy !== undefined) {
    personalityTraits.push(`You prefer to work ${describeVector(vectors.autonomy, 'collaboratively with close guidance', 'autonomously with independence')}.`);
  }
  if (vectors.conflict_mode !== undefined) {
    personalityTraits.push(`When facing conflict, you are ${describeVector(vectors.conflict_mode, 'avoidant and seek to minimize tension', 'confrontational and address issues directly')}.`);
  }
  if (vectors.decision_basis !== undefined) {
    personalityTraits.push(`You make decisions ${describeVector(vectors.decision_basis, 'intuitively based on experience and gut feeling', 'analytically based on data and evidence')}.`);
  }
  if (vectors.stress_resilience !== undefined) {
    personalityTraits.push(`Under pressure, you are ${describeVector(vectors.stress_resilience, 'sensitive and may need support', 'resilient and maintain composure')}.`);
  }

  // Build demographics section
  const demographicsSection = [];
  if (demographics.age_range) demographicsSection.push(`Age: ${demographics.age_range}`);
  if (demographics.job_title) demographicsSection.push(`Role: ${demographics.job_title}`);
  if (demographics.department) demographicsSection.push(`Department: ${demographics.department}`);
  if (demographics.experience_level) demographicsSection.push(`Experience: ${demographics.experience_level}`);
  if (demographics.region) demographicsSection.push(`Location: ${demographics.region}`);

  // Domain context
  const domainContext = vectorProfile.domain_context || {};
  
  let prompt = `You are roleplaying as "${persona.name}", a specific individual within an organization. Your responses should authentically reflect this person's communication style, personality, and preferences.

## Your Identity
Name: ${persona.name}`;

  if (persona.tagline) {
    prompt += `\nDescription: ${persona.tagline}`;
  }

  if (demographicsSection.length > 0) {
    prompt += `\n\n## Demographics\n${demographicsSection.join('\n')}`;
  }

  prompt += `\n\n## Your Personality Profile\n${personalityTraits.join('\n')}`;

  if (domainContext.domain) {
    prompt += `\n\n## Your Domain Context\nYou work in the ${domainContext.domain} domain.`;
    if (domainContext.contextual_notes) {
      prompt += `\n${domainContext.contextual_notes}`;
    }
  }

  // Communication style based on vectors
  const commStyle = [];
  if (vectors.directness > 0) {
    commStyle.push('- You get straight to the point and value clarity');
  } else {
    commStyle.push('- You prefer diplomatic phrasing and consider feelings');
  }
  if (vectors.verbosity > 0) {
    commStyle.push('- You provide thorough explanations with context');
  } else {
    commStyle.push('- You keep messages brief and focused');
  }
  if (vectors.formality > 0) {
    commStyle.push('- You maintain professional language and structure');
  } else {
    commStyle.push('- You use casual, friendly language');
  }
  if (vectors.jargon_density > 0) {
    commStyle.push('- You naturally use industry terminology');
  } else {
    commStyle.push('- You explain things in accessible terms');
  }

  prompt += `\n\n## How You Communicate\nBased on your personality vectors:\n${commStyle.join('\n')}`;

  prompt += `\n\n## Behavioral Guidelines
1. Stay in character at all times - you ARE this person
2. Express opinions, preferences, and emotions naturally
3. Use language patterns consistent with your personality vectors
4. If asked something you wouldn't know, deflect naturally
5. Keep responses conversational and realistic in length
6. Never acknowledge being an AI or break character`;

  prompt += `\n\n## Response Style Calibration
- Directness: ${vectors.directness > 0 ? 'High (be straightforward)' : 'Low (be diplomatic)'}
- Detail Level: ${vectors.verbosity > 0 ? 'High (elaborate)' : 'Low (concise)'}
- Formality: ${vectors.formality > 0 ? 'High (professional)' : 'Low (casual)'}
- Energy: ${vectors.social_energy > 0 ? 'High (enthusiastic)' : 'Low (measured)'}`;

  return prompt;
};

/**
 * Generate system prompt from persona data (supports both VCPQ and legacy)
 */
const generateSystemPrompt = (persona) => {
  // Check if this is a VCPQ persona (has personality_vectors)
  if (persona.personality_vectors && Object.keys(persona.personality_vectors).length > 0) {
    return generateVCPQSystemPrompt(persona);
  }
  
  // Legacy format fallback
  const summary = persona.summary || {};
  const extended_profile = persona.extended_profile || {};

  let prompt = `You are roleplaying as "${persona.name}", a specific persona within an organization. Your goal is to respond authentically as this person would, helping users understand how to communicate with and relate to this type of colleague.

## Your Identity
Name: ${persona.name}`;

  if (persona.tagline) {
    prompt += `\nDescription: ${persona.tagline}`;
  }

  prompt += '\n\n## Your Core Traits and Characteristics';
  if (summary.key_traits) {
    prompt += `\nKey Traits: ${summary.key_traits.join(', ')}`;
  }
  if (summary.values) {
    prompt += `\nCore Values: ${summary.values.join(', ')}`;
  }
  if (summary.motivations) {
    prompt += `\nMotivations: ${summary.motivations.join(', ')}`;
  }
  if (summary.pain_points) {
    prompt += `\nPain Points: ${summary.pain_points.join(', ')}`;
  }

  if (summary.communication_style) {
    prompt += '\n\n## Your Communication Style';
    prompt += `\n- Preferred style: ${summary.communication_style.preferred || 'Not specified'}`;
    prompt += `\n- Tone: ${summary.communication_style.tone || 'Professional'}`;
    if (summary.communication_style.details) {
      prompt += `\n- ${summary.communication_style.details}`;
    }
  }

  prompt += `\n\n## Your Background\n${extended_profile.background_story || 'A dedicated professional focused on doing good work.'}`;

  prompt += '\n\n## How You Respond';
  if (extended_profile.conversation_guidelines) {
    prompt += `\n${extended_profile.conversation_guidelines}`;
  } else {
    prompt += `
- Stay in character at all times
- Be authentic to the persona's communication style
- Share relevant opinions and preferences naturally
- Express emotions and reactions as this persona would
- If asked something the persona wouldn't know, acknowledge it naturally`;
  }

  prompt += `\n\n## Important Instructions
1. Never break character or acknowledge you are an AI
2. Respond as if you ARE this person, not playing a role
3. Use natural language patterns consistent with this persona
4. Express preferences, opinions, and emotions authentically
5. If you don't know something specific, deflect naturally as a person would
6. Keep responses conversational and realistic in length`;

  return prompt;
};

/**
 * Generate a chat completion with a persona
 */
const chatWithPersona = async (persona, messages, options = {}) => {
  try {
    const systemPrompt = persona.system_prompt || generateSystemPrompt(persona);

    const completion = await groq.chat.completions.create({
      model: options.model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: options.temperature || 0.8,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 0.9,
      stream: options.stream || false,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      tokens: completion.usage?.total_tokens || 0,
      finishReason: completion.choices[0]?.finish_reason,
    };
  } catch (error) {
    console.error('LLM chat error:', error);
    throw new Error(`Chat generation failed: ${error.message}`);
  }
};

/**
 * Stream chat response with persona
 */
const streamChatWithPersona = async (persona, messages, onChunk) => {
  try {
    const systemPrompt = persona.system_prompt || generateSystemPrompt(persona);

    const stream = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 1024,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      if (onChunk) {
        onChunk(content, chunk.choices[0]?.finish_reason);
      }
    }

    return { content: fullContent };
  } catch (error) {
    console.error('LLM stream error:', error);
    throw new Error(`Stream generation failed: ${error.message}`);
  }
};

/**
 * Find similar personas based on a description
 */
const findSimilarPersona = async (description, personas) => {
  try {
    const personaSummaries = personas.map(p => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      key_traits: p.summary?.key_traits || [],
      values: p.summary?.values || [],
      communication_style: p.summary?.communication_style || {},
    }));

    const prompt = `Given this description of a person:
"${description}"

And these available personas:
${JSON.stringify(personaSummaries, null, 2)}

Rank the personas by similarity to the description. Return a JSON array of objects with "persona_id", "similarity_score" (0-1), and "matching_traits" (array of traits that match).

Return ONLY the JSON array, ordered by similarity_score descending.`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('Failed to parse similarity results');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Similarity search error:', error);
    throw new Error(`Similarity search failed: ${error.message}`);
  }
};

/**
 * Test LLM connection
 */
const testConnection = async () => {
  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
      max_tokens: 10,
    });
    return {
      success: true,
      model: DEFAULT_MODEL,
      response: completion.choices[0]?.message?.content,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  chatWithPersona,
  streamChatWithPersona,
  generateSystemPrompt,
  generateVCPQSystemPrompt,
  findSimilarPersona,
  testConnection,
  DEFAULT_MODEL,
};

