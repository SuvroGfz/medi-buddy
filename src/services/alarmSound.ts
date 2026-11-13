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
 * expo-av's ExponentAV.js calls requireNativeModule('ExponentAV') at the
 * MODULE TOP LEVEL. In Expo Go (SDK 53+) this native module is absent, so
 * the mere act of importing expo-av crashes the app.
 *
 * Strategy: First check if the ExponentAV native module is available using
 * requireOptionalNativeModule (which returns null instead of throwing).
 * Only if it exists do we load expo-av via a computed require. The try-catch
 * handles any remaining edge cases.
 */
function getAudioAPI(): any | null {
  try {
    // Check if native module is available (does NOT throw).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core');
    const nativeMod = core.requireOptionalNativeModule('ExponentAV');
    if (!nativeMod) return null; // Not available (Expo Go)

    // Safe to require expo-av — the native module is present.
    // Computed name prevents Metro from eagerly bundling expo-av.
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
