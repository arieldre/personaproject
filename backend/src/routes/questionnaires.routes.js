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

// Generate personas from questionnaire responses using VCPQ + Clustering
router.post('/:id/generate-personas', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxPersonas = 10 } = req.body;

    const questionnaire = await query('SELECT * FROM questionnaires WHERE id = $1', [id]);
    if (questionnaire.rows.length === 0) return res.status(404).json({ error: 'Questionnaire not found' });

    const domain = questionnaire.rows[0].domain || 'general';
    const companyId = questionnaire.rows[0].company_id;

    const responses = await query(
      `SELECT * FROM questionnaire_responses WHERE questionnaire_id = $1 AND processed = false`, [id]
    );
    if (responses.rows.length === 0) return res.status(400).json({ error: 'No unprocessed responses found' });

    console.log(`[Clustering] Processing ${responses.rows.length} responses into max ${maxPersonas} personas`);

    // Step 1: Process all responses into VCPQ vectors
    const processedResponses = [];
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

        const vectorResult = vectorService.processVCPQResponses(vcpqScores);
        processedResponses.push({
          id: response.id,
          vcpqScores,
          demographics,
          vectorResult
        });
      } catch (err) {
        console.error('Error processing response:', response.id, err.message);
      }
    }

    if (processedResponses.length === 0) {
      return res.status(400).json({ error: 'No valid VCPQ responses to process' });
    }

    // Step 2: Cluster responses using k-means
    const clusteringService = require('../services/clustering.service');
    const clusters = clusteringService.clusterResponses(processedResponses, { maxPersonas });

    console.log(`[Clustering] Created ${clusters.length} clusters from ${processedResponses.length} responses`);

    // Step 3: Generate one persona per cluster
    const generatedPersonas = [];
    for (const cluster of clusters) {
      try {
        // Use centroid as the representative meta-vectors
        const centroidVectors = cluster.centroid;

        // Aggregate demographics from cluster members
        const aggregatedDemo = clusteringService.aggregateDemographics(cluster.members);

        // Average the VCPQ scores from cluster members
        const avgScores = {};
        const scoreKeys = Object.keys(cluster.members[0].vcpqScores);
        for (const key of scoreKeys) {
          const sum = cluster.members.reduce((acc, m) => acc + (m.vcpqScores[key] || 3), 0);
          avgScores[key] = Math.round(sum / cluster.members.length);
        }

        // Generate persona using averaged scores
        const vcpqResult = await vcpqService.generateVCPQPersona(avgScores, aggregatedDemo, domain);

        // Build summary
        const summary = {
          demographics: vcpqResult.demographics || aggregatedDemo,
          communication_style: {
            preferred: vcpqResult.communication_style || 'balanced',
            traits: vcpqResult.traits || []
          },
          values: vcpqResult.goals || [],
          pain_points: vcpqResult.challenges || [],
          motivations: vcpqResult.goals || [],
          key_traits: vcpqResult.traits || [],
          cluster_info: {
            size: cluster.size,
            member_ids: cluster.members.map(m => m.id)
          }
        };

        const extendedProfile = {
          background_story: vcpqResult.background || '',
          detailed_preferences: centroidVectors,
          behavioral_patterns: vcpqResult.applied_rules || [],
          conversation_guidelines: vcpqResult.decision_making || '',
          vcpq_domain: domain,
          vector_profile: {
            centroid_vectors: centroidVectors,
            avg_scores: avgScores,
            applied_rules: vcpqResult.applied_rules
          }
        };

        const role = aggregatedDemo.role || aggregatedDemo.job_title || 'Team Member';
        const dept = aggregatedDemo.department || 'General';
        const tagline = `${role} - ${dept} (${cluster.size} similar responses)`;

        const personaResult = await query(
          `INSERT INTO personas
           (company_id, questionnaire_id, name, tagline, status, summary, extended_profile, 
            system_prompt, personality_vectors, raw_survey_scores, domain_context, 
            cluster_size, generated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           RETURNING *`,
          [
            companyId,
            id,
            vcpqResult.name,
            tagline,
            'active',
            JSON.stringify(summary),
            JSON.stringify(extendedProfile),
            vcpqResult.system_prompt,
            JSON.stringify(centroidVectors),
            JSON.stringify(avgScores),
            domain,
            cluster.size
          ]
        );

        generatedPersonas.push(personaResult.rows[0]);

        // Mark all cluster members as processed
        for (const member of cluster.members) {
          await query('UPDATE questionnaire_responses SET processed = true WHERE id = $1', [member.id]);
        }

        console.log(`[Clustering] Created persona "${vcpqResult.name}" from cluster of ${cluster.size} responses`);
      } catch (personaError) {
        console.error('Error generating clustered persona:', personaError);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedPersonas.length} personas from ${processedResponses.length} responses using clustering`,
      personas: generatedPersonas,
      clustering: {
        total_responses: processedResponses.length,
        clusters_created: clusters.length,
        cluster_sizes: clusters.map(c => c.size)
      }
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