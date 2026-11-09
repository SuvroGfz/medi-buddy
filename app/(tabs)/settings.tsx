import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { colors, typography, spacing, borderRadius, touchTarget } from '../../src/theme';
import { usePresetStore } from '../../src/stores/usePresetStore';
import { PresetChip } from '../../src/components';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../../src/types';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '../../src/services/notifications';
import { countMedicationsForPreset } from '../../src/db/presets';

export default function SettingsScreen() {
  const { presets, loading, loadPresets, removePreset } = usePresetStore();
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadPresets();
      loadSettings();
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

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean | number
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

const styles = StyleSheet.create({
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
});
