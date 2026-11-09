import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, touchTarget } from '../theme';
import { DAY_LABELS } from '../types';

interface DaySelectorProps {
  selectedDays: string; // CSV "1,2,3,4,5,6,7"
  onChange: (days: string) => void;
}

export function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
  const selected = new Set(selectedDays.split(',').filter(Boolean));

  const toggleDay = (day: string) => {
    const next = new Set(selected);
    if (next.has(day)) {
      if (next.size > 1) {
        next.delete(day);
      } else {
        return; // keep at least one day selected
      }
    } else {
      next.add(day);
    }
    onChange(
      Array.from(next)
        .sort((a, b) => Number(a) - Number(b))
        .join(',')
    );
  };

  return (
    <View style={styles.container}>
      {Object.entries(DAY_LABELS).map(([key, label]) => {
        const isSelected = selected.has(key);
        return (
          <TouchableOpacity
            key={key}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => toggleDay(key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  pill: {
    minWidth: touchTarget.min,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.divider,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.textOnPrimary,
  },
});
