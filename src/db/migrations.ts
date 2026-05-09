/**
 * Hand-written migration SQL.
 *
 * Drizzle Kit can generate these from the schema, but for v1 we keep
 * migrations in code so the app can run them at boot without bundling
 * a separate migration runner. Each entry must be idempotent within a
 * given version (CREATE TABLE IF NOT EXISTS, etc.).
 */

export type Migration = { version: number; sql: string };

export const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS cycles (
        id TEXT PRIMARY KEY NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        predicted INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cycles_start_date ON cycles(start_date);

      CREATE TABLE IF NOT EXISTS days (
        date TEXT PRIMARY KEY NOT NULL,
        cycle_id TEXT,
        flow TEXT,
        notes TEXT,
        mood_tags TEXT,
        symptom_tags TEXT,
        sex_logged INTEGER,
        protection_used INTEGER,
        bbt REAL,
        mucus TEXT,
        custom_json TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_days_cycle ON days(cycle_id);

      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY NOT NULL,
        cycle_id TEXT,
        predicted_start TEXT NOT NULL,
        predicted_end TEXT NOT NULL,
        confidence_low TEXT NOT NULL,
        confidence_high TEXT NOT NULL,
        made_at INTEGER NOT NULL,
        actual_start TEXT,
        error_days INTEGER
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY NOT NULL DEFAULT 'singleton',
        theme_mode TEXT NOT NULL DEFAULT 'system',
        terminology TEXT NOT NULL DEFAULT 'period',
        lock_enabled INTEGER NOT NULL DEFAULT 0,
        fertility_mode TEXT NOT NULL DEFAULT 'off',
        notif_period_soon_days INTEGER,
        notif_late_days INTEGER,
        notif_fertile_window INTEGER NOT NULL DEFAULT 0,
        default_cycle_length INTEGER NOT NULL DEFAULT 28,
        default_period_length INTEGER NOT NULL DEFAULT 5,
        onboarded_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE settings ADD COLUMN life_mode TEXT NOT NULL DEFAULT 'standard';
      ALTER TABLE settings ADD COLUMN pregnancy_start_date TEXT;
      ALTER TABLE settings ADD COLUMN pregnancy_lmp_date TEXT;
      ALTER TABLE settings ADD COLUMN sex_log_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE settings ADD COLUMN quick_bar_config TEXT;
      ALTER TABLE settings ADD COLUMN health_sync_enabled INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        dose TEXT,
        kind TEXT NOT NULL DEFAULT 'other',
        schedule TEXT,
        started_at TEXT,
        stopped_at TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS med_doses (
        id TEXT PRIMARY KEY NOT NULL,
        med_id TEXT NOT NULL,
        taken_at INTEGER NOT NULL,
        skipped INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_med_doses_med_id ON med_doses(med_id);
      CREATE INDEX IF NOT EXISTS idx_med_doses_taken_at ON med_doses(taken_at);
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS voice_memos (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        uri TEXT NOT NULL,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_voice_memos_date ON voice_memos(date);
    `,
  },
];
