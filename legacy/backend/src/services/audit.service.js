const { query } = require('../config/database');

/**
 * Create an audit log entry
 */
const log = async ({
  userId,
  companyId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  metadata,
  req,
}) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, old_values, new_values, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId || null,
        companyId || null,
        action,
        entityType || null,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        metadata ? JSON.stringify(metadata) : null,
        req?.ip || null,
        req?.get('user-agent') || null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging shouldn't break the main operation
    console.error('Audit log error:', error);
  }
};

// Predefined action types for consistency
const ACTIONS = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  PASSWORD_CHANGE: 'user.password_change',
  
  // Users
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_INVITE: 'user.invite',
  INVITE_ACCEPT: 'user.invite_accept',
  
  // Companies
  COMPANY_CREATE: 'company.create',
  COMPANY_UPDATE: 'company.update',
  COMPANY_DELETE: 'company.delete',
  
  // Questionnaires
  QUESTIONNAIRE_CREATE: 'questionnaire.create',
  QUESTIONNAIRE_UPDATE: 'questionnaire.update',
  QUESTIONNAIRE_DELETE: 'questionnaire.delete',
  QUESTIONNAIRE_PUBLISH: 'questionnaire.publish',
  QUESTIONNAIRE_CLOSE: 'questionnaire.close',
  RESPONSE_SUBMIT: 'questionnaire.response_submit',
  
  // Personas
  PERSONA_GENERATE: 'persona.generate',
  PERSONA_UPDATE: 'persona.update',
  PERSONA_DELETE: 'persona.delete',
  
  // Conversations
  CONVERSATION_START: 'conversation.start',
  CONVERSATION_SAVE: 'conversation.save',
  MESSAGE_SEND: 'conversation.message',
  
  // Admin
  LICENSE_UPDATE: 'admin.license_update',
  SETTINGS_UPDATE: 'admin.settings_update',
};

/**
 * Get audit logs with filtering and pagination
 */
const getLogs = async ({
  companyId,
  userId,
  action,
  entityType,
  entityId,
  startDate,
  endDate,
  page = 1,
  limit = 50,
}) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (companyId) {
    conditions.push(`company_id = $${paramIndex++}`);
    params.push(companyId);
  }
  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }
  if (action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(action);
  }
  if (entityType) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(entityId);
  }
  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
    params
  );

  const result = await query(
    `SELECT al.*, u.email as user_email, u.first_name, u.last_name
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    logs: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  };
};

module.exports = {
  log,
  getLogs,
  ACTIONS,
};
