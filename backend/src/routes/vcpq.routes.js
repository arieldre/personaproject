/**
 * VCPQ API Routes
 * 
 * Endpoints for the Vectorizable Corporate Persona Questionnaire system.
 */

const express = require('express');
const router = express.Router();
const vcpqService = require('../services/vcpq.service');
const vectorService = require('../services/vector.service');
const lexiconService = require('../services/lexicon.service');
const promptCompiler = require('../services/promptCompiler.service');
const db = require('../config/database');

/**
 * GET /api/vcpq/questions
 * Get the 28-item VCPQ questionnaire structure
 */
router.get('/questions', (req, res) => {
  try {
    const questions = vcpqService.getVCPQQuestions();
    res.json({
      success: true,
      questionnaire: {
        name: 'VCPQ - Vectorizable Corporate Persona Questionnaire',
        version: 'vcpq-v1',
        question_count: questions.length,
        modules: ['Cognition', 'Communication', 'Hierarchy', 'Operational'],
        questions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vcpq/domains
 * Get available domain contexts for lexical libraries
 */
router.get('/domains', (req, res) => {
  try {
    const domains = vcpqService.getAvailableDomains();
    res.json({
      success: true,
      domains
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vcpq/domains/:domain
 * Get detailed lexicon for a specific domain
 */
router.get('/domains/:domain', (req, res) => {
  try {
    const lexicon = lexiconService.getLexicon(req.params.domain);
    res.json({
      success: true,
      domain: req.params.domain,
      lexicon: {
        name: lexicon.name,
        shortCode: lexicon.shortCode,
        vocabulary: lexicon.vocabulary,
        phrases: lexicon.phrases,
        style: lexicon.style,
        formatting: lexicon.formatting,
        emotional: lexicon.emotional
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/calculate-vectors
 * Calculate vectors from raw survey responses without generating persona
 */
router.post('/calculate-vectors', (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses) {
      return res.status(400).json({ error: 'Missing responses object' });
    }
    
    const validation = vectorService.validateResponses(responses);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid responses',
        details: validation.errors,
        warnings: validation.warnings
      });
    }
    
    const result = vectorService.processVCPQResponses(responses);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/preview-prompt
 * Preview the compiled prompt without creating a persona
 */
router.post('/preview-prompt', (req, res) => {
  try {
    const { responses, domain = 'general', demographics = {} } = req.body;
    
    if (!responses) {
      return res.status(400).json({ error: 'Missing responses object' });
    }
    
    // Process vectors
    const vectorResult = vectorService.processVCPQResponses(responses);
    const modifiedVectors = lexiconService.applyDomainModifiers(
      vectorResult.meta_vectors,
      domain
    );
    
    // Compile prompt
    const compiled = promptCompiler.compilePrompt(modifiedVectors, domain, demographics);
    
    res.json({
      success: true,
      meta_vectors: modifiedVectors,
      profile: vectorResult.profile,
      prompt_preview: compiled
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/generate-persona
 * Generate a VCPQ-based persona
 */
router.post('/generate-persona', async (req, res) => {
  try {
    const { 
      responses, 
      domain = 'general', 
      demographics = {},
      questionnaire_id,
      save = true 
    } = req.body;
    
    if (!responses) {
      return res.status(400).json({ error: 'Missing responses object' });
    }
    
    // Generate persona
    const persona = await vcpqService.generateVCPQPersona(
      responses,
      demographics,
      domain
    );
    
    // Optionally save to database
    if (save && questionnaire_id) {
      const insertQuery = `
        INSERT INTO personas (
          questionnaire_id,
          name,
          age_range,
          region,
          job_title,
          department,
          experience_level,
          personality_traits,
          communication_style,
          decision_making,
          motivations,
          pain_points,
          goals,
          personality_vectors,
          domain_context,
          raw_survey_scores,
          vector_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
      const values = [
        questionnaire_id,
        persona.name,
        persona.demographics.age_range,
        persona.demographics.region,
        persona.demographics.job_title,
        persona.demographics.department,
        persona.demographics.experience_level,
        JSON.stringify(Object.keys(persona.vector_profile).map(k => persona.vector_profile[k].label)),
        persona.vector_profile.directness?.label || 'Balanced',
        persona.vector_profile.decision_basis?.label || 'Balanced',
        persona.vector_profile.innovation?.label || 'Balanced',
        persona.vector_profile.stress_resilience?.label || 'Balanced',
        persona.vector_profile.diligence?.label || 'Balanced',
        JSON.stringify(persona.personality_vectors),
        persona.domain_context,
        JSON.stringify(persona.raw_survey_scores),
        persona.vector_version
      ];
      
      const result = await db.query(insertQuery, values);
      persona.id = result.rows[0].id;
      persona.saved = true;
    }
    
    res.json({
      success: true,
      persona
    });
  } catch (error) {
    console.error('Error generating persona:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/validate-persona
 * Run self-assessment validation on a persona
 */
router.post('/validate-persona', async (req, res) => {
  try {
    const { persona_id, system_prompt, meta_vectors } = req.body;
    
    let prompt = system_prompt;
    let vectors = meta_vectors;
    
    // If persona_id provided, fetch from database
    if (persona_id) {
      const result = await db.query(
        'SELECT * FROM personas WHERE id = $1',
        [persona_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Persona not found' });
      }
      
      const persona = result.rows[0];
      vectors = persona.personality_vectors;
      
      // Recompile prompt if not provided
      if (!prompt) {
        const compiled = promptCompiler.compilePrompt(
          vectors,
          persona.domain_context || 'general',
          {
            name: persona.name,
            job_title: persona.job_title,
            department: persona.department,
            experience_level: persona.experience_level
          }
        );
        prompt = compiled.system_prompt;
      }
    }
    
    if (!prompt || !vectors) {
      return res.status(400).json({ 
        error: 'Must provide either persona_id or both system_prompt and meta_vectors' 
      });
    }
    
    const validation = await vcpqService.validateVCPQPersona(prompt, vectors);
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Error validating persona:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/chat
 * Chat with a VCPQ persona
 */
router.post('/chat', async (req, res) => {
  try {
    const { persona_id, system_prompt, message, history = [] } = req.body;
    
    let prompt = system_prompt;
    
    // If persona_id provided, fetch and compile prompt
    if (persona_id && !prompt) {
      const result = await db.query(
        'SELECT * FROM personas WHERE id = $1',
        [persona_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Persona not found' });
      }
      
      const persona = result.rows[0];
      const compiled = promptCompiler.compilePrompt(
        persona.personality_vectors,
        persona.domain_context || 'general',
        {
          name: persona.name,
          job_title: persona.job_title,
          department: persona.department,
          experience_level: persona.experience_level
        }
      );
      prompt = compiled.system_prompt;
    }
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Must provide either persona_id or system_prompt' 
      });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await vcpqService.chatWithVCPQPersona(prompt, history, message);
    
    res.json({
      success: true,
      response,
      message_count: history.length + 2
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vcpq/injection-rules
 * Get available prompt injection rules
 */
router.get('/injection-rules', (req, res) => {
  try {
    const rules = promptCompiler.getAvailableRules();
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vcpq/test-rules
 * Test which injection rules would fire for given vectors
 */
router.post('/test-rules', (req, res) => {
  try {
    const { meta_vectors } = req.body;
    
    if (!meta_vectors) {
      return res.status(400).json({ error: 'Missing meta_vectors object' });
    }
    
    const firingRules = promptCompiler.testRules(meta_vectors);
    
    res.json({
      success: true,
      firing_rules: firingRules,
      total_rules: promptCompiler.getAvailableRules().length,
      firing_count: firingRules.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vcpq/vector-labels
 * Get human-readable labels for all meta-vectors
 */
router.get('/vector-labels', (req, res) => {
  try {
    const labels = vectorService.getMetaVectorLabels();
    res.json({
      success: true,
      labels
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
