import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION, SEED_PRESETS } from './schema';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const instance = await SQLite.openDatabaseAsync('medibuddy.db');

  // Enable WAL mode and foreign keys
  await instance.execAsync('PRAGMA journal_mode = WAL;');
  await instance.execAsync('PRAGMA foreign_keys = ON;');

  // Run schema creation
  await instance.execAsync(CREATE_TABLES);

  // Check and run migrations
  await runMigrations(instance);

  // Only cache after successful init
  db = instance;
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );

  const currentVersion = result?.version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion < 1) {
      await seedDefaultPresets(database);
    }

    // Run dedup regardless — covers both fresh v2 failures and re-runs
    if (currentVersion < 3) {
      await deduplicatePresets(database);
    }

    await database.runAsync(
      'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
      SCHEMA_VERSION
    );
  }
}

async function seedDefaultPresets(database: SQLite.SQLiteDatabase): Promise<void> {
  const now = nowISO();
  for (const preset of SEED_PRESETS) {
    const id = generateId();
    await database.runAsync(
      `INSERT OR IGNORE INTO time_presets (id, name, time, icon, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      preset.name,
      preset.time,
      preset.icon,
      preset.sortOrder,
      now,
      now
    );
  }
}

/** Remove duplicate presets (keep the earliest created row per name) and add UNIQUE constraint */
async function deduplicatePresets(database: SQLite.SQLiteDatabase): Promise<void> {
  // Temporarily disable foreign keys for the table rebuild
  await database.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    // Step 1: Find and delete duplicates — keep the row with the smallest rowid per name
    await database.runAsync(`
      DELETE FROM time_presets
      WHERE rowid NOT IN (
        SELECT MIN(rowid) FROM time_presets GROUP BY name
      )
    `);

    // Step 2: Rebuild table with UNIQUE constraint
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS time_presets_new (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        time        TEXT NOT NULL,
        icon        TEXT NOT NULL DEFAULT '💊',
        sort_order  INTEGER DEFAULT 0,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `);

    await database.execAsync(`
      INSERT OR IGNORE INTO time_presets_new
        SELECT id, name, time, icon, sort_order, created_at, updated_at
        FROM time_presets;
    `);

    await database.execAsync('DROP TABLE IF EXISTS time_presets;');
    await database.execAsync('ALTER TABLE time_presets_new RENAME TO time_presets;');
  } finally {
    await database.execAsync('PRAGMA foreign_keys = ON;');
  }
}

/** Close the database (for testing) */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
