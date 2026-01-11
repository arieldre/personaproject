const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const vcpqService = require('../services/vcpq.service');
const { questionnaireLimiter } = require('../middleware/security');

// Get all questionnaires
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM questionnaires ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaires' });
  }
});

// Get single questionnaire with responses
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const questionnaire = await query(
      'SELECT * FROM questionnaires WHERE id = $1',
      [id]
    );
    
    if (questionnaire.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    const responses = await query(
      'SELECT * FROM questionnaire_responses WHERE questionnaire_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json({
      ...questionnaire.rows[0],
      responses: responses.rows
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// Create new questionnaire
router.post('/', async (req, res) => {
  try {
    const { title, description, questions, domain } = req.body;
    
    const result = await query(
      `INSERT INTO questionnaires (title, description, questions, domain) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, description, JSON.stringify(questions), domain || 'general']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
});

// Submit questionnaire response (with rate limiting)
router.post('/:id/responses', questionnaireLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, demographics } = req.body;
    
    // Verify questionnaire exists
    const questionnaire = await query(
      'SELECT * FROM questionnaires WHERE id = $1',
      [id]
    );
    
    if (questionnaire.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Store the response
    const result = await query(
      `INSERT INTO questionnaire_responses (questionnaire_id, answers, demographics) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [id, JSON.stringify(answers), JSON.stringify(demographics || {})]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Generate personas from questionnaire responses using VCPQ
router.post('/:id/generate-personas', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get questionnaire with domain info
    const questionnaire = await query(
      'SELECT * FROM questionnaires WHERE id = $1',
      [id]
    );
    
    if (questionnaire.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    const domain = questionnaire.rows[0].domain || 'general';
    
    // Get all unprocessed responses
    const responses = await query(
      `SELECT * FROM questionnaire_responses 
       WHERE questionnaire_id = $1 AND processed = false`,
      [id]
    );
    
    if (responses.rows.length === 0) {
      return res.status(400).json({ error: 'No unprocessed responses found' });
    }
    
    const generatedPersonas = [];
    
    // Process each response individually using VCPQ
    for (const response of responses.rows) {
      try {
        // Parse answers and demographics
        const answers = typeof response.answers === 'string' 
          ? JSON.parse(response.answers) 
          : response.answers;
        
        const demographics = typeof response.demographics === 'string'
          ? JSON.parse(response.demographics)
          : (response.demographics || {});
        
        // Extract VCPQ scores (A1-D6) from answers
        const vcpqScores = {};
        for (const key of Object.keys(answers)) {
          // Match VCPQ question format: A1, A2, B1, B2, C1, C2, D1, D2, etc.
          if (/^[A-D][1-6]$/.test(key)) {
            vcpqScores[key] = parseInt(answers[key]) || 3;
          }
        }
        
        // Check if we have VCPQ format responses
        const hasVCPQFormat = Object.keys(vcpqScores).length >= 6;
        
        if (!hasVCPQFormat) {
          console.log('Response does not have VCPQ format, skipping:', response.id);
          continue;
        }
        
        // Generate persona using VCPQ service
        const vcpqResult = await vcpqService.generateVCPQPersona(vcpqScores, demographics, domain);
        
        // Save persona to database with VCPQ fields
        const personaResult = await query(
          `INSERT INTO personas 
           (name, role, department, traits, communication_style, decision_making, 
            background, goals, challenges, questionnaire_id, response_id,
            personality_vectors, demographics, vector_profile) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
           RETURNING *`,
          [
            vcpqResult.name,
            demographics.role || 'Team Member',
            demographics.department || 'General',
            JSON.stringify(vcpqResult.traits || []),
            vcpqResult.communication_style || '',
            vcpqResult.decision_making || '',
            vcpqResult.background || '',
            JSON.stringify(vcpqResult.goals || []),
            JSON.stringify(vcpqResult.challenges || []),
            id,
            response.id,
            JSON.stringify(vcpqResult.personality_vectors),
            JSON.stringify(vcpqResult.demographics),
            JSON.stringify({
              vcpq_scores: vcpqScores,
              domain: domain,
              system_prompt: vcpqResult.system_prompt
            })
          ]
        );
        
        generatedPersonas.push(personaResult.rows[0]);
        
        // Mark response as processed
        await query(
          'UPDATE questionnaire_responses SET processed = true WHERE id = $1',
          [response.id]
        );
        
      } catch (personaError) {
        console.error('Error generating persona for response:', response.id, personaError);
      }
    }
    
    res.json({
      success: true,
      message: `Generated ${generatedPersonas.length} personas using VCPQ analysis`,
      personas: generatedPersonas
    });
    
  } catch (error) {
    console.error('Error generating personas:', error);
    res.status(500).json({ error: 'Failed to generate personas: ' + error.message });
  }
});

// Delete questionnaire
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated responses first
    await query('DELETE FROM questionnaire_responses WHERE questionnaire_id = $1', [id]);
    
    // Delete questionnaire
    const result = await query(
      'DELETE FROM questionnaires WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    res.json({ success: true, message: 'Questionnaire deleted' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
});

// Get VCPQ questions for building questionnaires
router.get('/vcpq/questions', async (req, res) => {
  try {
    const questions = vcpqService.getVCPQQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching VCPQ questions:', error);
    res.status(500).json({ error: 'Failed to fetch VCPQ questions' });
  }
});

// Get available domains
router.get('/vcpq/domains', async (req, res) => {
  try {
    const domains = vcpqService.getAvailableDomains();
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

module.exports = router;
