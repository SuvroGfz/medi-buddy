import * as SQLite from 'expo-sqlite';
import { getAdherenceReport, getOverallAdherence } from '../../src/db/reports';

// Access the mocked database
const mockDb = {
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

// Ensure getDatabase returns our mock
jest.mock('../../src/db/migrations', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }),
}));

// Re-import to get the mocked module
const { getDatabase } = require('../../src/db/migrations');

describe('Report Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns adherence stats grouped by medication', async () => {
    const mockRows = [
      {
        medication_id: 'med-1',
        medication_name: 'Aspirin',
        dosage: '100mg',
        total_scheduled: 10,
        taken: 7,
        skipped: 2,
        snoozed: 1,
      },
      {
        medication_id: 'med-2',
        medication_name: 'Metformin',
        dosage: '500mg',
        total_scheduled: 10,
        taken: 9,
        skipped: 1,
        snoozed: 0,
      },
    ];

    const db = await getDatabase();
    (db.getAllAsync as jest.Mock).mockResolvedValue(mockRows);

    const result = await getAdherenceReport('2024-01-01', '2024-01-31');

    expect(result).toHaveLength(2);
    expect(result[0].medicationId).toBe('med-1');
    expect(result[0].medicationName).toBe('Aspirin');
    expect(result[1].medicationId).toBe('med-2');
    expect(result[1].medicationName).toBe('Metformin');
  });

  it('calculates adherence percentage correctly', async () => {
    const mockRows = [
      {
        medication_id: 'med-1',
        medication_name: 'Aspirin',
        dosage: '100mg',
        total_scheduled: 10,
        taken: 7,
        skipped: 2,
        snoozed: 1,
      },
    ];

    const db = await getDatabase();
    (db.getAllAsync as jest.Mock).mockResolvedValue(mockRows);

    const result = await getAdherenceReport('2024-01-01', '2024-01-31');

    expect(result[0].adherencePercent).toBe(70);
    expect(result[0].taken).toBe(7);
    expect(result[0].totalScheduled).toBe(10);
  });

  it('returns empty array when no logs exist', async () => {
    const db = await getDatabase();
    (db.getAllAsync as jest.Mock).mockResolvedValue([]);

    const result = await getAdherenceReport('2024-01-01', '2024-01-31');

    expect(result).toEqual([]);
  });
});
