import { getDatabase } from './migrations';
import { MedicationSchedule, ScheduleWithDetails, TimeGroup } from '../types';
import { generateId } from '../utils/uuid';
import { nowISO, compareTimes } from '../utils/time';

/** Get all schedules for a medication */
export async function getSchedulesForMedication(
  medicationId: string
): Promise<MedicationSchedule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM medication_schedules WHERE medication_id = ? ORDER BY created_at ASC',
    medicationId
  );
  return rows.map(mapRowToSchedule);
}

/** Get all schedules linked to a preset */
export async function getSchedulesForPreset(
  presetId: string
): Promise<MedicationSchedule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM medication_schedules WHERE time_preset_id = ?',
    presetId
  );
  return rows.map(mapRowToSchedule);
}

/** Create a schedule linking a medication to a preset or custom time */
export async function createSchedule(data: {
  medicationId: string;
  timePresetId?: string;
  customTime?: string;
  daysOfWeek?: string;
}): Promise<MedicationSchedule> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO medication_schedules
      (id, medication_id, time_preset_id, custom_time, days_of_week, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    data.medicationId,
    data.timePresetId ?? null,
    data.customTime ?? null,
    data.daysOfWeek ?? '1,2,3,4,5,6,7',
    now,
    now
  );

  return {
    id,
    medicationId: data.medicationId,
    timePresetId: data.timePresetId ?? null,
    customTime: data.customTime ?? null,
    notificationId: null,
    daysOfWeek: data.daysOfWeek ?? '1,2,3,4,5,6,7',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Update a schedule's notification ID */
export async function updateScheduleNotificationId(
  id: string,
  notificationId: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE medication_schedules SET notification_id = ?, updated_at = ? WHERE id = ?',
    notificationId,
    nowISO(),
    id
  );
}

/** Delete a schedule */
export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medication_schedules WHERE id = ?', id);
}

/** Get all active schedules with joined medication + preset details, grouped by time */
export async function getTodaySchedules(): Promise<ScheduleWithDetails[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`
    SELECT
      ms.*,
      m.name as med_name, m.dosage as med_dosage, m.notes as med_notes,
      m.is_active as med_is_active, m.created_at as med_created_at, m.updated_at as med_updated_at,
      tp.name as preset_name, tp.time as preset_time, tp.icon as preset_icon,
      tp.sort_order as preset_sort_order, tp.created_at as preset_created_at, tp.updated_at as preset_updated_at
    FROM medication_schedules ms
    JOIN medications m ON ms.medication_id = m.id
    LEFT JOIN time_presets tp ON ms.time_preset_id = tp.id
    WHERE ms.is_active = 1 AND m.is_active = 1
    ORDER BY COALESCE(tp.time, ms.custom_time) ASC, m.name ASC
  `);

  return rows.map((row: any): ScheduleWithDetails => ({
    schedule: mapRowToSchedule(row),
    medication: {
      id: row.medication_id,
      name: row.med_name,
      dosage: row.med_dosage,
      notes: row.med_notes,
      isActive: row.med_is_active === 1,
      createdAt: row.med_created_at,
      updatedAt: row.med_updated_at,
    },
    preset: row.preset_name
      ? {
          id: row.time_preset_id,
          name: row.preset_name,
          time: row.preset_time,
          icon: row.preset_icon,
          sortOrder: row.preset_sort_order,
          createdAt: row.preset_created_at,
          updatedAt: row.preset_updated_at,
        }
      : null,
    effectiveTime: row.preset_time ?? row.custom_time,
  }));
}

/** Group schedules into TimeGroups for the Today screen */
export function groupSchedulesByTime(
  schedules: ScheduleWithDetails[]
): TimeGroup[] {
  const map = new Map<string, TimeGroup>();

  for (const s of schedules) {
    const key = s.preset
      ? `preset:${s.preset.id}`
      : `custom:${s.effectiveTime}`;

    if (!map.has(key)) {
      map.set(key, {
        label: s.preset?.name ?? 'Custom Time',
        icon: s.preset?.icon ?? '⏰',
        time: s.effectiveTime,
        items: [],
      });
    }
    map.get(key)!.items.push(s);
  }

  const groups = Array.from(map.values());
  groups.sort((a, b) => compareTimes(a.time, b.time));
  return groups;
}

function mapRowToSchedule(row: any): MedicationSchedule {
  return {
    id: row.id,
    medicationId: row.medication_id,
    timePresetId: row.time_preset_id,
    customTime: row.custom_time,
    notificationId: row.notification_id,
    daysOfWeek: row.days_of_week,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
