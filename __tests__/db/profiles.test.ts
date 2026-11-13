import * as SQLite from 'expo-sqlite';

// Grab the mocked db instance for setting up per-test return values
const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

(SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);

import {
  addProfile,
  getAllProfiles,
  getProfile,
  getDefaultProfile,
  setDefaultProfile,
  updateProfile,
  deleteProfile,
} from '../../src/db/profiles';

describe('profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the mock db for each test
    mockDb.execAsync.mockResolvedValue(undefined);
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    mockDb.getFirstAsync.mockResolvedValue(null);
    mockDb.getAllAsync.mockResolvedValue([]);
  });

  // 1. addProfile creates a profile and returns it
  it('addProfile creates a profile and returns it', async () => {
    const profile = await addProfile('Alice', 30, '👩');

    expect(profile.name).toBe('Alice');
    expect(profile.age).toBe(30);
    expect(profile.avatarEmoji).toBe('👩');
    expect(profile.isDefault).toBe(false);
    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  // 2. getAllProfiles returns all profiles
  it('getAllProfiles returns all profiles', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'p1', name: 'Alice', age: 30, avatar_emoji: '👩', is_default: 1, created_at: '2026-01-01T00:00:00Z' },
      { id: 'p2', name: 'Bob', age: 10, avatar_emoji: '👦', is_default: 0, created_at: '2026-01-02T00:00:00Z' },
    ]);

    const profiles = await getAllProfiles();

    expect(profiles).toHaveLength(2);
    expect(profiles[0].name).toBe('Alice');
    expect(profiles[0].isDefault).toBe(true);
    expect(profiles[1].name).toBe('Bob');
    expect(profiles[1].isDefault).toBe(false);
  });

  // 3. getDefaultProfile returns the default profile
  it('getDefaultProfile returns the default profile', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(
      { id: 'p1', name: 'Alice', age: 30, avatar_emoji: '👩', is_default: 1, created_at: '2026-01-01T00:00:00Z' }
    );

    const profile = await getDefaultProfile();

    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('Alice');
    expect(profile!.isDefault).toBe(true);
  });

  // 4. setDefaultProfile changes the default
  it('setDefaultProfile changes the default', async () => {
    await setDefaultProfile('p2');

    // First call: clear all defaults
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE profiles SET is_default = 0');
    // Second call: set new default
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE profiles SET is_default = 1 WHERE id = ?',
      'p2'
    );
  });

  // 5. updateProfile updates name/age/emoji
  it('updateProfile updates name/age/emoji', async () => {
    await updateProfile('p1', { name: 'Alice Updated', age: 31, avatarEmoji: '👴' });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE profiles SET name = ?, age = ?, avatar_emoji = ? WHERE id = ?',
      'Alice Updated',
      31,
      '👴',
      'p1'
    );
  });

  // 6. deleteProfile removes a profile
  it('deleteProfile removes a non-default profile', async () => {
    // Profile exists and is not default
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ is_default: 0 })  // profile check
      .mockResolvedValueOnce({ count: 0 });       // medication count check

    await deleteProfile('p2');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM profiles WHERE id = ?',
      'p2'
    );
  });

  // 7. deleteProfile on default profile throws
  it('deleteProfile on default profile throws', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ is_default: 1 });

    await expect(deleteProfile('p1')).rejects.toThrow('Cannot delete the default profile');
  });

  // 8. getProfile returns null for non-existent id
  it('getProfile returns null for non-existent id', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const profile = await getProfile('nonexistent');

    expect(profile).toBeNull();
  });

  // 9. addProfile assigns unique IDs
  it('addProfile assigns unique IDs', async () => {
    const profile1 = await addProfile('Alice', 30);
    const profile2 = await addProfile('Bob', 25);

    expect(profile1.id).toBeTruthy();
    expect(profile2.id).toBeTruthy();
    expect(profile1.id).not.toBe(profile2.id);
  });

  // 10. deleteProfile with linked medications fails
  it('deleteProfile with linked medications fails', async () => {
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ is_default: 0 })  // profile check — not default
      .mockResolvedValueOnce({ count: 3 });       // has linked medications

    await expect(deleteProfile('p3')).rejects.toThrow(
      'Cannot delete a profile with linked medications'
    );
  });

  // Extra: addProfile uses default emoji when not specified
  it('addProfile uses default emoji when not specified', async () => {
    const profile = await addProfile('Charlie', 5);

    expect(profile.avatarEmoji).toBe('👤');
  });

  // Extra: updateProfile with empty updates is a no-op
  it('updateProfile with empty updates is a no-op', async () => {
    await updateProfile('p1', {});

    // runAsync should NOT have been called for the profile update (only getDatabase calls)
    const updateCalls = mockDb.runAsync.mock.calls.filter(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE profiles')
    );
    expect(updateCalls).toHaveLength(0);
  });

  // Extra: getProfile returns a properly mapped profile
  it('getProfile returns a properly mapped profile', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'p1',
      name: 'Alice',
      age: 30,
      avatar_emoji: '👩',
      is_default: 0,
      created_at: '2026-01-01T00:00:00Z',
    });

    const profile = await getProfile('p1');

    expect(profile).toEqual({
      id: 'p1',
      name: 'Alice',
      age: 30,
      avatarEmoji: '👩',
      isDefault: false,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });
});
