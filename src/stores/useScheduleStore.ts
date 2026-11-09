import { create } from 'zustand';
import { ScheduleWithDetails, TimeGroup, IntakeLog, MedicationSchedule } from '../types';
import * as db from '../db';

interface ScheduleState {
  todaySchedules: ScheduleWithDetails[];
  timeGroups: TimeGroup[];
  intakeLogs: IntakeLog[];
  loading: boolean;
  error: string | null;

  loadTodaySchedules: () => Promise<void>;
  loadIntakeLogs: () => Promise<void>;
  addSchedule: (data: {
    medicationId: string;
    timePresetId?: string;
    customTime?: string;
    daysOfWeek?: string;
  }) => Promise<MedicationSchedule>;
  removeSchedule: (id: string) => Promise<void>;
  logAction: (data: {
    scheduleId: string;
    medicationId: string;
    scheduledTime: string;
    action: 'taken' | 'skipped' | 'snoozed';
  }) => Promise<void>;
  getSchedulesForMedication: (medicationId: string) => Promise<MedicationSchedule[]>;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  todaySchedules: [],
  timeGroups: [],
  intakeLogs: [],
  loading: false,
  error: null,

  loadTodaySchedules: async () => {
    set({ loading: true, error: null });
    try {
      const todaySchedules = await db.getTodaySchedules();
      const timeGroups = db.groupSchedulesByTime(todaySchedules);
      set({ todaySchedules, timeGroups, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadIntakeLogs: async () => {
    try {
      const intakeLogs = await db.getTodayIntakeLogs();
      set({ intakeLogs });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addSchedule: async (data) => {
    try {
      const schedule = await db.createSchedule(data);

      // Schedule the notification
      if (data.timePresetId || data.customTime) {
        const { getMedicationById } = await import('../db/medications');
        const { getPresetById } = await import('../db/presets');
        const { scheduleNotification } = await import('../services/notifications');

        const medication = await getMedicationById(data.medicationId);
        let effectiveTime = data.customTime;
        let presetName: string | undefined;

        if (data.timePresetId) {
          const preset = await getPresetById(data.timePresetId);
          if (preset) {
            effectiveTime = preset.time;
            presetName = preset.name;
          }
        }

        if (medication && effectiveTime) {
          await scheduleNotification(schedule, medication, effectiveTime, presetName);
        }
      }

      // Reload
      const todaySchedules = await db.getTodaySchedules();
      const timeGroups = db.groupSchedulesByTime(todaySchedules);
      set({ todaySchedules, timeGroups });

      return schedule;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  removeSchedule: async (id) => {
    try {
      // Cancel notification if any
      const allSchedules = await db.getTodaySchedules();
      const target = allSchedules.find((s) => s.schedule.id === id);
      if (target?.schedule.notificationId) {
        const { cancelNotification } = await import('../services/notifications');
        await cancelNotification(target.schedule.notificationId);
      }

      await db.deleteSchedule(id);

      const todaySchedules = await db.getTodaySchedules();
      const timeGroups = db.groupSchedulesByTime(todaySchedules);
      set({ todaySchedules, timeGroups });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  logAction: async (data) => {
    try {
      await db.logIntake(data);

      // If snoozed, schedule a snooze notification
      if (data.action === 'snoozed') {
        const { getMedicationById } = await import('../db/medications');
        const { scheduleSnooze } = await import('../services/notifications');
        const medication = await getMedicationById(data.medicationId);
        if (medication) {
          await scheduleSnooze(medication, data.scheduleId, data.scheduledTime);
        }
      }

      const intakeLogs = await db.getTodayIntakeLogs();
      set({ intakeLogs });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  getSchedulesForMedication: async (medicationId) => {
    return db.getSchedulesForMedication(medicationId);
  },
}));
