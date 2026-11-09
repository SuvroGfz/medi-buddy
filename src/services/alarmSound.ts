import { AlarmToneKey } from '../types';

const TONE_FILES: Record<AlarmToneKey, any> = {
  gentle_chime: require('../../assets/sounds/gentle_chime.wav'),
  steady_pulse: require('../../assets/sounds/steady_pulse.wav'),
  bright_alert: require('../../assets/sounds/bright_alert.wav'),
};

let currentSound: any = null;

/**
 * Lazily load the expo-av Audio API at call time.
 *
 * We need to avoid two failure modes:
 * 1. Metro statically resolves `require('expo-av')` at bundle time, which
 *    triggers the ExponentAV native module check and crashes in Expo Go.
 * 2. Jest doesn't support dynamic `import()` without --experimental-vm-modules.
 *
 * Solution: use an indirect require via a computed module name. Metro's static
 * analysis only follows literal string arguments to require(), so it does not
 * bundle expo-av eagerly. At runtime the require executes inside a try-catch,
 * so a missing native module is caught gracefully. In Jest the module is mocked
 * and require() resolves to the mock.
 */
function getAudioAPI(): any | null {
  try {
    // Indirect require — Metro cannot statically analyze this,
    // so it won't try to resolve the module at bundle time.
    const moduleName = ['expo', 'av'].join('-');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(moduleName);
    const Audio = mod?.Audio;
    if (Audio?.Sound) return Audio;
    return null;
  } catch {
    return null;
  }
}

/** Play the selected alarm tone in a loop */
export async function playAlarmTone(tone: AlarmToneKey): Promise<void> {
  const Audio = getAudioAPI();
  if (!Audio) return;

  try {
    await stopAlarmTone();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(TONE_FILES[tone], {
      isLooping: true,
      volume: 1.0,
      shouldPlay: true,
    });

    currentSound = sound;
  } catch (e) {
    console.warn('Failed to play alarm tone:', e);
  }
}

/** Stop any currently playing alarm tone */
export async function stopAlarmTone(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (e) {
    console.warn('Failed to stop alarm tone:', e);
  }
}

/** Play a short preview of a tone (for settings) */
export async function previewTone(tone: AlarmToneKey): Promise<void> {
  const Audio = getAudioAPI();
  if (!Audio) return;

  try {
    await stopAlarmTone();

    const { sound } = await Audio.Sound.createAsync(TONE_FILES[tone], {
      isLooping: false,
      volume: 1.0,
      shouldPlay: true,
    });

    currentSound = sound;

    // Stop after 3 seconds
    setTimeout(() => {
      stopAlarmTone();
    }, 3000);
  } catch (e) {
    console.warn('Failed to preview tone:', e);
  }
}
