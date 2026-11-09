import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { MedicationSchedule, Medication, TimePreset, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types';
import { nextOccurrence, addMins } from '../utils/time';
import { updateScheduleNotificationId, getSchedulesForPreset } from '../db/schedules';
import { getPresetById } from '../db/presets';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@medibuddy:notification_settings';

/** Set up the notification handler and channel (call once at app start) */
export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('med-alarm', {
        name: 'Medicine Alarms',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14746F',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    } catch (e) {
      // Notification channels are not fully supported in Expo Go;
      // they work in development/production builds.
      console.warn('Notification channel setup skipped (Expo Go):', (e as Error).message);
    }
  }
}

/** Request notification permissions */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulators may not fully support notifications
    console.warn('Notifications may not work on emulators');
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please enable notifications to receive medicine reminders.',
      [{ text: 'OK' }]
    );
    return false;
  }

  return true;
}

/** Schedule a notification for a medication at a specific time */
export async function scheduleNotification(
  schedule: MedicationSchedule,
  medication: Medication,
  effectiveTime: string,
  presetName?: string
): Promise<string | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  // Cancel existing notification if any
  if (schedule.notificationId) {
    await cancelNotification(schedule.notificationId);
  }

  const trigger = nextOccurrence(effectiveTime);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Time for your medicine!',
      body: presetName
        ? `${medication.name}${medication.dosage ? ` (${medication.dosage})` : ''} — ${presetName}`
        : `${medication.name}${medication.dosage ? ` (${medication.dosage})` : ''}`,
      data: {
        scheduleId: schedule.id,
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime: effectiveTime,
      },
      ...(Platform.OS === 'android' && { channelId: 'med-alarm' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
      ...(Platform.OS === 'android' && { channelId: 'med-alarm' }),
    },
  });

  // Save notification ID to database
  await updateScheduleNotificationId(schedule.id, notificationId);

  return notificationId;
}

/** Cancel a specific notification */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

/** Cancel all notifications for a medication's schedules */
export async function cancelAllForMedication(
  schedules: MedicationSchedule[]
): Promise<void> {
  for (const s of schedules) {
    if (s.notificationId) {
      await cancelNotification(s.notificationId);
      await updateScheduleNotificationId(s.id, null);
    }
  }
}

/** Re-schedule all notifications for a preset (after time change) */
export async function reschedulePresetNotifications(
  presetId: string,
  newTime: string,
  presetName: string
): Promise<void> {
  const schedules = await getSchedulesForPreset(presetId);
  const { getAllMedications } = await import('../db/medications');
  const medications = await getAllMedications();
  const medMap = new Map(medications.map(m => [m.id, m]));

  for (const schedule of schedules) {
    const medication = medMap.get(schedule.medicationId);
    if (!medication || !medication.isActive || !schedule.isActive) continue;

    await scheduleNotification(schedule, medication, newTime, presetName);
  }
}

/** Schedule a snooze notification */
export async function scheduleSnooze(
  medication: Medication,
  scheduleId: string,
  scheduledTime: string,
  minutesFromNow?: number
): Promise<string> {
  const settings = await getNotificationSettings();
  const delay = minutesFromNow ?? settings.snoozeDurationMinutes;
  const trigger = addMins(new Date(), delay);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Snoozed Reminder',
      body: `${medication.name}${medication.dosage ? ` (${medication.dosage})` : ''} — snoozed ${delay}min`,
      data: {
        scheduleId,
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime,
        isSnooze: true,
      },
      ...(Platform.OS === 'android' && { channelId: 'med-alarm' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
      ...(Platform.OS === 'android' && { channelId: 'med-alarm' }),
    },
  });

  return notificationId;
}

/** Get notification settings from AsyncStorage */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(json) };
  } catch {}
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/** Save notification settings */
export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  const current = await getNotificationSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}
