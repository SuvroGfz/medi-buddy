import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { format, parse } from 'date-fns';
import { colors, typography, spacing, borderRadius, touchTarget } from '../../src/theme';
import { usePresetStore } from '../../src/stores/usePresetStore';
import { Button } from '../../src/components';
import { formatTime } from '../../src/utils/time';

const ICONS = ['🌅', '🌞', '☀️', '🌤️', '🌆', '🌙', '😴', '💊', '🍳', '🥗', '🍽️', '⏰'];

export default function AddPresetScreen() {
  const { addPreset } = usePresetStore();
  const [name, setName] = useState('');
  const [time, setTime] = useState(new Date());
  const [icon, setIcon] = useState('💊');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for this preset.');
      return;
    }

    setSaving(true);
    try {
      const timeStr = format(time, 'HH:mm');
      await addPreset({ name: name.trim(), time: timeStr, icon });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create preset.');
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setTime(selectedDate);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Preset Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Before Morning Meal"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
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
          title="Create Preset"
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim()}
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
