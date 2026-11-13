/**
 * Widget data service — provides next-dose information for the home screen widget.
 *
 * This module queries the medications database and returns the data
 * the NextDoseWidget needs. It runs in both the main app and the
 * widget's JavaScript context.
 */

import { getDatabase } from '../db/migrations';

export interface NextDoseData {
  medicationName: string;
  dosage: string;
  scheduledTime: string; // "HH:mm"
  isOverdue: boolean;
}

/**
 * Get the next upcoming dose across all medications.
 * Returns null if no medications or no schedules exist.
 */
export async function getNextDose(): Promise<NextDoseData | null> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0');
    const currentDay = now.getDay(); // 0 = Sunday

    // Find next schedule today that hasn't been taken yet
    const row = await db.getFirstAsync<{
      name: string;
      dosage: string | null;
      time: string;
    }>(
      `SELECT m.name, m.dosage, s.time
       FROM schedules s
       JOIN medications m ON m.id = s.medication_id
       WHERE s.days_of_week LIKE '%' || ? || '%'
         AND s.time >= ?
         AND NOT EXISTS (
           SELECT 1 FROM intake_log il
           WHERE il.schedule_id = s.id
             AND il.action = 'taken'
             AND il.action_at LIKE ? || '%'
         )
       ORDER BY s.time ASC
       LIMIT 1`,
      [
        currentDay.toString(),
        currentTime,
        now.toISOString().split('T')[0],
      ]
    );

    if (!row) return null;

    return {
      medicationName: row.name,
      dosage: row.dosage ?? '',
      scheduledTime: row.time,
      isOverdue: false,
    };
  } catch {
    return null;
  }
}

/**
 * Get counts for widget display.
 */
export async function getWidgetStats(): Promise<{
  todayTotal: number;
  todayTaken: number;
  todayRemaining: number;
}> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentDay = now.getDay();

    const totalRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM schedules
       WHERE days_of_week LIKE '%' || ? || '%'`,
      [currentDay.toString()]
    );

    const takenRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM intake_log
       WHERE action = 'taken'
         AND action_at LIKE ? || '%'`,
      [today]
    );

    const total = totalRow?.count ?? 0;
    const taken = takenRow?.count ?? 0;

    return {
      todayTotal: total,
      todayTaken: taken,
      todayRemaining: Math.max(0, total - taken),
    };
  } catch {
    return { todayTotal: 0, todayTaken: 0, todayRemaining: 0 };
  }
}
