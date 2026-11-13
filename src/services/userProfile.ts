import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = '@medibuddy_user_profile';

export interface UserProfile {
  name: string;
  age: number;
  homeTimezone?: string;
}

/** Get the saved user profile, or null if onboarding hasn't been completed */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/** Save user profile after onboarding */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

/** Check if onboarding has been completed */
export async function isOnboardingComplete(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile !== null;
}
