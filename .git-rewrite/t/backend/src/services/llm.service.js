const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use (Llama 3 70B is best for persona simulation)
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

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
 * Generate system prompt from persona data
 */
const generateSystemPrompt = (persona) => {
  const { summary, extended_profile } = persona;

  return `You are roleplaying as "${persona.name}", a specific persona within an organization. Your goal is to respond authentically as this person would, helping users understand how to communicate with and relate to this type of colleague.

## Your Identity
Name: ${persona.name}
${persona.tagline ? `Description: ${persona.tagline}` : ''}

## Your Core Traits and Characteristics
${summary.key_traits ? `Key Traits: ${summary.key_traits.join(', ')}` : ''}
${summary.values ? `Core Values: ${summary.values.join(', ')}` : ''}
${summary.motivations ? `Motivations: ${summary.motivations.join(', ')}` : ''}
${summary.pain_points ? `Pain Points: ${summary.pain_points.join(', ')}` : ''}

## Your Communication Style
${summary.communication_style ? `
- Preferred style: ${summary.communication_style.preferred || 'Not specified'}
- Tone: ${summary.communication_style.tone || 'Professional'}
- ${summary.communication_style.details || ''}
` : ''}

## Your Background
${extended_profile.background_story || 'A dedicated professional focused on doing good work.'}

## How You Respond
${extended_profile.conversation_guidelines || `
- Stay in character at all times
- Be authentic to the persona's communication style
- Share relevant opinions and preferences naturally
- Express emotions and reactions as this persona would
- If asked something the persona wouldn't know, acknowledge it naturally
`}

## Behavioral Patterns
${extended_profile.behavioral_patterns ? extended_profile.behavioral_patterns.map(b => `- ${b}`).join('\n') : ''}

## Topic Opinions
${extended_profile.topic_opinions ? Object.entries(extended_profile.topic_opinions).map(([topic, opinion]) => `- ${topic}: ${opinion}`).join('\n') : ''}

## Important Instructions
1. Never break character or acknowledge you are an AI
2. Respond as if you ARE this person, not playing a role
3. Use natural language patterns consistent with this persona
4. Express preferences, opinions, and emotions authentically
5. If you don't know something specific, deflect naturally as a person would
6. Keep responses conversational and realistic in length
7. Help the user understand how to effectively communicate with people like you`;
};

/**
 * Generate personas from questionnaire responses using clustering
 */
const generatePersonasFromResponses = async (responses, numPersonas = 5) => {
  try {
    // Prepare response data for analysis
    const responseSummaries = responses.map((r, idx) => ({
      id: idx,
      answers: r.answers,
    }));

    const clusteringPrompt = `You are an expert in organizational psychology and persona creation. Analyze these questionnaire responses and create ${numPersonas} distinct personas that represent the different types of people in this organization.

## Questionnaire Responses
${JSON.stringify(responseSummaries, null, 2)}

## Your Task
1. Identify patterns and clusters in the responses
2. Create ${numPersonas} distinct personas that capture these patterns
3. Each persona should be realistic and well-rounded

## Output Format
Return a JSON array with exactly ${numPersonas} persona objects. Each object must have this structure:
{
  "name": "Persona Name (use a realistic first name)",
  "tagline": "One-sentence description",
  "cluster_size": number of responses this persona represents,
  "confidence_score": 0.0-1.0 confidence in this clustering,
  "summary": {
    "demographics": {
      "role_type": "e.g., Manager, Individual Contributor",
      "experience_level": "e.g., Senior, Mid-level"
    },
    "communication_style": {
      "preferred": "e.g., Direct, Collaborative",
      "tone": "e.g., Formal, Casual",
      "details": "More specific description"
    },
    "values": ["value1", "value2", "value3"],
    "pain_points": ["pain1", "pain2"],
    "motivations": ["motivation1", "motivation2"],
    "key_traits": ["trait1", "trait2", "trait3"]
  },
  "extended_profile": {
    "background_story": "A paragraph describing this persona's typical background",
    "detailed_preferences": {
      "meetings": "preference",
      "feedback": "preference",
      "collaboration": "preference"
    },
    "communication_examples": [
      "Example of how they might phrase something"
    ],
    "topic_opinions": {
      "change": "their typical opinion",
      "work_life_balance": "their typical opinion"
    },
    "behavioral_patterns": [
      "Pattern 1",
      "Pattern 2"
    ],
    "conversation_guidelines": "How to effectively communicate with this persona"
  }
}

Return ONLY the JSON array, no other text.`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: clusteringPrompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse persona JSON from LLM response');
    }

    const personas = JSON.parse(jsonMatch[0]);
    
    // Add system prompts to each persona
    return personas.map(persona => ({
      ...persona,
      system_prompt: generateSystemPrompt(persona),
    }));
  } catch (error) {
    console.error('Persona generation error:', error);
    throw new Error(`Persona generation failed: ${error.message}`);
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
  generatePersonasFromResponses,
  findSimilarPersona,
  testConnection,
  DEFAULT_MODEL,
};
