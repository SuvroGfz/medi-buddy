import {
  AlarmToneKey,
  ALARM_TONES,
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
} from '../../src/types';

describe('Alarm Tone Types', () => {
  it('has exactly three alarm tones', () => {
    const keys = Object.keys(ALARM_TONES) as AlarmToneKey[];
    expect(keys).toHaveLength(3);
    expect(keys).toContain('gentle_chime');
    expect(keys).toContain('steady_pulse');
    expect(keys).toContain('bright_alert');
  });

  it('each tone has a label and icon', () => {
    for (const [key, value] of Object.entries(ALARM_TONES)) {
      expect(value.label).toBeTruthy();
      expect(typeof value.label).toBe('string');
      expect(value.icon).toBeTruthy();
      expect(typeof value.icon).toBe('string');
    }
  });

  it('default settings include alarmTone', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.alarmTone).toBe('gentle_chime');
  });

  it('default settings are a valid NotificationSettings object', () => {
    const s: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
    expect(s.soundEnabled).toBe(true);
    expect(s.vibrationEnabled).toBe(true);
    expect(s.snoozeDurationMinutes).toBe(10);
    expect(s.alarmTone).toBe('gentle_chime');
  });
});
