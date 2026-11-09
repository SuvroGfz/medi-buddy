import { create } from 'zustand';
import { Medication, MedicationSchedule } from '../types';
import * as db from '../db';

interface MedicationState {
  medications: Medication[];
  loading: boolean;
  error: string | null;

  loadMedications: () => Promise<void>;
  addMedication: (data: Pick<Medication, 'name'> & Partial<Pick<Medication, 'dosage' | 'notes'>>) => Promise<Medication>;
  editMedication: (id: string, data: Partial<Pick<Medication, 'name' | 'dosage' | 'notes' | 'isActive'>>) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  searchMedications: (query: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  loading: false,
  error: null,

  loadMedications: async () => {
    set({ loading: true, error: null });
    try {
      const medications = await db.getAllMedications();
      set({ medications, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addMedication: async (data) => {
    try {
      const medication = await db.createMedication(data);
      set((state) => ({
        medications: [...state.medications, medication].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));
      return medication;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  editMedication: async (id, data) => {
    try {
      await db.updateMedication(id, data);
      set((state) => ({
        medications: state.medications.map((m) =>
          m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
        ),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  removeMedication: async (id) => {
    try {
      // Cancel notifications for this medication's schedules
      const schedules = await db.getSchedulesForMedication(id);
      const { cancelAllForMedication } = await import('../services/notifications');
      await cancelAllForMedication(schedules);

      await db.deleteMedication(id);
      set((state) => ({
        medications: state.medications.filter((m) => m.id !== id),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  searchMedications: async (query) => {
    set({ loading: true });
    try {
      const medications = query
        ? await db.searchMedications(query)
        : await db.getAllMedications();
      set({ medications, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
