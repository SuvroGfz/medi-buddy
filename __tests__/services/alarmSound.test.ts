import { playAlarmTone, stopAlarmTone, previewTone } from '../../src/services/alarmSound';
import { Audio } from 'expo-av';

// Mock the require calls for sound files
jest.mock('../../assets/sounds/gentle_chime.wav', () => 'gentle_chime_asset', { virtual: true });
jest.mock('../../assets/sounds/steady_pulse.wav', () => 'steady_pulse_asset', { virtual: true });
jest.mock('../../assets/sounds/bright_alert.wav', () => 'bright_alert_asset', { virtual: true });

describe('Alarm Sound Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('plays a tone with looping enabled', async () => {
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
    await previewTone('steady_pulse');

    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isLooping: false,
        shouldPlay: true,
      })
    );
  });

  it('stops the current sound when playing a new one', async () => {
    await playAlarmTone('gentle_chime');
    const firstSound = (Audio.Sound.createAsync as jest.Mock).mock.results[0].value;
    const sound = (await firstSound).sound;

    await playAlarmTone('bright_alert');

    expect(sound.stopAsync).toHaveBeenCalled();
    expect(sound.unloadAsync).toHaveBeenCalled();
  });

  it('stopAlarmTone does nothing when no sound is playing', async () => {
    // Should not throw
    await expect(stopAlarmTone()).resolves.not.toThrow();
  });
});
