import { playAlarmTone, stopAlarmTone, previewTone } from '../../src/services/alarmSound';

// Mock the require calls for sound files
jest.mock('../../assets/sounds/gentle_chime.wav', () => 'gentle_chime_asset', { virtual: true });
jest.mock('../../assets/sounds/steady_pulse.wav', () => 'steady_pulse_asset', { virtual: true });
jest.mock('../../assets/sounds/bright_alert.wav', () => 'bright_alert_asset', { virtual: true });

describe('Alarm Sound Service', () => {
  const mockSound = {
    stopAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the expo-av mock for each test
    const { Audio } = require('expo-av');
    Audio.Sound.createAsync.mockResolvedValue({ sound: mockSound });
  });

  it('plays a tone with looping enabled', async () => {
    const { Audio } = require('expo-av');
    await playAlarmTone('gentle_chime');

    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      })
    );

    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isLooping: true,
        shouldPlay: true,
        volume: 1.0,
      })
    );
  });

  it('previews a tone without looping', async () => {
    const { Audio } = require('expo-av');
    await previewTone('steady_pulse');

    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isLooping: false,
        shouldPlay: true,
      })
    );
  });

  it('stopAlarmTone does nothing when no sound is playing', async () => {
    // Should not throw
    await expect(stopAlarmTone()).resolves.not.toThrow();
  });
});
