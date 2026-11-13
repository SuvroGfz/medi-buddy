import { getDatabase } from './migrations';
import { Medication } from '../types';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

/** Get all medications, optionally filtered by active status and/or profile */
export async function getAllMedications(
  activeOnly = false,
  profileId?: string
): Promise<Medication[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: any[] = [];

  if (activeOnly) {
    conditions.push('is_active = 1');
  }
  if (profileId) {
    conditions.push('profile_id = ?');
    params.push(profileId);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM medications${where} ORDER BY name ASC`,
    ...params
  );
  return rows.map(mapRowToMedication);
}

/** Get a single medication by ID */
export async function getMedicationById(id: string): Promise<Medication | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM medications WHERE id = ?',
    id
  );
  return row ? mapRowToMedication(row) : null;
}

/** Create a new medication */
export async function createMedication(
  data: Pick<Medication, 'name'> & Partial<Pick<Medication, 'dosage' | 'notes'>> & { profileId?: string }
): Promise<Medication> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO medications (id, name, dosage, notes, profile_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    data.name,
    data.dosage ?? null,
    data.notes ?? null,
    data.profileId ?? null,
    now,
    now
  );

  return {
    id,
    name: data.name,
    dosage: data.dosage ?? null,
    notes: data.notes ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Update a medication */
export async function updateMedication(
  id: string,
  data: Partial<Pick<Medication, 'name' | 'dosage' | 'notes' | 'isActive'>>
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.name !== undefined) {
    sets.push('name = ?');
    values.push(data.name);
  }
  if (data.dosage !== undefined) {
    sets.push('dosage = ?');
    values.push(data.dosage);
  }
  if (data.notes !== undefined) {
    sets.push('notes = ?');
    values.push(data.notes);
  }
  if (data.isActive !== undefined) {
    sets.push('is_active = ?');
    values.push(data.isActive ? 1 : 0);
  }

  values.push(id);
  await db.runAsync(
    `UPDATE medications SET ${sets.join(', ')} WHERE id = ?`,
    ...values
  );
}

/** Delete a medication and its schedules (cascade) */
export async function deleteMedication(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medications WHERE id = ?', id);
}

/** Search medications by name, optionally filtered by profile */
export async function searchMedications(
  query: string,
  profileId?: string
): Promise<Medication[]> {
  const db = await getDatabase();
  const conditions = ['name LIKE ?'];
  const params: any[] = [`%${query}%`];

  if (profileId) {
    conditions.push('profile_id = ?');
    params.push(profileId);
  }

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM medications WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    ...params
  );
  return rows.map(mapRowToMedication);
}

function mapRowToMedication(row: any): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
