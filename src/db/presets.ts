import { getDatabase } from './migrations';
import { TimePreset } from '../types';
import { generateId } from '../utils/uuid';
import { nowISO } from '../utils/time';

/** Get all time presets, sorted by sort_order */
export async function getAllPresets(): Promise<TimePreset[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM time_presets ORDER BY sort_order ASC'
  );
  return rows.map(mapRowToPreset);
}

/** Get a single preset by ID */
export async function getPresetById(id: string): Promise<TimePreset | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM time_presets WHERE id = ?',
    id
  );
  return row ? mapRowToPreset(row) : null;
}

/** Create a new time preset */
export async function createPreset(
  data: Pick<TimePreset, 'name' | 'time' | 'icon'> & { sortOrder?: number }
): Promise<TimePreset> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();
  const sortOrder = data.sortOrder ?? 99;

  await db.runAsync(
    `INSERT INTO time_presets (id, name, time, icon, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.time,
    data.icon,
    sortOrder,
    now,
    now
  );

  return {
    id,
    name: data.name,
    time: data.time,
    icon: data.icon,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

/** Update a time preset */
export async function updatePreset(
  id: string,
  data: Partial<Pick<TimePreset, 'name' | 'time' | 'icon' | 'sortOrder'>>
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.name !== undefined) {
    sets.push('name = ?');
    values.push(data.name);
  }
  if (data.time !== undefined) {
    sets.push('time = ?');
    values.push(data.time);
  }
  if (data.icon !== undefined) {
    sets.push('icon = ?');
    values.push(data.icon);
  }
  if (data.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    values.push(data.sortOrder);
  }

  values.push(id);
  await db.runAsync(
    `UPDATE time_presets SET ${sets.join(', ')} WHERE id = ?`,
    ...values
  );
}

/** Delete a time preset */
export async function deletePreset(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM time_presets WHERE id = ?', id);
}

/** Count medications linked to a preset */
export async function countMedicationsForPreset(id: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM medication_schedules WHERE time_preset_id = ?',
    id
  );
  return result?.count ?? 0;
}

function mapRowToPreset(row: any): TimePreset {
  return {
    id: row.id,
    name: row.name,
    time: row.time,
    icon: row.icon,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
