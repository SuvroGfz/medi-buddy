import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, borderRadius, useTheme, ThemeColors } from '../theme';
import { getAllProfiles, Profile } from '../db/profiles';

const ACTIVE_PROFILE_KEY = '@medibuddy_active_profile_id';

export function ProfileSwitcher() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [visible, setVisible] = useState(false);

  const loadProfiles = useCallback(async () => {
    const all = await getAllProfiles();
    setProfiles(all);

    const savedId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const active =
      all.find((p) => p.id === savedId) ??
      all.find((p) => p.isDefault) ??
      all[0] ??
      null;
    setActiveProfile(active);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleSelect = async (profile: Profile) => {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    setActiveProfile(profile);
    setVisible(false);
  };

  if (!activeProfile) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        testID="profile-switcher"
        accessibilityLabel={`Current profile: ${activeProfile.name}`}
      >
        <Text style={styles.avatar}>{activeProfile.avatarEmoji}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {activeProfile.name}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Switch Profile</Text>

            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.profileRow,
                    item.id === activeProfile.id && styles.profileRowActive,
                  ]}
                  onPress={() => handleSelect(item)}
                  testID={`profile-option-${item.id}`}
                >
                  <Text style={styles.profileAvatar}>{item.avatarEmoji}</Text>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{item.name}</Text>
                    {item.isDefault && (
                      <Text style={styles.defaultBadge}>Default</Text>
                    )}
                  </View>
                  {item.id === activeProfile.id && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setVisible(false);
                router.push('/profile/add');
              }}
              testID="add-profile-button"
            >
              <Text style={styles.addButtonText}>＋ Add Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    avatar: {
      fontSize: 22,
      marginRight: spacing.xs,
    },
    name: {
      ...typography.caption,
      color: colors.textOnPrimary,
      fontWeight: '600',
      maxWidth: 100,
    },
    chevron: {
      fontSize: 10,
      color: colors.textOnPrimary,
      marginLeft: 4,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'flex-start',
      paddingTop: 100,
      paddingHorizontal: spacing.lg,
    },
    dropdown: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      maxHeight: 400,
    },
    dropdownTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    profileRowActive: {
      backgroundColor: colors.primaryLight + '20',
    },
    profileAvatar: {
      fontSize: 28,
      marginRight: spacing.md,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    defaultBadge: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '500',
    },
    check: {
      fontSize: 18,
      color: colors.primary,
      fontWeight: '700',
    },
    addButton: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: spacing.md,
      marginTop: spacing.sm,
      alignItems: 'center',
    },
    addButtonText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700',
    },
  });
