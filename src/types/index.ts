/** Core domain types for MediBuddy */

export interface TimePreset {
  id: string;
  name: string;
  time: string; // HH:mm (24h)
  icon: string; // emoji
  sortOrder: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  timePresetId: string | null;
  customTime: string | null; // HH:mm if not using preset
  notificationId: string | null;
  daysOfWeek: string; // "1,2,3,4,5,6,7" (1=Mon..7=Sun)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeLog {
  id: string;
  scheduleId: string;
  medicationId: string;
  scheduledTime: string; // HH:mm
  action: 'taken' | 'skipped' | 'snoozed';
  actionAt: string; // ISO 8601
  notes: string | null;
}

/** Joined type for display purposes */
export interface ScheduleWithDetails {
  schedule: MedicationSchedule;
  medication: Medication;
  preset: TimePreset | null;
  effectiveTime: string; // resolved HH:mm
}

/** Grouped schedules for the Today screen */
export interface TimeGroup {
  label: string; // preset name or "Custom"
  icon: string;
  time: string; // HH:mm
  items: ScheduleWithDetails[];
}

/** Notification settings persisted in AsyncStorage */
export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeDurationMinutes: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeDurationMinutes: 10,
};

export const ALL_DAYS = '1,2,3,4,5,6,7';

export const DAY_LABELS: Record<string, string> = {
  '1': 'Mon',
  '2': 'Tue',
  '3': 'Wed',
  '4': 'Thu',
  '5': 'Fri',
  '6': 'Sat',
  '7': 'Sun',
};
