import React, { useState } from 'react';
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
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useMedicationStore } from '../../src/stores/useMedicationStore';
import { Button, LoadingOverlay } from '../../src/components';

export default function AddMedicationScreen() {
  const { addMedication } = useMedicationStore();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
          <TextInput
            style={styles.input}
            placeholder="e.g., Metformin"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            accessibilityLabel="Medication name"
          />
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
  textarea: {
    minHeight: 80,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
