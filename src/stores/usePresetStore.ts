import { create } from 'zustand';
import { TimePreset } from '../types';
import * as db from '../db';

interface PresetState {
  presets: TimePreset[];
  loading: boolean;
  error: string | null;

  loadPresets: () => Promise<void>;
  addPreset: (data: Pick<TimePreset, 'name' | 'time' | 'icon'>) => Promise<TimePreset>;
  editPreset: (id: string, data: Partial<Pick<TimePreset, 'name' | 'time' | 'icon' | 'sortOrder'>>) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
}

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  loading: false,
  error: null,

  loadPresets: async () => {
    set({ loading: true, error: null });
    try {
      const presets = await db.getAllPresets();
      set({ presets, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addPreset: async (data) => {
    try {
      const preset = await db.createPreset(data);
      set((state) => ({
        presets: [...state.presets, preset].sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      return preset;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  editPreset: async (id, data) => {
    try {
      await db.updatePreset(id, data);

      // If time changed, reschedule all linked notifications
      if (data.time) {
        const preset = await db.getPresetById(id);
        if (preset) {
          const { reschedulePresetNotifications } = await import('../services/notifications');
          await reschedulePresetNotifications(id, data.time, data.name ?? preset.name);
        }
      }

      set((state) => ({
        presets: state.presets
          .map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          )
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  removePreset: async (id) => {
    try {
      await db.deletePreset(id);
      set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },
}));
