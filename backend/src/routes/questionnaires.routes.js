const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/database');
const vcpqService = require('../services/vcpq.service');
const vectorService = require('../services/vector.service');
const promptCompiler = require('../services/promptCompiler.service');
const { questionnaireLimiter } = require('../middleware/security');

// Get questionnaire templates (including VCPQ)
router.get('/templates', async (req, res) => {
  try {
    const vcpqQuestions = vcpqService.getVCPQQuestions();
    const templates = [
      {
        id: 'vcpq',
        name: 'VCPQ - Persona Assessment',
        description: 'Vectorizable Corporate Persona Questionnaire - 28 questions across 4 modules (Cognition, Communication, Hierarchy, Operational) to generate accurate AI personas.',
        question_count: 28,
        modules: ['Cognition (8)', 'Communication (8)', 'Hierarchy (6)', 'Operational (6)'],
        questions: vcpqQuestions,
        is_default: true
      }
    ];
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get questionnaire by access code (public endpoint)
router.get('/access/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const questionnaire = await query(
      `SELECT * FROM questionnaires WHERE access_code = $1 AND status = 'active'`,
      [code]
    );
    if (questionnaire.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found or inactive' });
    }
    const q = questionnaire.rows[0];
    
    // Build VCPQ questions
    let questions = [];
    if (!q.template_id) {
      const vcpqQuestions = vcpqService.getVCPQQuestions();
      questions = vcpqQuestions.map(vq => ({
        id: vq.id,
        question: vq.question,
        type: 'likert',
        required: true,
        options: vq.scale.labels,
        category: vq.module
      }));
    }
    
    // Add custom questions
    const customQuestions = typeof q.custom_questions === 'string' 
      ? JSON.parse(q.custom_questions) : (q.custom_questions || []);
    questions = [...questions, ...customQuestions];

    res.json({
      id: q.id,
      name: q.name,
      description: q.description,
      is_anonymous: q.is_anonymous,
      questions: questions,
      status: q.status
    });
  } catch (error) {
    console.error('Error fetching questionnaire by code:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// Get all questionnaires
router.get('/', async (req, res) => {
  try {
    const { companyId, status } = req.query;
    let sql = 'SELECT * FROM questionnaires';
    const params = [];
    const conditions = [];
    if (companyId) { conditions.push(`company_id = $${params.length + 1}`); params.push(companyId); }
    if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
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
    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [id]);
    if (questionnaire.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    const responses = await query(
      'SELECT * FROM questionnaire_responses WHERE questionnaire_id = $1 ORDER BY created_at DESC', [id]
    );
    const q = questionnaire.rows[0];
    let questions = !q.template_id ? vcpqService.getVCPQQuestions() : [];
    const customQuestions = typeof q.custom_questions === 'string' 
      ? JSON.parse(q.custom_questions) : (q.custom_questions || []);
    res.json({ ...q, questions: [...questions, ...customQuestions], responses: responses.rows });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// Get responses for a questionnaire
router.get('/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { processed } = req.query;
    let sql = 'SELECT * FROM questionnaire_responses WHERE questionnaire_id = $1';
    const params = [id];
    if (processed !== undefined) { sql += ' AND processed = $2'; params.push(processed === 'true'); }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Create new questionnaire
router.post('/', async (req, res) => {
  try {
    const { name, description, templateId, customQuestions, isAnonymous, companyId } = req.body;
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const result = await query(
      `INSERT INTO questionnaires (name, description, template_id, custom_questions, is_anonymous, company_id, access_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING *`,
      [name, description || '', templateId === 'vcpq' ? null : null, JSON.stringify(customQuestions || []), isAnonymous || false, companyId, accessCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
});

// Update questionnaire
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, customQuestions, isAnonymous } = req.body;
    const updates = []; const values = []; let paramCount = 1;
    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }
    if (customQuestions !== undefined) { updates.push(`custom_questions = $${paramCount++}`); values.push(JSON.stringify(customQuestions)); }
    if (isAnonymous !== undefined) { updates.push(`is_anonymous = $${paramCount++}`); values.push(isAnonymous); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    const result = await query(`UPDATE questionnaires SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Questionnaire not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({ error: 'Failed to update questionnaire' });
  }
});

// Submit questionnaire response (with rate limiting)
router.post('/:id/responses', questionnaireLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, demographics, respondentInfo } = req.body;
    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [id]);
    if (questionnaire.rows.length === 0) return res.status(404).json({ error: 'Questionnaire not found' });
    if (questionnaire.rows[0].status !== 'active') return res.status(400).json({ error: 'Questionnaire is not accepting responses' });
    
    const result = await query(
      `INSERT INTO questionnaire_responses (questionnaire_id, answers, demographics) VALUES ($1, $2, $3) RETURNING *`,
      [id, JSON.stringify(answers), JSON.stringify(demographics || respondentInfo || {})]
    );
    await query('UPDATE questionnaires SET total_responses = total_responses + 1 WHERE id = $1', [id]);
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
    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [id]);
    if (questionnaire.rows.length === 0) return res.status(404).json({ error: 'Questionnaire not found' });

    const domain = questionnaire.rows[0].domain || 'general';
    const companyId = questionnaire.rows[0].company_id;
    
    const responses = await query(
      `SELECT * FROM questionnaire_responses WHERE questionnaire_id = $1 AND processed = false`, [id]
    );
    if (responses.rows.length === 0) return res.status(400).json({ error: 'No unprocessed responses found' });

    const generatedPersonas = [];

    for (const response of responses.rows) {
      try {
        const answers = typeof response.answers === 'string' ? JSON.parse(response.answers) : response.answers;
        const demographics = typeof response.demographics === 'string' ? JSON.parse(response.demographics) : (response.demographics || {});

        // Extract VCPQ scores (A1-D6)
        const vcpqScores = {};
        for (const key of Object.keys(answers)) {
          if (/^[A-D][1-8]$/.test(key)) {
            vcpqScores[key] = parseInt(answers[key]) || 3;
          }
        }

        if (Object.keys(vcpqScores).length < 6) {
          console.log('Response lacks VCPQ format, skipping:', response.id);
          continue;
        }

        // Step 1: Process vectors using vectorService (V = (S-3)/2)
        const vectorResult = vectorService.processVCPQResponses(vcpqScores);
        console.log(`[VCPQ] Response ${response.id}: Meta-vectors calculated`, vectorResult.meta_vectors);

        // Step 2: Generate persona with prompt compilation
        const vcpqResult = await vcpqService.generateVCPQPersona(vcpqScores, demographics, domain);
        console.log(`[VCPQ] Response ${response.id}: Applied rules:`, vcpqResult.applied_rules);

        // Step 3: Insert persona with questionnaire_id as foreign key
        const personaResult = await query(
          `INSERT INTO personas
           (name, role, department, traits, communication_style, decision_making,
            background, goals, challenges, questionnaire_id, response_id,
            personality_vectors, demographics, vector_profile, company_id, system_prompt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
            id,  // questionnaire_id foreign key
            response.id,  // response_id foreign key
            JSON.stringify(vcpqResult.personality_vectors),
            JSON.stringify(vcpqResult.demographics),
            JSON.stringify({ 
              vcpq_scores: vcpqScores, 
              normalized_scores: vectorResult.normalized_scores,
              meta_vectors: vectorResult.meta_vectors,
              profile: vectorResult.profile,
              domain: domain, 
              applied_rules: vcpqResult.applied_rules
            }),
            companyId,  // company_id for access control
            vcpqResult.system_prompt  // Store compiled prompt
          ]
        );

        generatedPersonas.push(personaResult.rows[0]);
        await query('UPDATE questionnaire_responses SET processed = true WHERE id = $1', [response.id]);
      } catch (personaError) {
        console.error('Error generating persona for response:', response.id, personaError);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedPersonas.length} personas using VCPQ vector analysis`,
      personas: generatedPersonas
    });
  } catch (error) {
    console.error('Error generating personas:', error);
    res.status(500).json({ error: 'Failed to generate personas: ' + error.message });
  }
});

// Delete personas for a questionnaire (preserves raw responses)
router.delete('/:id/personas', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM personas WHERE questionnaire_id = $1 RETURNING id', [id]);
    await query('UPDATE questionnaire_responses SET processed = false WHERE questionnaire_id = $1', [id]);
    res.json({ success: true, message: 'Personas deleted', count: result.rowCount });
  } catch (error) {
    console.error('Error deleting personas:', error);
    res.status(500).json({ error: 'Failed to delete personas' });
  }
});

// Delete questionnaire
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM questionnaire_responses WHERE questionnaire_id = $1', [id]);
    const result = await query('DELETE FROM questionnaires WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Questionnaire not found' });
    res.json({ success: true, message: 'Questionnaire deleted' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
});

module.exports = router;