import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getUserProfile,
  saveUserProfile,
  isOnboardingComplete,
  UserProfile,
} from '../../src/services/userProfile';

describe('UserProfile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getUserProfile', () => {
    it('returns null when no profile is saved', async () => {
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });

    it('returns the saved profile', async () => {
      const saved: UserProfile = { name: 'Alice', age: 30 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(saved)
      );

      const profile = await getUserProfile();
      expect(profile).toEqual({ name: 'Alice', age: 30 });
    });

    it('returns null on corrupted data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json!!!');
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });

    it('returns null when AsyncStorage throws', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('storage error')
      );
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });
  });

  describe('saveUserProfile', () => {
    it('saves profile to AsyncStorage as JSON', async () => {
      await saveUserProfile({ name: 'Bob', age: 25 });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@medibuddy_user_profile',
        JSON.stringify({ name: 'Bob', age: 25 })
      );
    });
  });

  describe('isOnboardingComplete', () => {
    it('returns false when no profile exists', async () => {
      const result = await isOnboardingComplete();
      expect(result).toBe(false);
    });

    it('returns true when a profile exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ name: 'Carol', age: 40 })
      );

      const result = await isOnboardingComplete();
      expect(result).toBe(true);
    });
  });
});
