/** SQLite schema definitions and migrations for MediBuddy */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS time_presets (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  time        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '💊',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  dosage      TEXT,
  notes       TEXT,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  id                TEXT PRIMARY KEY,
  medication_id     TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time_preset_id    TEXT REFERENCES time_presets(id) ON DELETE SET NULL,
  custom_time       TEXT,
  notification_id   TEXT,
  days_of_week      TEXT DEFAULT '1,2,3,4,5,6,7',
  is_active         INTEGER DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intake_log (
  id              TEXT PRIMARY KEY,
  schedule_id     TEXT NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  medication_id   TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time  TEXT NOT NULL,
  action          TEXT NOT NULL,
  action_at       TEXT NOT NULL,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);
`;

export const SEED_PRESETS = [
  { name: 'Before Morning Meal', time: '08:00', icon: '🌅', sortOrder: 0 },
  { name: 'After Morning Meal', time: '09:00', icon: '🌞', sortOrder: 1 },
  { name: 'Before Lunch', time: '12:30', icon: '☀️', sortOrder: 2 },
  { name: 'After Lunch', time: '13:30', icon: '🌤️', sortOrder: 3 },
  { name: 'Before Dinner', time: '19:00', icon: '🌆', sortOrder: 4 },
  { name: 'After Dinner', time: '20:00', icon: '🌙', sortOrder: 5 },
  { name: 'Bedtime', time: '22:00', icon: '😴', sortOrder: 6 },
];
