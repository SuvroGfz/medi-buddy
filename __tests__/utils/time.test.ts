import {
  formatTime,
  compareTimes,
  hasTimePassed,
  todayDayOfWeek,
  isTodayScheduled,
  nowTime,
  todayISO,
  nowISO,
} from '../../src/utils/time';

describe('time utils', () => {
  describe('formatTime', () => {
    it('formats 24h time to 12h display', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('23:59')).toBe('11:59 PM');
    });
  });

  describe('compareTimes', () => {
    it('returns -1 when a < b', () => {
      expect(compareTimes('08:00', '09:00')).toBe(-1);
      expect(compareTimes('08:00', '08:30')).toBe(-1);
    });

    it('returns 0 when equal', () => {
      expect(compareTimes('09:00', '09:00')).toBe(0);
    });

    it('returns 1 when a > b', () => {
      expect(compareTimes('10:00', '09:00')).toBe(1);
      expect(compareTimes('09:30', '09:00')).toBe(1);
    });
  });

  describe('todayDayOfWeek', () => {
    it('returns a number 1-7', () => {
      const day = todayDayOfWeek();
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(7);
    });
  });

  describe('isTodayScheduled', () => {
    it('returns true when today is in the CSV', () => {
      const today = todayDayOfWeek().toString();
      expect(isTodayScheduled(today)).toBe(true);
      expect(isTodayScheduled('1,2,3,4,5,6,7')).toBe(true);
    });

    it('returns false when today is not in the CSV', () => {
      // Pick a day that is NOT today
      const today = todayDayOfWeek();
      const notToday = today === 7 ? '1' : (today + 1).toString();
      expect(isTodayScheduled(notToday)).toBe(false);
    });
  });

  describe('nowTime', () => {
    it('returns current time in HH:mm format', () => {
      const time = nowTime();
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('todayISO', () => {
    it('returns today in yyyy-MM-dd format', () => {
      const iso = todayISO();
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('nowISO', () => {
    it('returns an ISO 8601 timestamp', () => {
      const iso = nowISO();
      expect(() => new Date(iso)).not.toThrow();
      expect(new Date(iso).toISOString()).toBe(iso);
    });
  });
});
