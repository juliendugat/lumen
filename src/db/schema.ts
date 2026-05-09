import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Lumen schema.
 *
 * Dates are stored as ISO YYYY-MM-DD strings (text). All times are local
 * to the device — Lumen never reasons across timezones, because a "period
 * day" is a personal calendar concept, not a UTC instant.
 *
 * `days` is the source of truth for symptom/mood/flow; `cycles` are
 * derived from period-flow days but cached so we can attach predictions
 * and notes per cycle.
 */

export const cycles = sqliteTable('cycles', {
  id: text('id').primaryKey(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  predicted: integer('predicted', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const days = sqliteTable('days', {
  date: text('date').primaryKey(),
  cycleId: text('cycle_id'),
  flow: text('flow'), // 'spotting' | 'light' | 'medium' | 'heavy' | null
  notes: text('notes'),
  moodTags: text('mood_tags'), // JSON array
  symptomTags: text('symptom_tags'), // JSON array
  sexLogged: integer('sex_logged', { mode: 'boolean' }),
  protectionUsed: integer('protection_used', { mode: 'boolean' }),
  bbt: real('bbt'),
  mucus: text('mucus'),
  customJson: text('custom_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),
  cycleId: text('cycle_id'),
  predictedStart: text('predicted_start').notNull(),
  predictedEnd: text('predicted_end').notNull(),
  confidenceLow: text('confidence_low').notNull(),
  confidenceHigh: text('confidence_high').notNull(),
  madeAt: integer('made_at').notNull(),
  actualStart: text('actual_start'),
  errorDays: integer('error_days'),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('singleton'),
  themeMode: text('theme_mode').notNull().default('system'),
  terminology: text('terminology').notNull().default('period'),
  lockEnabled: integer('lock_enabled', { mode: 'boolean' }).notNull().default(false),
  fertilityMode: text('fertility_mode').notNull().default('off'), // 'off' | 'tracking' | 'avoidance' | 'conception'
  /** Life-cycle mode: 'standard' | 'teen' | 'pregnancy' | 'perimenopause' */
  lifeMode: text('life_mode').notNull().default('standard'),
  /** ISO date when pregnancy mode was enabled — used for weeks-pregnant calc. */
  pregnancyStartDate: text('pregnancy_start_date'),
  /** ISO date — last menstrual period for pregnancy week calc; if absent, falls back to mostRecentCycle. */
  pregnancyLmpDate: text('pregnancy_lmp_date'),
  /** Show sex-and-protection log fields. Off by default for privacy. */
  sexLogEnabled: integer('sex_log_enabled', { mode: 'boolean' }).notNull().default(false),
  /** JSON array of feature ids to show on the quick-bar (default: flow chips). */
  quickBarConfig: text('quick_bar_config'),
  notifPeriodSoonDays: integer('notif_period_soon_days'),
  notifLateDays: integer('notif_late_days'),
  notifFertileWindow: integer('notif_fertile_window', { mode: 'boolean' }).notNull().default(false),
  defaultCycleLength: integer('default_cycle_length').notNull().default(28),
  defaultPeriodLength: integer('default_period_length').notNull().default(5),
  onboardedAt: integer('onboarded_at'),
  /** True after a healthkit/health-connect sync has been authorized at least once. */
  healthSyncEnabled: integer('health_sync_enabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Active medications and contraception. Schedule is JSON like:
 *   { kind: 'daily', times: ['09:00'] }
 *   { kind: 'cycle', activeDays: 21, breakDays: 7, times: ['09:00'] }
 *   { kind: 'asNeeded' }
 */
export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  dose: text('dose'),
  kind: text('kind').notNull().default('other'), // 'pill' | 'patch' | 'iud' | 'implant' | 'other'
  schedule: text('schedule'),
  /** ISO date when started (e.g. IUD insertion). */
  startedAt: text('started_at'),
  /** ISO date when stopped, null when active. */
  stoppedAt: text('stopped_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const voiceMemos = sqliteTable('voice_memos', {
  id: text('id').primaryKey(),
  /** ISO date the memo belongs to (one-to-many: a day can have multiple). */
  date: text('date').notNull(),
  /** File URI on the device (e.g. `file:///.../journal/<id>.m4a`). */
  uri: text('uri').notNull(),
  /** Duration in milliseconds, captured at record-stop. */
  durationMs: integer('duration_ms').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

export const medDoses = sqliteTable('med_doses', {
  id: text('id').primaryKey(),
  medId: text('med_id').notNull(),
  /** ISO datetime ms */
  takenAt: integer('taken_at').notNull(),
  skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
});

export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;
export type Day = typeof days.$inferSelect;
export type NewDay = typeof days.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type Settings = typeof settings.$inferSelect;
