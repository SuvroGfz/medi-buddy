import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { colors, typography, spacing, borderRadius, touchTarget } from '../../src/theme';
import { useMedicationStore } from '../../src/stores/useMedicationStore';
import { useScheduleStore } from '../../src/stores/useScheduleStore';
import { MedicationCard, EmptyState } from '../../src/components';
import { Medication } from '../../src/types';

export default function MedicationsScreen() {
  const { medications, loading, loadMedications, editMedication, removeMedication, searchMedications } =
    useMedicationStore();
  const { getSchedulesForMedication } = useScheduleStore();
  const [search, setSearch] = useState('');
  const [scheduleCounts, setScheduleCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  // Load schedule counts after medications load
  useFocusEffect(
    useCallback(() => {
      async function loadCounts() {
        const counts: Record<string, number> = {};
        for (const med of medications) {
          const schedules = await getSchedulesForMedication(med.id);
          counts[med.id] = schedules.length;
        }
        setScheduleCounts(counts);
      }
      if (medications.length > 0) loadCounts();
    }, [medications, getSchedulesForMedication])
  );

  const handleSearch = (query: string) => {
    setSearch(query);
    searchMedications(query);
  };

  const handleDelete = (medication: Medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete "${medication.name}"? This will also remove all its schedules and alarms.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeMedication(medication.id),
        },
      ]
    );
  };

  const handleToggle = async (medication: Medication, isActive: boolean) => {
    await editMedication(medication.id, { isActive });
  };

  const renderItem = ({ item }: { item: Medication }) => (
    <MedicationCard
      medication={item}
      scheduleSummary={
        scheduleCounts[item.id]
          ? `${scheduleCounts[item.id]} schedule${scheduleCounts[item.id] > 1 ? 's' : ''}`
          : 'No schedules'
      }
      onPress={() => router.push(`/medication/${item.id}`)}
      onToggleActive={(active) => handleToggle(item, active)}
      onDelete={() => handleDelete(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
          accessibilityLabel="Search medications"
        />
      </View>

      {medications.length === 0 && !search ? (
        <EmptyState
          icon="💊"
          title="No medications yet"
          subtitle="Start by adding your first medication. You can set up schedules and reminders for each one."
        />
      ) : (
        <FlatList
          data={medications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/medication/add')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add new medication"
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 28,
    color: colors.textOnPrimary,
    lineHeight: 30,
  },
});
