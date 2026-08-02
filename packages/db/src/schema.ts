import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { ATS_PROVIDERS, JOB_STATUSES, TIMEZONE_FITS } from './constants';

export const jobStatusEnum = pgEnum('job_status', JOB_STATUSES);
export const atsProviderEnum = pgEnum('ats_provider', ATS_PROVIDERS);
export const timezoneFitEnum = pgEnum('timezone_fit', TIMEZONE_FITS);

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    company: text('company').notNull(),
    role: text('role').notNull(),
    url: text('url').notNull(),
    source: text('source').notNull(),
    description: text('description').notNull().default(''),

    score: integer('score'),
    verdict: text('verdict'),
    matchedKeywords: jsonb('matched_keywords')
      .$type<string[]>()
      .notNull()
      .default([]),
    missingKeywords: jsonb('missing_keywords')
      .$type<string[]>()
      .notNull()
      .default([]),
    redFlags: jsonb('red_flags').$type<string[]>().notNull().default([]),
    timezoneFit: timezoneFitEnum('timezone_fit'),

    salaryInfo: text('salary_info'),
    locationPolicy: text('location_policy'),

    status: jobStatusEnum('status').notNull().default('new'),

    dateFound: timestamp('date_found', { withTimezone: true })
      .notNull()
      .defaultNow(),
    dateApplied: timestamp('date_applied', { withTimezone: true }),
    followUpDue: timestamp('follow_up_due', { withTimezone: true }),

    notes: text('notes').notNull().default(''),

    /** sha256(normalized company + title) — the dedupe key. */
    contentHash: text('content_hash').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('jobs_url_unique').on(table.url),
    uniqueIndex('jobs_content_hash_unique').on(table.contentHash),
    index('jobs_status_score_idx').on(table.status, table.score),
    index('jobs_date_applied_idx')
      .on(table.dateApplied)
      .where(sql`date_applied IS NOT NULL`),
  ]
);

export const seenHashes = pgTable('seen_hashes', {
  hash: text('hash').primaryKey(),
  firstSeen: timestamp('first_seen', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companies = pgTable('companies', {
  slug: text('slug').primaryKey(),
  ats: atsProviderEnum('ats').notNull(),
  addedFrom: text('added_from').notNull().default('seed'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type SeenHash = typeof seenHashes.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
