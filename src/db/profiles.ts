import { getDatabase } from './migrations';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

export interface Profile {
  id: string;
  name: string;
  age: number;
  avatarEmoji: string;
  isDefault: boolean;
  createdAt: string;
}

/** Get all profiles ordered by creation date */
export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM profiles ORDER BY created_at ASC'
  );
  return rows.map(mapRowToProfile);
}

/** Get a single profile by ID */
export async function getProfile(id: string): Promise<Profile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM profiles WHERE id = ?',
    id
  );
  return row ? mapRowToProfile(row) : null;
}

/** Create a new profile */
export async function addProfile(
  name: string,
  age: number,
  avatarEmoji = '👤'
): Promise<Profile> {
  const db = await getDatabase();
  const id = generateId();
  const createdAt = nowISO();

  await db.runAsync(
    `INSERT INTO profiles (id, name, age, avatar_emoji, is_default, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    id,
    name,
    age,
    avatarEmoji,
    createdAt
  );

  return {
    id,
    name,
    age,
    avatarEmoji,
    isDefault: false,
    createdAt,
  };
}

/** Update a profile's name, age, or avatar */
export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'age' | 'avatarEmoji'>>
): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.age !== undefined) {
    sets.push('age = ?');
    values.push(updates.age);
  }
  if (updates.avatarEmoji !== undefined) {
    sets.push('avatar_emoji = ?');
    values.push(updates.avatarEmoji);
  }

  if (sets.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`,
    ...values
  );
}

/** Delete a profile (fails if it's the default) */
export async function deleteProfile(id: string): Promise<void> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<any>(
    'SELECT is_default FROM profiles WHERE id = ?',
    id
  );
  if (!row) return;
  if (row.is_default === 1) {
    throw new Error('Cannot delete the default profile');
  }

  // Check for linked medications
  const medRow = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM medications WHERE profile_id = ?',
    id
  );
  if (medRow && medRow.count > 0) {
    throw new Error('Cannot delete a profile with linked medications');
  }

  await db.runAsync('DELETE FROM profiles WHERE id = ?', id);
}

/** Set a profile as the default (clears default from all others) */
export async function setDefaultProfile(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE profiles SET is_default = 0');
  await db.runAsync('UPDATE profiles SET is_default = 1 WHERE id = ?', id);
}

/** Get the default profile */
export async function getDefaultProfile(): Promise<Profile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM profiles WHERE is_default = 1'
  );
  return row ? mapRowToProfile(row) : null;
}

function mapRowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    avatarEmoji: row.avatar_emoji,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
  };
}
