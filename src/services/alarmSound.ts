import { Audio } from 'expo-av';
import { AlarmToneKey } from '../types';

const TONE_FILES: Record<AlarmToneKey, ReturnType<typeof require>> = {
  gentle_chime: require('../../assets/sounds/gentle_chime.wav'),
  steady_pulse: require('../../assets/sounds/steady_pulse.wav'),
  bright_alert: require('../../assets/sounds/bright_alert.wav'),
};

let currentSound: Audio.Sound | null = null;

/** Play the selected alarm tone in a loop */
export async function playAlarmTone(tone: AlarmToneKey): Promise<void> {
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
