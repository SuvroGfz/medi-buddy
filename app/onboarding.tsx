import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, touchTarget } from '../src/theme';
import { Button } from '../src/components';
import { saveUserProfile } from '../src/services/userProfile';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length >= 2 && age.trim().length > 0;

  const handleContinue = async () => {
    const trimmedName = name.trim();
    const parsedAge = parseInt(age.trim(), 10);

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter at least 2 characters.');
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age (1–150).');
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({ name: trimmedName, age: parsedAge });
      router.replace('/');
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>💊</Text>
          <Text style={styles.title}>Welcome to MediBuddy</Text>
          <Text style={styles.subtitle}>
            Your personal medication reminder.{'\n'}Let's get to know you!
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>What's your name?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={colors.disabledText}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="next"
            maxLength={50}
            testID="name-input"
            accessibilityLabel="Your name"
          />

          <Text style={styles.label}>How old are you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor={colors.disabledText}
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            testID="age-input"
            accessibilityLabel="Your age"
          />
        </View>

        {/* CTA */}
        <Button
          title={saving ? 'Saving…' : 'Get Started 🚀'}
          onPress={handleContinue}
          disabled={!isValid || saving}
          size="lg"
          style={styles.cta}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    paddingTop: 60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl + spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  form: {
    marginBottom: spacing.xxl,
  },
  label: {
    ...typography.body,
    color: colors.primaryLight,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 18,
    color: colors.textOnPrimary,
    minHeight: touchTarget.min,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cta: {
    backgroundColor: colors.primaryLight,
    marginTop: spacing.md,
  },
});
