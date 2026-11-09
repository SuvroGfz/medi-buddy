import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Vibration,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { Button } from '../src/components';
import { playAlarmTone, stopAlarmTone } from '../src/services/alarmSound';
import { getNotificationSettings } from '../src/services/notifications';
import { scheduleSnooze } from '../src/services/notifications';
import { logIntake } from '../src/db/intake';
import { formatTime } from '../src/utils/time';

export default function AlarmScreen() {
  const params = useLocalSearchParams<{
    scheduleId: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    presetName: string;
  }>();

  const {
    scheduleId = '',
    medicationId = '',
    medicationName = 'Medication',
    dosage = '',
    scheduledTime = '',
    presetName = '',
  } = params;

  useEffect(() => {
    let vibrationInterval: ReturnType<typeof setInterval> | null = null;

    async function startAlarm() {
      const settings = await getNotificationSettings();

      if (settings.soundEnabled) {
        await playAlarmTone(settings.alarmTone);
      }

      if (settings.vibrationEnabled && Platform.OS !== 'web') {
        vibrationInterval = setInterval(() => {
          Vibration.vibrate([0, 500, 300, 500]);
        }, 2500);
      }
    }

    startAlarm();

    return () => {
      stopAlarmTone();
      if (vibrationInterval) clearInterval(vibrationInterval);
      if (Platform.OS !== 'web') Vibration.cancel();
    };
  }, []);

  const dismiss = useCallback(async () => {
    await stopAlarmTone();
    if (Platform.OS !== 'web') Vibration.cancel();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  const handleTake = useCallback(async () => {
    try {
      if (scheduleId && medicationId) {
        await logIntake({
          scheduleId,
          medicationId,
          scheduledTime,
          action: 'taken',
        });
      }
    } catch (e) {
      console.warn('Failed to log intake:', e);
    }
    await dismiss();
  }, [scheduleId, medicationId, scheduledTime, dismiss]);

  const handleSnooze = useCallback(async () => {
    try {
      if (scheduleId && medicationId) {
        const settings = await getNotificationSettings();
        await scheduleSnooze(
          { id: medicationId, name: medicationName, dosage, notes: null, isActive: true, createdAt: '', updatedAt: '' },
          scheduleId,
          scheduledTime,
          settings.snoozeDurationMinutes
        );
        await logIntake({
          scheduleId,
          medicationId,
          scheduledTime,
          action: 'snoozed',
        });
      }
    } catch (e) {
      console.warn('Failed to snooze:', e);
    }
    await dismiss();
  }, [scheduleId, medicationId, medicationName, dosage, scheduledTime, dismiss]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Pill icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconEmoji}>💊</Text>
      </View>

      {/* Header */}
      <Text style={styles.title}>Time for your medicine!</Text>

      {/* Medication info */}
      <View style={styles.infoCard}>
        <Text style={styles.medName}>{medicationName}</Text>
        {dosage ? <Text style={styles.medDosage}>{dosage}</Text> : null}
        {presetName ? (
          <Text style={styles.presetLabel}>{presetName}</Text>
        ) : null}
        {scheduledTime ? (
          <Text style={styles.timeLabel}>{formatTime(scheduledTime)}</Text>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="✅  Take Medicine"
          onPress={handleTake}
          size="lg"
          style={styles.takeBtn}
        />
        <Button
          title="⏰  Snooze"
          variant="secondary"
          onPress={handleSnooze}
          size="lg"
          style={styles.snoozeBtn}
        />
      </View>

      <Text style={styles.hint}>
        Tap "Take" to log, or "Snooze" to be reminded again
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(126, 217, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    ...typography.h1,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xxl,
  },
  medName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  medDosage: {
    fontSize: 20,
    color: colors.primaryLight,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  presetLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.md,
  },
  timeLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primaryLight,
    marginTop: spacing.md,
  },
  actions: {
    width: '100%',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  takeBtn: {
    backgroundColor: colors.success,
    paddingVertical: spacing.lg + 4,
  },
  snoozeBtn: {
    borderColor: colors.textOnPrimary,
    paddingVertical: spacing.lg + 4,
  },
  hint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
