import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Medication } from '../types';

interface MedicationCardProps {
  medication: Medication;
  scheduleSummary?: string; // e.g. "3 schedules"
  onPress: () => void;
  onToggleActive: (isActive: boolean) => void;
  onDelete: () => void;
}

export function MedicationCard({
  medication,
  scheduleSummary,
  onPress,
  onToggleActive,
  onDelete,
}: MedicationCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, !medication.isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}${medication.dosage ? `, ${medication.dosage}` : ''}. ${
        medication.isActive ? 'Active' : 'Paused'
      }`}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.name, !medication.isActive && styles.textInactive]}>
            {medication.name}
          </Text>
          {medication.dosage && (
            <Text style={styles.dosage}>{medication.dosage}</Text>
          )}
          {scheduleSummary && (
            <Text style={styles.schedule}>{scheduleSummary}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <Switch
            value={medication.isActive}
            onValueChange={onToggleActive}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={medication.isActive ? colors.primary : colors.textSecondary}
            accessibilityLabel={`Toggle ${medication.name} ${medication.isActive ? 'off' : 'on'}`}
          />
        </View>
      </View>
      {medication.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {medication.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  textInactive: {
    color: colors.textSecondary,
  },
  dosage: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: 2,
  },
  schedule: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notes: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    alignItems: 'center',
  },
});
