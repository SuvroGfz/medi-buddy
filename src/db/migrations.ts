import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION, SEED_PRESETS } from './schema';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('medibuddy.db');

  // Enable WAL mode and foreign keys
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run schema creation
  await db.execAsync(CREATE_TABLES);

  // Check and run migrations
  await runMigrations(db);

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

    if (currentVersion < 2) {
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
  await database.execAsync(`
    -- Keep one row per name
    DELETE FROM time_presets
    WHERE id NOT IN (
      SELECT MIN(id) FROM time_presets GROUP BY name
    );

    -- Rebuild table with UNIQUE on name
    CREATE TABLE IF NOT EXISTS time_presets_new (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      time        TEXT NOT NULL,
      icon        TEXT NOT NULL DEFAULT '💊',
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    INSERT OR IGNORE INTO time_presets_new SELECT * FROM time_presets;
    DROP TABLE time_presets;
    ALTER TABLE time_presets_new RENAME TO time_presets;
  `);
}

/** Close the database (for testing) */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
