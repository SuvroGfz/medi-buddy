import {
  getDeviceTimezone,
  getTimezoneOffset,
  getOffsetDifference,
  adjustTime,
  hasTimezoneChanged,
} from '../../src/services/timezone';

describe('Timezone Service', () => {
  it('getDeviceTimezone returns a non-empty string', () => {
    const tz = getDeviceTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('getOffsetDifference returns 0 for same timezone', () => {
    const diff = getOffsetDifference('America/New_York', 'America/New_York');
    expect(diff).toBe(0);
  });

  it('getOffsetDifference returns correct difference (Asia/Dhaka vs UTC = 360)', () => {
    // Asia/Dhaka is UTC+6 = 360 minutes ahead of UTC
    const diff = getOffsetDifference('UTC', 'Asia/Dhaka');
    expect(diff).toBe(360);
  });

  it('adjustTime adds positive offset correctly (09:00 + 60 = 10:00)', () => {
    const result = adjustTime('09:00', 60);
    expect(result).toEqual({ time: '10:00', dayShift: 0 });
  });

  it('adjustTime subtracts negative offset correctly (09:00 - 60 = 08:00)', () => {
    const result = adjustTime('09:00', -60);
    expect(result).toEqual({ time: '08:00', dayShift: 0 });
  });

  it('adjustTime wraps forward past midnight (23:00 + 180 = 02:00, dayShift +1)', () => {
    const result = adjustTime('23:00', 180);
    expect(result).toEqual({ time: '02:00', dayShift: 1 });
  });

  it('adjustTime wraps backward past midnight (01:00 - 180 = 22:00, dayShift -1)', () => {
    const result = adjustTime('01:00', -180);
    expect(result).toEqual({ time: '22:00', dayShift: -1 });
  });

  it('hasTimezoneChanged returns false when timezone matches', () => {
    const deviceTz = getDeviceTimezone();
    expect(hasTimezoneChanged(deviceTz)).toBe(false);
  });
});
