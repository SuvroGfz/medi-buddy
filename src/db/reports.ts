import { getDatabase } from './migrations';

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  dosage: string | null;
  totalScheduled: number;
  taken: number;
  skipped: number;
  snoozed: number;
  adherencePercent: number; // taken / totalScheduled * 100
}

/** Get adherence stats per medication for a date range */
export async function getAdherenceReport(
  startDate: string, // ISO date string YYYY-MM-DD
  endDate: string,
  profileId?: string
): Promise<MedicationAdherence[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<any>(
    `SELECT
       il.medication_id,
       m.name AS medication_name,
       m.dosage,
       COUNT(*) AS total_scheduled,
       SUM(CASE WHEN il.action = 'taken' THEN 1 ELSE 0 END) AS taken,
       SUM(CASE WHEN il.action = 'skipped' THEN 1 ELSE 0 END) AS skipped,
       SUM(CASE WHEN il.action = 'snoozed' THEN 1 ELSE 0 END) AS snoozed
     FROM intake_log il
     JOIN medications m ON m.id = il.medication_id
     WHERE il.action_at >= ? AND il.action_at < ?
     GROUP BY il.medication_id
     ORDER BY m.name ASC`,
    startDate,
    endDate + 'T23:59:59.999'
  );

  return rows.map((row: any) => {
    const total = Number(row.total_scheduled);
    const taken = Number(row.taken);
    return {
      medicationId: row.medication_id,
      medicationName: row.medication_name,
      dosage: row.dosage ?? null,
      totalScheduled: total,
      taken,
      skipped: Number(row.skipped),
      snoozed: Number(row.snoozed),
      adherencePercent: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  });
}

/** Get overall adherence percentage for a date range */
export async function getOverallAdherence(
  startDate: string,
  endDate: string,
  profileId?: string
): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<any>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN action = 'taken' THEN 1 ELSE 0 END) AS taken
     FROM intake_log
     WHERE action_at >= ? AND action_at < ?`,
    startDate,
    endDate + 'T23:59:59.999'
  );

  if (!row || Number(row.total) === 0) return 0;
  return Math.round((Number(row.taken) / Number(row.total)) * 100);
}
