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

    await database.runAsync(
      'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
      SCHEMA_VERSION
    );
  }
}

async function seedDefaultPresets(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM time_presets'
  );

  if (existing && existing.count > 0) return;

  const now = nowISO();
  for (const preset of SEED_PRESETS) {
    const id = generateId();
    await database.runAsync(
      `INSERT INTO time_presets (id, name, time, icon, sort_order, created_at, updated_at)
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

/** Close the database (for testing) */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
