import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { typography, spacing, borderRadius, useTheme, ThemeColors } from '../../src/theme';
import { getProfile, updateProfile, deleteProfile } from '../../src/db/profiles';
import { Button } from '../../src/components';
import type { Profile } from '../../src/db/profiles';

const EMOJI_OPTIONS = ['👤', '👩', '👨', '👶', '👧', '👦', '🧓', '👴', '👵', '🐱'];

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const p = await getProfile(id);
      if (p) {
        setProfile(p);
        setName(p.name);
        setAge(p.age.toString());
        setSelectedEmoji(p.avatarEmoji);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a name for the profile.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(id, {
        name: trimmedName,
        age: parsedAge,
        avatarEmoji: selectedEmoji,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id || !profile) return;
    if (profile.isDefault) {
      Alert.alert('Cannot Delete', 'The default profile cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  if (!profile) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        placeholderTextColor={colors.textSecondary}
        testID="profile-name-input"
      />

      <Text style={styles.label}>Age *</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="Enter age"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        testID="profile-age-input"
      />

      <Text style={styles.label}>Avatar</Text>
      <View style={styles.emojiGrid}>
        {EMOJI_OPTIONS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.emojiButton,
              selectedEmoji === emoji && styles.emojiButtonSelected,
            ]}
            onPress={() => setSelectedEmoji(emoji)}
            testID={`emoji-${emoji}`}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
        <Text style={styles.previewName}>{name || profile.name}</Text>
      </View>

      <Button
        title={saving ? 'Saving...' : 'Save Changes'}
        onPress={handleSave}
        disabled={saving}
      />

      {!profile.isDefault && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          testID="delete-profile-button"
        >
          <Text style={styles.deleteButtonText}>Delete Profile</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
    label: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    emojiButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
    },
    emojiButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight + '20',
    },
    emojiText: {
      fontSize: 24,
    },
    preview: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    previewEmoji: {
      fontSize: 48,
      marginBottom: spacing.sm,
    },
    previewName: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    deleteButton: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    deleteButtonText: {
      ...typography.body,
      color: colors.danger,
      fontWeight: '700',
    },
  });
