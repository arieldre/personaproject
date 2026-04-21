import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  jsonb,
  inet,
  customType,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── pgvector custom type ──────────────────────────────────────────────────
// Stores 14-dimension VCPQ personality vectors.
// CRITICAL: <=> returns cosine DISTANCE. Similarity = 1 - distance.
export const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 14})`
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number)
  },
})

// ─── Enums ─────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'company_admin', 'user'])
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'suspended', 'trial'])
export const questionnaireStatusEnum = pgEnum('questionnaire_status', ['draft', 'active', 'closed'])
export const responseStatusEnum = pgEnum('response_status', ['pending', 'in_progress', 'completed'])
export const personaStatusEnum = pgEnum('persona_status', ['generating', 'active', 'archived'])
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'expired', 'revoked'])
export const jobStatusEnum = pgEnum('job_status', ['queued', 'running', 'complete', 'failed'])

// ─── Better Auth tables ────────────────────────────────────────────────────
// Better Auth manages these. We extend `user` with company_id, role, is_active.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Company membership
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Companies ─────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 50 }),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial'),
  licenseCount: integer('license_count').default(5),
  licensesUsed: integer('licenses_used').default(0),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // No Drizzle FK here — circular dep with user. FK enforced in SQL migration.
  createdBy: text('created_by'),
})

// ─── User Invitations ──────────────────────────────────────────────────────

export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').default('user'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: inviteStatusEnum('status').default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Questionnaire Templates ───────────────────────────────────────────────

export const questionnaireTemplates = pgTable('questionnaire_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  questions: jsonb('questions').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by').references(() => user.id),
})

// ─── Questionnaires ────────────────────────────────────────────────────────

export const questionnaires = pgTable('questionnaires', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => questionnaireTemplates.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: questionnaireStatusEnum('status').default('draft'),
  customQuestions: jsonb('custom_questions').default([]),
  accessCode: varchar('access_code', { length: 50 }).unique(),
  isAnonymous: boolean('is_anonymous').default(false),
  domainContext: varchar('domain_context', { length: 100 }).default('General'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  totalResponses: integer('total_responses').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by').references(() => user.id),
})

// ─── Questionnaire Responses ───────────────────────────────────────────────

export const questionnaireResponses = pgTable('questionnaire_responses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  questionnaireId: uuid('questionnaire_id').notNull().references(() => questionnaires.id, { onDelete: 'cascade' }),
  // Null if anonymous
  respondentEmail: varchar('respondent_email', { length: 255 }),
  respondentName: varchar('respondent_name', { length: 255 }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  status: responseStatusEnum('status').default('pending'),
  answers: jsonb('answers').notNull().default({}),
  // 14-dim VCPQ personality vector — pgvector HNSW indexed in Supabase migration SQL
  personalityVector: vector('personality_vector', { dimensions: 14 }),
  rawSurveyScores: jsonb('raw_survey_scores').default({}),
  demographics: jsonb('demographics').default({}),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Personas ──────────────────────────────────────────────────────────────

export const personas = pgTable('personas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  questionnaireId: uuid('questionnaire_id').references(() => questionnaires.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  tagline: varchar('tagline', { length: 500 }),
  status: personaStatusEnum('status').default('generating'),
  summary: jsonb('summary').notNull().default({}),
  extendedProfile: jsonb('extended_profile').notNull().default({}),
  systemPrompt: text('system_prompt'),
  // 14-dim centroid vector for this persona cluster — pgvector HNSW indexed
  personalityVector: vector('personality_vector', { dimensions: 14 }),
  personalityVectors: jsonb('personality_vectors').default({}),
  domainContext: varchar('domain_context', { length: 100 }).default('General'),
  rawSurveyScores: jsonb('raw_survey_scores').default({}),
  vectorVersion: varchar('vector_version', { length: 20 }).default('vcpq-v1'),
  clusterId: integer('cluster_id'),
  clusterSize: integer('cluster_size'),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
})

// ─── Conversations ─────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  personaId: uuid('persona_id').notNull().references(() => personas.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  isSaved: boolean('is_saved').default(false),
  savedBy: text('saved_by').references(() => user.id),
  savedAt: timestamp('saved_at', { withTimezone: true }),
  feedbackRating: integer('feedback_rating'),
  feedbackNotes: text('feedback_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
})

// ─── Messages ──────────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Training Sessions ─────────────────────────────────────────────────────

export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  personaId: uuid('persona_id').notNull().references(() => personas.id, { onDelete: 'cascade' }),
  scenarioId: varchar('scenario_id', { length: 100 }).notNull(),
  messages: jsonb('messages').notNull(),
  gradeResult: jsonb('grade_result'),
  overallScore: integer('overall_score'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Background Jobs ───────────────────────────────────────────────────────
// Tracks Inngest job status for real-time Supabase Realtime updates.

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  inngestRunId: text('inngest_run_id').unique(),
  type: varchar('type', { length: 100 }).notNull(),
  status: jobStatusEnum('status').notNull().default('queued'),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id'),
  entityType: varchar('entity_type', { length: 100 }),
  error: text('error'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata').default({}),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ─────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  company: one(companies, { fields: [user.companyId], references: [companies.id] }),
  sessions: many(session),
  accounts: many(account),
  conversations: many(conversations),
  trainingSessions: many(trainingSessions),
  invitationsSent: many(userInvitations, { relationName: 'invitedBy' }),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(user),
  questionnaires: many(questionnaires),
  personas: many(personas),
  jobs: many(jobs),
}))

export const personasRelations = relations(personas, ({ one, many }) => ({
  company: one(companies, { fields: [personas.companyId], references: [companies.id] }),
  questionnaire: one(questionnaires, { fields: [personas.questionnaireId], references: [questionnaires.id] }),
  conversations: many(conversations),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  persona: one(personas, { fields: [conversations.personaId], references: [personas.id] }),
  user: one(user, { fields: [conversations.userId], references: [user.id] }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}))

// ─── Types ─────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type Persona = typeof personas.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
export type TrainingSession = typeof trainingSessions.$inferSelect
export type Job = typeof jobs.$inferSelect
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect
export type UserInvitation = typeof userInvitations.$inferSelect
