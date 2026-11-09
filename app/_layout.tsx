import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { colors } from '../src/theme';
import { setupNotifications } from '../src/services/notifications';
import { getDatabase } from '../src/db/migrations';

// Set up notification handler immediately
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize database and notifications on app start
    async function init() {
      try {
        await getDatabase();
        await setupNotifications();
      } catch (e) {
        console.error('Initialization error:', e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    // Listen for notification responses (Take / Snooze)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
        // Navigation to today screen is handled by default since it's the home tab
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.statusBar} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primaryDark },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="medication/add"
          options={{
            title: 'Add Medication',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="medication/[id]"
          options={{
            title: 'Medication Details',
          }}
        />
        <Stack.Screen
          name="preset/add"
          options={{
            title: 'Add Time Preset',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="preset/[id]"
          options={{
            title: 'Edit Time Preset',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
