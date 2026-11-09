import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { TimePreset } from '../types';
import { formatTime } from '../utils/time';

interface PresetChipProps {
  preset: TimePreset;
  linkedCount?: number;
  onPress?: () => void;
  selected?: boolean;
}

export function PresetChip({ preset, linkedCount, onPress, selected }: PresetChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${preset.name}, ${formatTime(preset.time)}${linkedCount ? `, ${linkedCount} medications linked` : ''}`}
      accessibilityState={{ selected }}
    >
      <Text style={styles.icon}>{preset.icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.name, selected && styles.nameSelected]}>
          {preset.name}
        </Text>
        <Text style={[styles.time, selected && styles.timeSelected]}>
          {formatTime(preset.time)}
        </Text>
      </View>
      {linkedCount !== undefined && linkedCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{linkedCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  nameSelected: {
    color: colors.primary,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timeSelected: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
