import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { typography, spacing, borderRadius, touchTarget, useTheme, ThemeColors } from '../../src/theme';
import { useMedicationStore } from '../../src/stores/useMedicationStore';
import { usePresetStore } from '../../src/stores/usePresetStore';
import { useScheduleStore } from '../../src/stores/useScheduleStore';
import { Button, PresetChip, DaySelector, LoadingOverlay } from '../../src/components';
import { MedicationSchedule, ALL_DAYS } from '../../src/types';
import { formatTime } from '../../src/utils/time';
import { format } from 'date-fns';

export default function MedicationDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, editMedication, removeMedication } = useMedicationStore();
  const { presets, loadPresets } = usePresetStore();
  const { addSchedule, removeSchedule, getSchedulesForMedication } = useScheduleStore();

  const medication = medications.find((m) => m.id === id);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Schedule picker state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<Date>(new Date());
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [selectedDays, setSelectedDays] = useState(ALL_DAYS);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPresets();
      if (id) {
        loadSchedules();
      }
    }, [id, loadPresets])
  );

  useEffect(() => {
    if (medication) {
      setName(medication.name);
      setDosage(medication.dosage ?? '');
      setNotes(medication.notes ?? '');
    }
  }, [medication]);

  const loadSchedules = async () => {
    if (!id) return;
    const s = await getSchedulesForMedication(id);
    setSchedules(s);
  };

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    setSaving(true);
    try {
      await editMedication(id, {
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id || !medication) return;
    Alert.alert(
      'Delete Medication',
      `Delete "${medication.name}" and all its schedules?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeMedication(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddSchedule = async () => {
    if (!id) return;

    try {
      if (useCustomTime) {
        const timeStr = format(customTime, 'HH:mm');
        await addSchedule({
          medicationId: id,
          customTime: timeStr,
          daysOfWeek: selectedDays,
        });
      } else if (selectedPresetId) {
        await addSchedule({
          medicationId: id,
          timePresetId: selectedPresetId,
          daysOfWeek: selectedDays,
        });
      } else {
        Alert.alert('Select Time', 'Please select a preset or set a custom time.');
        return;
      }

      setShowSchedulePicker(false);
      setSelectedPresetId(null);
      setUseCustomTime(false);
      setSelectedDays(ALL_DAYS);
      await loadSchedules();
    } catch (e) {
      Alert.alert('Error', 'Failed to add schedule.');
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    Alert.alert('Remove Schedule', 'Remove this schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeSchedule(scheduleId);
          await loadSchedules();
        },
      },
    ]);
  };

  const getScheduleLabel = (schedule: MedicationSchedule): string => {
    if (schedule.timePresetId) {
      const preset = presets.find((p) => p.id === schedule.timePresetId);
      return preset
        ? `${preset.icon} ${preset.name} — ${formatTime(preset.time)}`
        : 'Unknown Preset';
    }
    return `⏰ Custom — ${formatTime(schedule.customTime!)}`;
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCustomTime(selectedDate);
    }
  };

  if (!medication) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Medication not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay visible={saving} message="Saving..." />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Medication Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medication Info</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Medication name"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g., 500mg"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Dosage"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Notes"
                />
              </View>
              <View style={styles.editActions}>
                <Button title="Save" onPress={handleSave} loading={saving} size="sm" />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setName(medication.name);
                    setDosage(medication.dosage ?? '');
                    setNotes(medication.notes ?? '');
                    setIsEditing(false);
                  }}
                  size="sm"
                />
              </View>
            </>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.medName}>{medication.name}</Text>
              {medication.dosage && (
                <Text style={styles.medDosage}>{medication.dosage}</Text>
              )}
              {medication.notes && (
                <Text style={styles.medNotes}>{medication.notes}</Text>
              )}
            </View>
          )}
        </View>

        {/* Schedules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedules</Text>
          <Text style={styles.sectionSubtitle}>
            Set when you need to take this medication.
          </Text>

          {schedules.map((schedule) => (
            <TouchableOpacity
              key={schedule.id}
              style={styles.scheduleItem}
              onLongPress={() => handleDeleteSchedule(schedule.id)}
              accessibilityRole="button"
              accessibilityLabel={`Schedule: ${getScheduleLabel(schedule)}. Long press to delete.`}
            >
              <Text style={styles.scheduleLabel}>
                {getScheduleLabel(schedule)}
              </Text>
              <Text style={styles.scheduleDays}>
                {schedule.daysOfWeek === ALL_DAYS
                  ? 'Every day'
                  : schedule.daysOfWeek
                      .split(',')
                      .map((d) => ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Number(d)])
                      .join(', ')}
              </Text>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleDeleteSchedule(schedule.id)}
                accessibilityLabel={`Remove schedule ${getScheduleLabel(schedule)}`}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <Button
            title="＋ Add Schedule"
            variant="secondary"
            onPress={() => setShowSchedulePicker(true)}
          />
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Button
            title="Delete Medication"
            variant="danger"
            icon="🗑"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>

      {/* Schedule Picker Modal */}
      <Modal
        visible={showSchedulePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSchedulePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Schedule</Text>
            <TouchableOpacity onPress={() => setShowSchedulePicker(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Preset selection */}
            <Text style={styles.modalSectionTitle}>Use a Preset</Text>
            {presets.map((preset) => (
              <PresetChip
                key={preset.id}
                preset={preset}
                selected={selectedPresetId === preset.id && !useCustomTime}
                onPress={() => {
                  setSelectedPresetId(preset.id);
                  setUseCustomTime(false);
                }}
              />
            ))}

            {/* Custom time */}
            <Text style={[styles.modalSectionTitle, { marginTop: spacing.xl }]}>
              Or Set Custom Time
            </Text>
            <TouchableOpacity
              style={[
                styles.customTimeBtn,
                useCustomTime && styles.customTimeBtnActive,
              ]}
              onPress={() => {
                setUseCustomTime(true);
                setSelectedPresetId(null);
                setShowTimePicker(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Set custom time"
            >
              <Text
                style={[
                  styles.customTimeBtnText,
                  useCustomTime && styles.customTimeBtnTextActive,
                ]}
              >
                ⏰ {useCustomTime ? formatTime(format(customTime, 'HH:mm')) : 'Select a time...'}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={customTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {/* Day selector */}
            <Text style={[styles.modalSectionTitle, { marginTop: spacing.xl }]}>
              Days of Week
            </Text>
            <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />

            {/* Save */}
            <View style={styles.modalActions}>
              <Button
                title="Add Schedule"
                onPress={handleAddSchedule}
                disabled={!selectedPresetId && !useCustomTime}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowSchedulePicker(false)}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    notFound: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 100,
    },
    section: {
      marginBottom: spacing.xxl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    sectionSubtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    editLink: {
      ...typography.button,
      color: colors.primary,
    },
    field: {
      marginBottom: spacing.lg,
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
    textarea: {
      minHeight: 80,
    },
    editActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
    },
    medName: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    medDosage: {
      ...typography.body,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    medNotes: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
    scheduleItem: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scheduleLabel: {
      ...typography.bodySmall,
      color: colors.textPrimary,
      flex: 1,
    },
    scheduleDays: {
      ...typography.caption,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.dangerLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBtnText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.primaryDark,
    },
    modalTitle: {
      ...typography.h2,
      color: colors.textOnPrimary,
    },
    modalClose: {
      fontSize: 22,
      color: colors.textOnPrimary,
      padding: spacing.sm,
    },
    modalContent: {
      padding: spacing.lg,
      paddingBottom: 40,
    },
    modalSectionTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    customTimeBtn: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: touchTarget.min,
      justifyContent: 'center',
    },
    customTimeBtnActive: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    customTimeBtnText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    customTimeBtnTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    modalActions: {
      gap: spacing.md,
      marginTop: spacing.xxl,
    },
  });
