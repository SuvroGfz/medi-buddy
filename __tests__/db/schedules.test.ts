import { groupSchedulesByTime } from '../../src/db/schedules';
import { ScheduleWithDetails } from '../../src/types';

describe('groupSchedulesByTime', () => {
  const makeSchedule = (
    id: string,
    medName: string,
    presetName: string | null,
    presetId: string | null,
    effectiveTime: string
  ): ScheduleWithDetails => ({
    schedule: {
      id,
      medicationId: `med-${id}`,
      timePresetId: presetId,
      customTime: presetId ? null : effectiveTime,
      notificationId: null,
      daysOfWeek: '1,2,3,4,5,6,7',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    medication: {
      id: `med-${id}`,
      name: medName,
      dosage: '500mg',
      notes: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    preset: presetId
      ? {
          id: presetId,
          name: presetName!,
          time: effectiveTime,
          icon: '🌅',
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }
      : null,
    effectiveTime,
  });

  it('groups schedules by preset', () => {
    const schedules = [
      makeSchedule('1', 'Metformin', 'Morning', 'p1', '09:00'),
      makeSchedule('2', 'Amlodipine', 'Morning', 'p1', '09:00'),
      makeSchedule('3', 'Vitamin D', 'Evening', 'p2', '20:00'),
    ];

    const groups = groupSchedulesByTime(schedules);

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('Morning');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].label).toBe('Evening');
    expect(groups[1].items).toHaveLength(1);
  });

  it('groups custom times separately', () => {
    const schedules = [
      makeSchedule('1', 'Med A', null, null, '14:30'),
      makeSchedule('2', 'Med B', null, null, '14:30'),
      makeSchedule('3', 'Med C', null, null, '18:00'),
    ];

    const groups = groupSchedulesByTime(schedules);

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('Custom Time');
    expect(groups[0].time).toBe('14:30');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].time).toBe('18:00');
  });

  it('sorts groups by time', () => {
    const schedules = [
      makeSchedule('1', 'Evening Med', 'Evening', 'p2', '20:00'),
      makeSchedule('2', 'Morning Med', 'Morning', 'p1', '08:00'),
      makeSchedule('3', 'Lunch Med', null, null, '12:30'),
    ];

    const groups = groupSchedulesByTime(schedules);

    expect(groups[0].time).toBe('08:00');
    expect(groups[1].time).toBe('12:30');
    expect(groups[2].time).toBe('20:00');
  });

  it('returns empty array for empty input', () => {
    expect(groupSchedulesByTime([])).toEqual([]);
  });
});
