import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrations } from './migrations';
import * as schema from './schema';
import { getOrCreateDbKey } from '@/lib/crypto';

/**
 * DB client.
 *
 * Encryption: on native, when expo-sqlite is built with SQLCipher (custom dev
 * client / EAS build), we issue `PRAGMA key = ...` immediately after open. If
 * SQLCipher isn't present, the PRAGMA is a no-op and the file is plaintext —
 * still protected by the app sandbox + app-lock + Keychain-stored key.
 *
 * On web, expo-sqlite uses wa-sqlite over OPFS/IndexedDB; encryption-at-rest
 * isn't available there, so the PRAGMA is skipped.
 */

const DB_NAME = 'lumen.db';

let _native: SQLite.SQLiteDatabase | null = null;
let _drizzle: ExpoSQLiteDatabase<typeof schema> | null = null;

export async function openDb(): Promise<ExpoSQLiteDatabase<typeof schema>> {
  if (_drizzle) return _drizzle;
  _native = await openWithRetry();

  // Native + SQLCipher: issue PRAGMA key as the very first statement.
  // Order is important — must happen before any other read/write.
  if (Platform.OS !== 'web') {
    try {
      const key = await getOrCreateDbKey();
      // Hex blob form prevents any PBKDF2 transformation on the user-supplied
      // string and uses the raw 32 bytes as the key.
      await _native.execAsync(`PRAGMA key = "x'${key}'";`);
    } catch {
      // SQLCipher not present (vanilla expo-sqlite). PRAGMA is harmless.
    }
  }

  await _native.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  _drizzle = drizzle(_native, { schema });
  await runMigrations();
  return _drizzle;
}

/**
 * On web, OPFS access handles are exclusive — if a previous tab/HMR run still
 * holds one, the open will throw `NoModificationAllowedError`. The handle
 * usually releases within a second, so we retry a few times before giving up.
 */
async function openWithRetry(maxAttempts = 4): Promise<SQLite.SQLiteDatabase> {
  let lastErr: unknown = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await SQLite.openDatabaseAsync(DB_NAME);
    } catch (e) {
      lastErr = e;
      if (!isOpfsLockError(e)) throw e;
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw lastErr;
}

export function isOpfsLockError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes('NoModificationAllowedError') ||
    msg.includes('createSyncAccessHandle') ||
    msg.includes('Access Handles cannot be created') ||
    // wa-sqlite's worker leaves _sqlite3 set but _vfs null after a prior
    // failed init, then trips on this on the next attempt — same family.
    msg.includes('Invalid VFS state') ||
    msg.includes('Failed to initialize AccessHandlePoolVFS')
  );
}

async function runMigrations(): Promise<void> {
  if (!_native) throw new Error('DB not opened');
  await _native.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
  const rows = await _native.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations',
  );
  const applied = new Set(rows.map((r) => r.version));
  for (const m of migrations) {
    if (applied.has(m.version)) continue;
    await _native.withTransactionAsync(async () => {
      // Filter out ADD COLUMN statements for columns that already exist —
      // makes migrations idempotent against a partially-applied state
      // (eg. a previous run crashed mid-migration and we're retrying).
      const sql = await stripExistingAlterAddColumns(m.sql);
      if (sql.trim()) await _native!.execAsync(sql);
      await _native!.runAsync('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)', [
        m.version,
        Date.now(),
      ]);
    });
  }
}

/**
 * Walks through a migration SQL block and removes
 *   ALTER TABLE <t> ADD COLUMN <c> ...;
 * statements where the column already exists on <t>. Other statements pass
 * through untouched. Comparison is case-insensitive on identifiers.
 */
async function stripExistingAlterAddColumns(sql: string): Promise<string> {
  if (!_native) return sql;
  const out: string[] = [];
  // Naive split on semicolons is OK because none of our migrations contain
  // string literals with embedded semicolons.
  const stmts = sql.split(';');
  const tableInfoCache = new Map<string, Set<string>>();
  for (const raw of stmts) {
    const stmt = raw.trim();
    if (!stmt) continue;
    const m = /ALTER\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)\s+ADD\s+COLUMN\s+([A-Za-z_][A-Za-z0-9_]*)/i
      .exec(stmt);
    if (m) {
      const table = m[1].toLowerCase();
      const column = m[2].toLowerCase();
      let cols = tableInfoCache.get(table);
      if (!cols) {
        try {
          const info = await _native.getAllAsync<{ name: string }>(
            `PRAGMA table_info(${m[1]});`,
          );
          cols = new Set(info.map((r) => r.name.toLowerCase()));
        } catch {
          cols = new Set();
        }
        tableInfoCache.set(table, cols);
      }
      if (cols.has(column)) continue; // column already exists, skip
    }
    out.push(stmt + ';');
  }
  return out.join('\n');
}

export async function nukeDb(): Promise<void> {
  if (_native) {
    await _native.closeAsync();
    _native = null;
    _drizzle = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}

export function rawDb(): SQLite.SQLiteDatabase {
  if (!_native) throw new Error('DB not opened');
  return _native;
}
