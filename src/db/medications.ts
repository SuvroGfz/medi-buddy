import { getDatabase } from './migrations';
import { Medication } from '../types';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

/** Get all medications, optionally filtered by active status */
export async function getAllMedications(activeOnly = false): Promise<Medication[]> {
  const db = await getDatabase();
  const query = activeOnly
    ? 'SELECT * FROM medications WHERE is_active = 1 ORDER BY name ASC'
    : 'SELECT * FROM medications ORDER BY name ASC';
  const rows = await db.getAllAsync<any>(query);
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
  data: Pick<Medication, 'name'> & Partial<Pick<Medication, 'dosage' | 'notes'>>
): Promise<Medication> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO medications (id, name, dosage, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    id,
    data.name,
    data.dosage ?? null,
    data.notes ?? null,
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

/** Search medications by name */
export async function searchMedications(query: string): Promise<Medication[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM medications WHERE name LIKE ? ORDER BY name ASC',
    `%${query}%`
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
