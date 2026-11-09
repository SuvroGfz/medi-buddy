import { getDatabase } from './migrations';
import { IntakeLog } from '../types';
import { generateId } from '../utils/uuid';
import { nowISO, todayISO } from '../utils/time';

/** Log an intake action (taken, skipped, snoozed) */
export async function logIntake(data: {
  scheduleId: string;
  medicationId: string;
  scheduledTime: string;
  action: 'taken' | 'skipped' | 'snoozed';
  notes?: string;
}): Promise<IntakeLog> {
  const db = await getDatabase();
  const id = generateId();
  const actionAt = nowISO();

  await db.runAsync(
    `INSERT INTO intake_log (id, schedule_id, medication_id, scheduled_time, action, action_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.scheduleId,
    data.medicationId,
    data.scheduledTime,
    data.action,
    actionAt,
    data.notes ?? null
  );

  return {
    id,
    scheduleId: data.scheduleId,
    medicationId: data.medicationId,
    scheduledTime: data.scheduledTime,
    action: data.action,
    actionAt,
    notes: data.notes ?? null,
  };
}

/** Get today's intake logs */
export async function getTodayIntakeLogs(): Promise<IntakeLog[]> {
  const db = await getDatabase();
  const today = todayISO();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM intake_log WHERE action_at LIKE ? ORDER BY action_at DESC`,
    `${today}%`
  );
  return rows.map(mapRowToIntakeLog);
}

/** Get the latest action for a specific schedule today */
export async function getTodayActionForSchedule(
  scheduleId: string
): Promise<IntakeLog | null> {
  const db = await getDatabase();
  const today = todayISO();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM intake_log
     WHERE schedule_id = ? AND action_at LIKE ?
     ORDER BY action_at DESC LIMIT 1`,
    scheduleId,
    `${today}%`
  );
  return row ? mapRowToIntakeLog(row) : null;
}

/** Delete intake logs (for testing/reset) */
export async function clearIntakeLogs(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM intake_log');
}

function mapRowToIntakeLog(row: any): IntakeLog {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    medicationId: row.medication_id,
    scheduledTime: row.scheduled_time,
    action: row.action,
    actionAt: row.action_at,
    notes: row.notes,
  };
}
