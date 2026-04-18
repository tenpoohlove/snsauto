import { pgTable, uuid, text, boolean, timestamp, integer, real } from 'drizzle-orm/pg-core'

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  platform: text('platform', { enum: ['instagram', 'facebook'] }).notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accessToken: text('access_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const researchSessions = pgTable('research_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  topic: text('topic').notNull(),
  benefitType: text('benefit_type').notNull(),
  researchResult: text('research_result'),
  confidenceScore: real('confidence_score'),
  sources: text('sources').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const postContents = pgTable('post_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => researchSessions.id),
  userId: text('user_id').notNull(),
  platform: text('platform', { enum: ['instagram', 'facebook'] }).notNull(),
  caption: text('caption').notNull(),
  hashtags: text('hashtags').array(),
  imageUrl: text('image_url'),
  status: text('status', { enum: ['draft', 'approved', 'scheduled', 'published', 'failed'] }).default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const scheduledPosts = pgTable('scheduled_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  postContentId: uuid('post_content_id').references(() => postContents.id).notNull(),
  socialAccountId: uuid('social_account_id').references(() => socialAccounts.id).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  metaContainerId: text('meta_container_id'),
  metaPostId: text('meta_post_id'),
  jobId: text('job_id'),
  status: text('status', { enum: ['pending', 'processing', 'published', 'failed'] }).default('pending'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
