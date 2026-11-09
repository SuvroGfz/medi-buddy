import { AlarmToneKey } from '../types';
import { Platform } from 'react-native';

const TONE_FILES: Record<AlarmToneKey, any> = {
  gentle_chime: require('../../assets/sounds/gentle_chime.wav'),
  steady_pulse: require('../../assets/sounds/steady_pulse.wav'),
  bright_alert: require('../../assets/sounds/bright_alert.wav'),
};

let currentSound: any = null;

/** Safely get the Audio API — returns null if expo-av native module is missing (Expo Go) */
function getAudioAPI(): { Sound: any; setAudioModeAsync: any } | null {
  try {
    // This will throw if the ExponentAV native module is not available
    const { Audio } = require('expo-av');
    // Trigger native module resolution by accessing a property
    if (Audio && Audio.Sound) return Audio;
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
