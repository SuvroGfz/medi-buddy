import { generateReportHTML } from '../../src/services/reportGenerator';
import { MedicationAdherence } from '../../src/db/reports';

const sampleMedications: MedicationAdherence[] = [
  {
    medicationId: 'med-1',
    medicationName: 'Aspirin',
    dosage: '100mg',
    totalScheduled: 10,
    taken: 8,
    skipped: 1,
    snoozed: 1,
    adherencePercent: 80,
  },
  {
    medicationId: 'med-2',
    medicationName: 'Metformin',
    dosage: '500mg',
    totalScheduled: 10,
    taken: 9,
    skipped: 1,
    snoozed: 0,
    adherencePercent: 90,
  },
];

describe('Report HTML Generator', () => {
  it('includes patient name and age in HTML', () => {
    const html = generateReportHTML('John Doe', 45, '2024-01-01', '2024-01-31', sampleMedications, 85);

    expect(html).toContain('John Doe');
    expect(html).toContain('45');
  });

  it('includes date range in HTML', () => {
    const html = generateReportHTML('Jane', 30, '2024-01-01', '2024-01-31', sampleMedications, 85);

    expect(html).toContain('2024-01-01');
    expect(html).toContain('2024-01-31');
  });

  it('creates a table row for each medication', () => {
    const html = generateReportHTML('Alice', 28, '2024-01-01', '2024-01-31', sampleMedications, 85);

    expect(html).toContain('Aspirin');
    expect(html).toContain('100mg');
    expect(html).toContain('Metformin');
    expect(html).toContain('500mg');
  });

  it('displays overall adherence percentage', () => {
    const html = generateReportHTML('Bob', 50, '2024-01-01', '2024-01-31', sampleMedications, 85);

    expect(html).toContain('85%');
    expect(html).toContain('Overall Adherence');
  });

  it('handles zero medications gracefully', () => {
    const html = generateReportHTML('Carol', 60, '2024-01-01', '2024-01-31', [], 0);

    expect(html).toContain('Carol');
    expect(html).toContain('No medication data for this period');
    expect(html).toContain('0%');
  });
});
