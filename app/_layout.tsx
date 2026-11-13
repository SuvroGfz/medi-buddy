import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { colors } from '../src/theme';
import { setupNotifications } from '../src/services/notifications';
import { getDatabase } from '../src/db/migrations';
import { isOnboardingComplete } from '../src/services/userProfile';

// Keep the splash screen visible while we load
SplashScreen.preventAutoHideAsync();

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
  const [appReady, setAppReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await setupNotifications();
        const onboarded = await isOnboardingComplete();
        setNeedsOnboarding(!onboarded);
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setAppReady(true);
      }
    }
    init();
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();

      // Navigate to onboarding if this is the first launch
      if (needsOnboarding) {
        router.replace('/onboarding');
      }
    }
  }, [appReady, needsOnboarding]);

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

  if (!appReady) {
    return null; // Splash screen is still showing
  }

  return (
    <View style={styles.container} onLayout={onLayoutReady}>
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
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
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
