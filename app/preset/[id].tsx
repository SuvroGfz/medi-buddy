import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { format, parse } from 'date-fns';
import { colors, typography, spacing, borderRadius, touchTarget } from '../../src/theme';
import { usePresetStore } from '../../src/stores/usePresetStore';
import { Button, LoadingOverlay } from '../../src/components';
import { formatTime } from '../../src/utils/time';
import { countMedicationsForPreset } from '../../src/db/presets';

const ICONS = ['🌅', '🌞', '☀️', '🌤️', '🌆', '🌙', '😴', '💊', '🍳', '🥗', '🍽️', '⏰'];

export default function EditPresetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { presets, editPreset, removePreset } = usePresetStore();
  const preset = presets.find((p) => p.id === id);

  const [name, setName] = useState('');
  const [time, setTime] = useState(new Date());
  const [icon, setIcon] = useState('💊');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkedCount, setLinkedCount] = useState(0);

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setIcon(preset.icon);
      const [h, m] = preset.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setTime(d);
    }
  }, [preset]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        countMedicationsForPreset(id).then(setLinkedCount);
      }
    }, [id])
  );

  const handleSave = async () => {
    if (!id || !name.trim()) return;

    const newTime = format(time, 'HH:mm');
    const timeChanged = preset && preset.time !== newTime;

    if (timeChanged && linkedCount > 0) {
      Alert.alert(
        'Update Time',
        `This will update the alarm time for ${linkedCount} medication${linkedCount > 1 ? 's' : ''} linked to this preset.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            onPress: () => doSave(newTime),
          },
        ]
      );
    } else {
      await doSave(newTime);
    }
  };

  const doSave = async (timeStr: string) => {
    setSaving(true);
    try {
      await editPreset(id!, { name: name.trim(), time: timeStr, icon });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to update preset.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    const msg =
      linkedCount > 0
        ? `This preset has ${linkedCount} linked medication${linkedCount > 1 ? 's' : ''}. They will lose this preset.`
        : `Delete "${preset?.name}"?`;

    Alert.alert('Delete Preset', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removePreset(id);
          router.back();
        },
      },
    ]);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setTime(selectedDate);
  };

  if (!preset) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Preset not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoadingOverlay visible={saving} message="Saving changes..." />
      <View style={styles.field}>
        <Text style={styles.label}>Preset Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Preset name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => setShowTimePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Selected time: ${formatTime(format(time, 'HH:mm'))}`}
        >
          <Text style={styles.timeText}>
            {formatTime(format(time, 'HH:mm'))}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </View>

      {linkedCount > 0 && (
        <View style={styles.preview}>
          <Text style={styles.previewText}>
            💊 {linkedCount} medication{linkedCount > 1 ? 's' : ''} will be
            updated to the new time.
          </Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.iconBtn, icon === emoji && styles.iconBtnActive]}
              onPress={() => setIcon(emoji)}
              accessibilityRole="radio"
              accessibilityState={{ selected: icon === emoji }}
              accessibilityLabel={`Icon ${emoji}`}
            >
              <Text style={styles.iconText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim()}
        />
        <Button
          title="Delete Preset"
          variant="danger"
          icon="🗑"
          onPress={handleDelete}
        />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
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
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBtn: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  timeText: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  preview: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  previewText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconText: {
    fontSize: 24,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
