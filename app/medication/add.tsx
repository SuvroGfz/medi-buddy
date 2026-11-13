import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { typography, spacing, borderRadius, useTheme, ThemeColors } from '../../src/theme';
import { useMedicationStore } from '../../src/stores/useMedicationStore';
import { Button, LoadingOverlay, MedicationAutocomplete } from '../../src/components';
import { MedicationEntry } from '../../src/db/medicationLookup';

export default function AddMedicationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { addMedication } = useMedicationStore();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectMedication = (entry: MedicationEntry) => {
    // Auto-fill dosage and notes from database
    if (entry.strength && !dosage) {
      setDosage(entry.strength);
    }
    if (entry.genericName && !notes) {
      setNotes(`${entry.genericName} • ${entry.type} • ${entry.manufacturer}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the medication name.');
      return;
    }

    setSaving(true);
    try {
      const medication = await addMedication({
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      // Navigate to the medication detail to set up schedules
      router.replace(`/medication/${medication.id}`);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay visible={saving} message="Saving medication..." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Medication Name *</Text>
          <MedicationAutocomplete
            value={name}
            onChangeText={setName}
            onSelectMedication={handleSelectMedication}
            placeholder="e.g., Napa, Metformin"
            testID="medication-name"
          />
          <Text style={styles.hint}>
            💊 Search BD medications database or type a custom name
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500mg, 1 tablet"
            placeholderTextColor={colors.textSecondary}
            value={dosage}
            onChangeText={setDosage}
            accessibilityLabel="Dosage"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="e.g., Take with food, Take after meal"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Notes"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Save & Set Schedule"
            onPress={handleSave}
            loading={saving}
            disabled={!name.trim()}
            icon="💊"
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
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
    hint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
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
    actions: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  });
