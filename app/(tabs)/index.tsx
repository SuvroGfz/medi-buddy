import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { typography, spacing, borderRadius, useTheme, ThemeColors } from '../../src/theme';
import { useScheduleStore } from '../../src/stores/useScheduleStore';
import { TimelineItem, EmptyState, Button } from '../../src/components';
import { formatTime, isTodayScheduled } from '../../src/utils/time';
import { getProfile } from '../../src/db/profiles';

export default function TodayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    timeGroups,
    intakeLogs,
    loading,
    loadTodaySchedules,
    loadIntakeLogs,
    logAction,
  } = useScheduleStore();
  const [userName, setUserName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await loadTodaySchedules();
    await loadIntakeLogs();
  }, [loadTodaySchedules, loadIntakeLogs]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      AsyncStorage.getItem('@medibuddy_active_profile_id').then(async (profileId) => {
        if (profileId) {
          const profile = await getProfile(profileId);
          setUserName(profile?.name ?? null);
        } else {
          setUserName(null);
        }
      });
    }, [refresh])
  );

  const todayDate = format(new Date(), 'EEEE, MMMM d');

  // Filter groups to only show today's schedules
  const todayGroups = timeGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isTodayScheduled(item.schedule.daysOfWeek)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const getTodayLog = (scheduleId: string) => {
    return intakeLogs.find((log) => log.scheduleId === scheduleId) ?? null;
  };

  const handleAction = async (
    scheduleId: string,
    medicationId: string,
    scheduledTime: string,
    action: 'taken' | 'skipped' | 'snoozed'
  ) => {
    await logAction({ scheduleId, medicationId, scheduledTime, action });
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.greeting}>
          {userName ? `Hi, ${userName}! 👋` : 'Good day! 👋'}
        </Text>
        <Text style={styles.date}>{todayDate}</Text>
      </View>

      {todayGroups.length === 0 ? (
        <EmptyState
          icon="💊"
          title="No medications scheduled"
          subtitle="Add medications and set up schedules to see them here."
        >
          <Button
            title="Add Medication"
            icon="➕"
            onPress={() => router.push('/medication/add')}
          />
        </EmptyState>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {todayGroups.map((group) => (
            <View key={`${group.label}-${group.time}`} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupIcon}>{group.icon}</Text>
                <View>
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  <Text style={styles.groupTime}>
                    {formatTime(group.time)}
                  </Text>
                </View>
              </View>
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <TimelineItem
                    key={item.schedule.id}
                    item={item}
                    todayLog={getTodayLog(item.schedule.id)}
                    onTake={() =>
                      handleAction(
                        item.schedule.id,
                        item.medication.id,
                        item.effectiveTime,
                        'taken'
                      )
                    }
                    onSkip={() =>
                      handleAction(
                        item.schedule.id,
                        item.medication.id,
                        item.effectiveTime,
                        'skipped'
                      )
                    }
                    onSnooze={() =>
                      handleAction(
                        item.schedule.id,
                        item.medication.id,
                        item.effectiveTime,
                        'snoozed'
                      )
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    dateHeader: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
    },
    greeting: {
      ...typography.h1,
      color: colors.textOnPrimary,
    },
    date: {
      ...typography.body,
      color: colors.primaryLight,
      marginTop: spacing.xs,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 100,
    },
    group: {
      marginBottom: spacing.xl,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    groupIcon: {
      fontSize: 28,
      marginRight: spacing.md,
    },
    groupLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    groupTime: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    groupItems: {
      marginLeft: spacing.xs,
    },
  });
