import {
  ALL_DAYS,
  DAY_LABELS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../src/types';

describe('types', () => {
  describe('ALL_DAYS', () => {
    it('contains all 7 days', () => {
      expect(ALL_DAYS).toBe('1,2,3,4,5,6,7');
    });
  });

  describe('DAY_LABELS', () => {
    it('has labels for all 7 days', () => {
      expect(Object.keys(DAY_LABELS)).toHaveLength(7);
      expect(DAY_LABELS['1']).toBe('Mon');
      expect(DAY_LABELS['7']).toBe('Sun');
    });
  });

  describe('DEFAULT_NOTIFICATION_SETTINGS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_NOTIFICATION_SETTINGS.soundEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTINGS.vibrationEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTINGS.snoozeDurationMinutes).toBeGreaterThan(0);
    });
  });
});
