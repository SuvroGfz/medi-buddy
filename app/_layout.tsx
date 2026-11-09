import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { colors } from '../src/theme';
import { setupNotifications } from '../src/services/notifications';
import { getDatabase } from '../src/db/migrations';

// Set up notification handler immediately
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
    // Navigate to alarm screen when a notification is received in foreground
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        if (data?.scheduleId) {
          router.push({
            pathname: '/alarm',
            params: {
              scheduleId: data.scheduleId as string,
              medicationId: data.medicationId as string,
              medicationName: data.medicationName as string,
              dosage: (data.dosage as string) ?? '',
              scheduledTime: data.scheduledTime as string,
              presetName: (data.presetName as string) ?? '',
            },
          });
        }
      }
    );

    // Navigate to alarm screen when user taps a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.scheduleId) {
          router.push({
            pathname: '/alarm',
            params: {
              scheduleId: data.scheduleId as string,
              medicationId: data.medicationId as string,
              medicationName: data.medicationName as string,
              dosage: (data.dosage as string) ?? '',
              scheduledTime: data.scheduledTime as string,
              presetName: (data.presetName as string) ?? '',
            },
          });
        }
      }
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
        <Stack.Screen
          name="alarm"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
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
