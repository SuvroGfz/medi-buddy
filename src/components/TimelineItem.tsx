import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing, borderRadius, touchTarget, useTheme, ThemeColors } from '../theme';
import { ScheduleWithDetails, IntakeLog } from '../types';
import { formatTime, hasTimePassed } from '../utils/time';

interface TimelineItemProps {
  item: ScheduleWithDetails;
  todayLog?: IntakeLog | null;
  onTake: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}

export function TimelineItem({
  item,
  todayLog,
  onTake,
  onSkip,
  onSnooze,
}: TimelineItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isPast = hasTimePassed(item.effectiveTime);
  const status = todayLog?.action;

  const getStatusStyle = () => {
    if (status === 'taken') return styles.statusTaken;
    if (status === 'skipped') return styles.statusSkipped;
    if (isPast && !status) return styles.statusMissed;
    return styles.statusUpcoming;
  };

  const getStatusIcon = () => {
    if (status === 'taken') return '✅';
    if (status === 'skipped') return '⏭';
    if (status === 'snoozed') return '💤';
    if (isPast && !status) return '❌';
    return '⏰';
  };

  const getStatusText = () => {
    if (status === 'taken') return 'Taken';
    if (status === 'skipped') return 'Skipped';
    if (status === 'snoozed') return 'Snoozed';
    if (isPast && !status) return 'Missed';
    return 'Upcoming';
  };

  return (
    <View style={[styles.card, getStatusStyle()]} accessibilityRole="text">
      <View style={styles.header}>
        <View style={styles.medInfo}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <View>
            <Text style={styles.medName}>{item.medication.name}</Text>
            {item.medication.dosage && (
              <Text style={styles.dosage}>{item.medication.dosage}</Text>
            )}
          </View>
        </View>
      </View>

      {!status && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.takeBtn]}
            onPress={onTake}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${item.medication.name} as taken`}
          >
            <Text style={styles.takeBtnText}>✓ Take</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.snoozeBtn]}
            onPress={onSnooze}
            accessibilityRole="button"
            accessibilityLabel={`Snooze ${item.medication.name} reminder`}
          >
            <Text style={styles.snoozeBtnText}>💤 Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={`Skip ${item.medication.name}`}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {status && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginVertical: spacing.xs,
      borderLeftWidth: 4,
    },
    statusUpcoming: {
      borderLeftColor: colors.primary,
    },
    statusTaken: {
      borderLeftColor: colors.success,
      opacity: 0.8,
    },
    statusSkipped: {
      borderLeftColor: colors.textSecondary,
      opacity: 0.6,
    },
    statusMissed: {
      borderLeftColor: colors.danger,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    medInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusIcon: {
      fontSize: 20,
      marginRight: spacing.md,
    },
    medName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    dosage: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      minHeight: touchTarget.min,
    },
    takeBtn: {
      backgroundColor: colors.success,
    },
    takeBtnText: {
      ...typography.button,
      color: colors.textOnPrimary,
      fontSize: 14,
    },
    snoozeBtn: {
      backgroundColor: colors.warningLight,
    },
    snoozeBtnText: {
      ...typography.button,
      color: colors.textPrimary,
      fontSize: 14,
    },
    skipBtn: {
      backgroundColor: colors.divider,
    },
    skipBtnText: {
      ...typography.button,
      color: colors.textSecondary,
      fontSize: 14,
    },
    statusRow: {
      marginTop: spacing.sm,
    },
    statusText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });
