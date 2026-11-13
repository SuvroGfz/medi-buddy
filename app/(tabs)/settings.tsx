import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { typography, spacing, borderRadius, touchTarget, useTheme, ThemeColors, ThemeMode } from '../../src/theme';
import { usePresetStore } from '../../src/stores/usePresetStore';
import { PresetChip } from '../../src/components';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS, ALARM_TONES, AlarmToneKey } from '../../src/types';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '../../src/services/notifications';
import { countMedicationsForPreset } from '../../src/db/presets';
import { previewTone } from '../../src/services/alarmSound';
import { generatePDFReport } from '../../src/services/reportGenerator';
import { getDeviceTimezone, hasTimezoneChanged } from '../../src/services/timezone';
import { getUserProfile } from '../../src/services/userProfile';
import * as Sharing from 'expo-sharing';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '📱' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { presets, loading, loadPresets, removePreset } = usePresetStore();
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({});
  const [reportDays, setReportDays] = useState(30);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [timezoneChanged, setTimezoneChanged] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPresets();
      loadSettings();
      loadTimezoneInfo();
    }, [loadPresets])
  );

  useFocusEffect(
    useCallback(() => {
      async function loadCounts() {
        const counts: Record<string, number> = {};
        for (const preset of presets) {
          counts[preset.id] = await countMedicationsForPreset(preset.id);
        }
        setLinkedCounts(counts);
      }
      if (presets.length > 0) loadCounts();
    }, [presets])
  );

  const loadSettings = async () => {
    const s = await getNotificationSettings();
    setSettings(s);
  };

  const loadTimezoneInfo = async () => {
    const tz = getDeviceTimezone();
    setCurrentTimezone(tz);
    const profile = await getUserProfile();
    if (profile?.homeTimezone) {
      setTimezoneChanged(hasTimezoneChanged(profile.homeTimezone));
    }
  };

  const handleExportReport = async () => {
    setGeneratingReport(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - reportDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const uri = await generatePDFReport(startDate, endDate);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Adherence Report',
        });
      } else {
        Alert.alert('Success', `Report saved to:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate report. ' + (e.message || ''));
    } finally {
      setGeneratingReport(false);
    }
  };

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean | number | string
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings(updated);
  };

  const handleDeletePreset = (id: string, name: string, count: number) => {
    const message =
      count > 0
        ? `"${name}" has ${count} linked medication${count > 1 ? 's' : ''}. Their schedules will lose this preset and need to be reconfigured.`
        : `Are you sure you want to delete "${name}"?`;

    Alert.alert('Delete Preset', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removePreset(id),
      },
    ]);
  };

  const snoozeDurations = [5, 10, 15, 30];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themePill,
                mode === opt.value && styles.themePillActive,
              ]}
              onPress={() => setMode(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === opt.value }}
              accessibilityLabel={`${opt.label} theme`}
            >
              <Text style={styles.themeIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.themeText,
                  mode === opt.value && styles.themeTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Adherence Report */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Adherence Report</Text>
        <Text style={styles.sectionSubtitle}>
          Generate a PDF report of your medication adherence history.
        </Text>
        <View style={styles.reportOptions}>
          {[7, 30, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.snoozePill,
                reportDays === days && styles.snoozePillActive,
              ]}
              onPress={() => setReportDays(days)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reportDays === days }}
              accessibilityLabel={`Last ${days} days`}
            >
              <Text
                style={[
                  styles.snoozeText,
                  reportDays === days && styles.snoozeTextActive,
                ]}
              >
                {days}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.exportBtn, generatingReport && styles.exportBtnDisabled]}
          onPress={handleExportReport}
          disabled={generatingReport}
          accessibilityRole="button"
          accessibilityLabel="Export adherence report as PDF"
        >
          {generatingReport ? (
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.exportBtnText}>📄 Export PDF Report</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Travel Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✈️ Travel Mode</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Current Timezone</Text>
          <Text style={styles.timezoneText}>{currentTimezone || 'Loading...'}</Text>
        </View>
        {timezoneChanged && (
          <View style={styles.travelBanner}>
            <Text style={styles.travelBannerText}>
              ⚠️ Your timezone has changed! Medication schedules may need adjustment.
            </Text>
          </View>
        )}
      </View>

      {/* Meal Time Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Time Presets</Text>
        <Text style={styles.sectionSubtitle}>
          Configure preset times. Changing a preset updates all linked
          medications.
        </Text>

        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            onLongPress={() =>
              handleDeletePreset(
                preset.id,
                preset.name,
                linkedCounts[preset.id] ?? 0
              )
            }
          >
            <PresetChip
              preset={preset}
              linkedCount={linkedCounts[preset.id]}
              onPress={() => router.push(`/preset/${preset.id}`)}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/preset/add')}
          accessibilityRole="button"
          accessibilityLabel="Add new time preset"
        >
          <Text style={styles.addBtnText}>＋ Add Preset</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(v) => updateSetting('soundEnabled', v)}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={settings.soundEnabled ? colors.primary : colors.textSecondary}
            accessibilityLabel="Toggle notification sound"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vibration</Text>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(v) => updateSetting('vibrationEnabled', v)}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={
              settings.vibrationEnabled ? colors.primary : colors.textSecondary
            }
            accessibilityLabel="Toggle vibration"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Snooze Duration</Text>
          <View style={styles.snoozeOptions}>
            {snoozeDurations.map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.snoozePill,
                  settings.snoozeDurationMinutes === min &&
                    styles.snoozePillActive,
                ]}
                onPress={() => updateSetting('snoozeDurationMinutes', min)}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: settings.snoozeDurationMinutes === min,
                }}
                accessibilityLabel={`${min} minutes snooze`}
              >
                <Text
                  style={[
                    styles.snoozeText,
                    settings.snoozeDurationMinutes === min &&
                      styles.snoozeTextActive,
                  ]}
                >
                  {min}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Alarm Tone</Text>
        </View>
        <View style={styles.toneOptions}>
          {(Object.entries(ALARM_TONES) as [AlarmToneKey, { label: string; icon: string }][]).map(
            ([key, { label, icon }]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tonePill,
                  settings.alarmTone === key && styles.tonePillActive,
                ]}
                onPress={() => {
                  updateSetting('alarmTone', key);
                  previewTone(key);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: settings.alarmTone === key }}
                accessibilityLabel={`${label} alarm tone`}
              >
                <Text style={styles.toneIcon}>{icon}</Text>
                <Text
                  style={[
                    styles.toneText,
                    settings.alarmTone === key && styles.toneTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          MediBuddy v1.0.0{'\n'}
          Your personal medication reminder
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 40,
    },
    section: {
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    sectionSubtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    themePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: colors.divider,
      minHeight: touchTarget.min,
    },
    themePillActive: {
      backgroundColor: colors.primary,
    },
    themeIcon: {
      fontSize: 16,
    },
    themeText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    themeTextActive: {
      color: colors.textOnPrimary,
    },
    addBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
      minHeight: touchTarget.min,
      justifyContent: 'center',
    },
    addBtnText: {
      ...typography.button,
      color: colors.primary,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginVertical: spacing.xs,
      minHeight: touchTarget.min,
    },
    settingLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    snoozeOptions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    snoozePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.divider,
      minWidth: 40,
      alignItems: 'center',
    },
    snoozePillActive: {
      backgroundColor: colors.primary,
    },
    snoozeText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    snoozeTextActive: {
      color: colors.textOnPrimary,
    },
    aboutText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    reportOptions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    exportBtn: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      minHeight: touchTarget.min,
      justifyContent: 'center',
    },
    exportBtnDisabled: {
      opacity: 0.6,
    },
    exportBtnText: {
      ...typography.button,
      color: colors.textOnPrimary,
    },
    timezoneText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    travelBanner: {
      backgroundColor: colors.warningLight,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    travelBannerText: {
      ...typography.bodySmall,
      color: colors.warning,
      fontWeight: '600',
    },
    toneOptions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    tonePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: touchTarget.min,
      gap: spacing.md,
    },
    tonePillActive: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    toneIcon: {
      fontSize: 20,
    },
    toneText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    toneTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
