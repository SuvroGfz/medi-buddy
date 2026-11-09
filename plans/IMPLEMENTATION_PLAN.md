# MediBuddy — Implementation Plan

> **Version:** 1.0  
> **Created:** 2026-11-09  
> **Status:** Draft — awaiting user review  

---

## 1. Project Overview

**MediBuddy** is a cross-platform mobile application that helps users manage daily medication routines through smart alarms and configurable meal-time presets. The core problem: people forget to take their daily medications amidst busy schedules. MediBuddy solves this with a clean, simple interface and reliable notifications.

### Core Features (MVP)

1. **Medication List** — Add, edit, and remove medications with details (name, dosage, notes)
2. **Alarm Scheduling** — Set specific times for each medication to trigger a notification/alarm
3. **Meal-Time Presets** — Configurable time slots (e.g., "Before Morning Meal" = 9:00 AM) that can be linked to multiple medications. Changing the preset time updates all linked medications automatically
4. **Notifications** — Reliable local push notifications that work even when the app is closed, with snooze and "taken" actions

---

## 2. Technology Stack

### Decision: **React Native + Expo (TypeScript)**

| Criteria | React Native (Expo) | Flutter |
|---|---|---|
| Language | TypeScript | Dart |
| Cross-platform | ✅ Android + iOS | ✅ Android + iOS |
| Local notifications | `expo-notifications` (first-party) | `flutter_local_notifications` (community) |
| OTA updates | ✅ EAS Update (push JS fixes without app store review) | ❌ Requires third-party (Shorebird) |
| Dev speed | Very fast via Expo Go + Development Builds | Requires full native toolchain |
| Ecosystem | Massive (npm/JS ecosystem) | Growing |
| Exact alarms | ✅ Supported via config plugin | ✅ Supported via manifest |

**Why Expo?**
- First-party `expo-notifications` handles scheduled local alarms, boot persistence, and exact alarm permissions out of the box
- TypeScript is widely known — easier to maintain and hand off
- EAS Build can produce both Android APK/AAB and iOS IPA from a single codebase
- OTA updates let us push bug fixes instantly
- Medicine reminder apps qualify for Android's `SCHEDULE_EXACT_ALARM` permission under Google Play policy

### Key Dependencies

| Package | Purpose |
|---|---|
| `expo` (~52) | Core framework |
| `expo-router` | File-based navigation |
| `expo-notifications` | Local scheduled notifications + alarm channels |
| `expo-device` | Device detection for notification setup |
| `expo-sqlite` | Local database for medications, presets, logs |
| `@react-native-async-storage/async-storage` | Lightweight key-value storage for settings |
| `react-native-reanimated` | Smooth animations |
| `react-native-gesture-handler` | Swipe-to-delete and gestures |
| `date-fns` | Date/time utilities |
| `zustand` | Lightweight state management |

---

## 3. Color Palette & Design System

### Palette: Healthcare Teal (blended from Classic Teal + Mint Cream)

Inspired by the two palettes you shared, optimized for healthcare context and accessibility:

| Role | Color | Hex | Usage | WCAG w/ White |
|---|---|---|---|---|
| **Primary Dark** | Deep Teal | `#0F3D3E` | Headers, nav bar, status bar | AAA (11.9:1) ✅ |
| **Primary** | Teal | `#14746F` | Buttons, active states, FAB | AA (5.6:1) ✅ |
| **Primary Light** | Mint | `#7ED9A6` | Subtle highlights, progress bars | — (use dark text) |
| **Surface** | Mint Cream | `#F1FBF6` | Screen backgrounds | — (use dark text) |
| **Card** | White | `#FFFFFF` | Cards, modals, input fields | — |
| **Text Primary** | Near Black | `#1A1A2E` | Body text, headings | AAA on white |
| **Text Secondary** | Slate | `#64748B` | Captions, helper text | AA on white |
| **Success** | Green | `#22C55E` | "Taken" status | — |
| **Warning** | Amber | `#F59E0B` | "Missed" / approaching deadline | — |
| **Danger** | Red | `#EF4444` | Delete actions, critical alerts | — |
| **Disabled** | Light Gray | `#E2E8F0` | Disabled buttons, dividers | — |

### Accessibility Commitments

- All text on colored backgrounds meets **WCAG 2.1 AA** minimum (4.5:1 for normal text, 3:1 for large text)
- Touch targets minimum **44×44dp** (per Apple HIG and Material Design)
- Font sizes: minimum 14sp for body text, 12sp for captions
- Icons always paired with labels or descriptive text for screen readers
- Color is never the sole indicator of state — always paired with icons/text

### Typography

| Style | Size | Weight | Use |
|---|---|---|---|
| Heading 1 | 28sp | Bold | Screen titles |
| Heading 2 | 22sp | SemiBold | Section titles |
| Body | 16sp | Regular | General text |
| Body Small | 14sp | Regular | Secondary info |
| Caption | 12sp | Regular | Timestamps, labels |
| Button | 16sp | SemiBold | Button labels |

### Spacing & Layout

- Base unit: **4dp**
- Padding: 16dp (screen edges), 12dp (card internal)
- Card border radius: 12dp
- Button border radius: 8dp
- Bottom navigation height: 64dp

---

## 4. Data Model

### SQLite Schema

```sql
-- Configurable time presets (e.g., "Before Morning Meal" = 09:00)
CREATE TABLE time_presets (
  id          TEXT PRIMARY KEY,  -- UUID
  name        TEXT NOT NULL,     -- "Before Morning Meal"
  time        TEXT NOT NULL,     -- "09:00" (HH:mm, 24h)
  icon        TEXT,              -- emoji or icon name
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Medications
CREATE TABLE medications (
  id              TEXT PRIMARY KEY,  -- UUID
  name            TEXT NOT NULL,     -- "Metformin"
  dosage          TEXT,              -- "500mg"
  notes           TEXT,              -- "Take with food"
  is_active       INTEGER DEFAULT 1, -- 0 = paused
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- Link table: which medications are scheduled at which times
-- A medication can have multiple schedules (morning + evening)
-- A time preset can have multiple medications
CREATE TABLE medication_schedules (
  id                  TEXT PRIMARY KEY,
  medication_id       TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time_preset_id      TEXT REFERENCES time_presets(id) ON DELETE SET NULL,
  custom_time         TEXT,              -- "14:30" if not using a preset
  notification_id     TEXT,              -- expo notification identifier for cancellation
  days_of_week        TEXT DEFAULT '1,2,3,4,5,6,7', -- 1=Mon..7=Sun, CSV
  is_active           INTEGER DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (time_preset_id IS NOT NULL OR custom_time IS NOT NULL)
);

-- Log of medication intake
CREATE TABLE intake_log (
  id              TEXT PRIMARY KEY,
  schedule_id     TEXT NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  medication_id   TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time  TEXT NOT NULL,     -- "09:00"
  action          TEXT NOT NULL,     -- 'taken', 'skipped', 'snoozed'
  action_at       TEXT NOT NULL,     -- ISO timestamp
  notes           TEXT
);
```

### Key Relationship: Meal-Time Presets → Medications

```
┌──────────────────┐       ┌───────────────────────┐       ┌──────────────────┐
│   Time Preset    │──1:N──│  Medication Schedule   │──N:1──│   Medication     │
│                  │       │                        │       │                  │
│ "Morning Meal"   │       │ preset_id OR           │       │ "Metformin"      │
│ time: "09:00"    │       │ custom_time: "14:30"   │       │ "500mg"          │
└──────────────────┘       └───────────────────────┘       └──────────────────┘
```

When a user changes the preset time from 09:00 → 11:00:
1. Update `time_presets.time` to "11:00"
2. Cancel all existing notifications for schedules linked to this preset
3. Re-schedule notifications at the new time
4. All three morning medications now fire at 11:00 — zero individual edits needed

---

## 5. Screens & Navigation

### Navigation Structure (expo-router, tab-based)

```
app/
├── _layout.tsx              # Root layout with notification setup
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator (3 tabs)
│   ├── index.tsx            # Home / Today screen
│   ├── medications.tsx      # Medication list
│   └── settings.tsx         # Settings & time presets
├── medication/
│   ├── [id].tsx             # View/edit medication detail
│   └── add.tsx              # Add new medication
├── preset/
│   ├── [id].tsx             # Edit time preset
│   └── add.tsx              # Add new time preset
└── schedule/
    └── add.tsx              # Add schedule to a medication
```

### Screen-by-Screen Breakdown

#### Screen 1: Home / Today (Tab 1 — default)
**Purpose:** At-a-glance view of today's medication schedule

**Layout:**
- **Header:** "Today" with current date, greeting
- **Timeline view:** Vertically sorted by time, grouped by preset
  - Each group shows the preset name and time (e.g., "🌅 Morning Meal — 9:00 AM")
  - Under each group: medication cards with name, dosage, and action buttons
- **Action buttons per medication:** "Take" (green), "Skip" (gray), "Snooze 10m" (amber)
- **Status indicators:** ✅ Taken, ⏭ Skipped, ⏰ Upcoming, ❌ Missed (past + not taken)
- **Empty state:** Friendly illustration + "Add your first medication" CTA

#### Screen 2: Medications List (Tab 2)
**Purpose:** Manage all medications

**Layout:**
- **Header:** "My Medications" with search bar
- **FAB (Floating Action Button):** "+" to add a new medication (Primary teal)
- **List:** Cards for each medication showing:
  - Medication name and dosage
  - Next scheduled time(s) as chips
  - Active/paused toggle
  - Swipe left to delete (with confirmation)
- **Tap card** → navigates to medication detail/edit
- **Empty state:** "No medications yet" + add button

#### Screen 3: Add/Edit Medication (Modal/Push screen)
**Purpose:** Create or modify a medication entry

**Fields:**
- Medication name (required, text input)
- Dosage (optional, text input — e.g., "500mg", "1 tablet")
- Notes (optional, multiline — e.g., "Take with food")
- **Schedule section:**
  - "Add Schedule" button → opens schedule picker
  - Shows existing schedules as removable chips
  - Each schedule: choose a time preset OR set a custom time
  - Day-of-week selector (pills for Mon–Sun, all selected by default)
- Save / Cancel buttons

#### Screen 4: Schedule Picker (Bottom sheet / Modal)
**Purpose:** Choose when to take this medication

**Layout:**
- **Section 1: "Use a Preset"**
  - List of existing presets (e.g., "🌅 Before Morning Meal — 9:00 AM")
  - Tap to select
- **Section 2: "Custom Time"**
  - Time picker (native)
- **Day selector** — pills for each day of the week

#### Screen 5: Settings (Tab 3)
**Purpose:** App settings and time preset management

**Layout:**
- **Section: "Meal Time Presets"**
  - List of all presets with their times
  - Each item shows: icon, name, time, count of linked medications
  - Tap → edit preset (change time, rename)
  - Swipe to delete (warns if medications are linked)
  - "Add Preset" button
- **Section: "Notification Settings"**
  - Sound on/off toggle
  - Vibration on/off toggle
  - Snooze duration picker (5, 10, 15, 30 min)
- **Section: "App"**
  - About
  - Version info

#### Screen 6: Edit Time Preset (Push screen / Modal)
**Purpose:** Modify a meal-time preset

**Fields:**
- Preset name (text input)
- Time (time picker)
- Icon picker (emoji grid — 🌅🌞🌆🌙🍳🥗🍽️💊)
- **Preview:** "X medications will be updated to [new time]"
- Save / Cancel

### Screen Flow Diagram

```
                    ┌─────────────────┐
                    │    App Launch    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
              ┌─────│   Tab Navigator  │─────┐
              │     └────────┬────────┘      │
              │              │               │
     ┌────────▼──────┐ ┌────▼─────┐ ┌───────▼──────┐
     │  🏠 Home/Today │ │ 💊 Meds   │ │ ⚙️ Settings   │
     │  (Timeline)   │ │ (List)   │ │ (Presets +   │
     │               │ │          │ │  Notif cfg)  │
     └───────────────┘ └────┬─────┘ └──────┬───────┘
                            │              │
                   ┌────────▼──────┐ ┌─────▼────────┐
                   │ Add/Edit Med  │ │ Add/Edit     │
                   │ + Schedule    │ │ Time Preset  │
                   └───────────────┘ └──────────────┘
```

---

## 6. Notification Architecture

### Flow

```
User sets schedule
       │
       ▼
┌──────────────────────────┐
│ expo-notifications       │
│ scheduleNotification()   │
│ - channelId: "med-alarm" │
│ - trigger: daily repeat  │
│ - content: med name,     │
│   dosage, preset name    │
│ - actions: Take, Snooze  │
└──────────┬───────────────┘
           │
    ┌──────▼──────┐
    │ OS Scheduler │
    │ (AlarmMgr /  │
    │  UNNotif)    │
    └──────┬──────┘
           │ fires at scheduled time
    ┌──────▼──────────────────┐
    │ Notification appears    │
    │ even if app is closed   │
    │ Sound + vibration       │
    │ Actions: [Take] [Snooze]│
    └─────────────────────────┘
```

### Android-Specific Setup

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification_icon.png",
        "color": "#14746F",
        "defaultChannel": "med-alarm",
        "sounds": ["./assets/alarm_sound.wav"]
      }]
    ],
    "android": {
      "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]
    }
  }
}
```

### Notification Channel (Android)

- Channel: `med-alarm` — importance MAX, custom sound, vibration pattern, lockscreen visible
- This ensures the notification behaves like an alarm, not a silent push

### Notification Lifecycle

1. **On schedule create:** `Notifications.scheduleNotificationAsync()` → store returned `notificationId` in DB
2. **On preset time change:** cancel all linked notification IDs → re-schedule at new time
3. **On medication delete:** cancel its notification IDs
4. **On "Take" action:** log intake, mark as taken in DB
5. **On "Snooze" action:** schedule a one-shot notification for +X minutes
6. **On app launch:** verify all active schedules have valid notifications (recover after app reinstall/crash)

---

## 7. Default Time Presets (Pre-seeded)

| Preset | Default Time | Icon |
|---|---|---|
| Before Morning Meal | 08:00 AM | 🌅 |
| After Morning Meal | 09:00 AM | 🌞 |
| Before Lunch | 12:30 PM | ☀️ |
| After Lunch | 01:30 PM | 🌤️ |
| Before Dinner | 07:00 PM | 🌆 |
| After Dinner | 08:00 PM | 🌙 |
| Bedtime | 10:00 PM | 😴 |

Users can add/edit/delete these. All times are configurable.

---

## 8. Implementation Phases

### Phase 1: Foundation (Slices 1–3)
> **Goal:** App boots, navigation works, database is set up, basic medication CRUD

| # | Slice | Deliverable | Verify |
|---|---|---|---|
| 1 | Project scaffold | Expo project, TypeScript config, folder structure, Git init (master) | `npx expo start` shows splash |
| 2 | Database + models | SQLite schema, migrations, CRUD operations, Zustand stores | Unit tests pass for CRUD |
| 3 | Medication list screen | List medications, add/delete, empty state | Can add and see a medication |

### Phase 2: Scheduling (Slices 4–6)
> **Goal:** Time presets work, medications can be scheduled, presets cascade changes

| # | Slice | Deliverable | Verify |
|---|---|---|---|
| 4 | Time presets | CRUD for presets, settings screen, default seed data | Can create/edit/delete presets |
| 5 | Schedule linking | Link medications to presets or custom times, day-of-week | Schedule shows on med detail |
| 6 | Preset cascade | Changing a preset time re-links all medications | Change preset → all linked meds update |

### Phase 3: Notifications (Slices 7–8)
> **Goal:** Alarms fire reliably, user can interact with them

| # | Slice | Deliverable | Verify |
|---|---|---|---|
| 7 | Notification setup | Channel config, permission flow, scheduling engine | Test notification fires on time |
| 8 | Notification actions | Take/Snooze from notification, intake logging | Tap "Take" → logged in DB |

### Phase 4: Home Screen & Polish (Slices 9–10)
> **Goal:** Today view works, app is polished and release-ready

| # | Slice | Deliverable | Verify |
|---|---|---|---|
| 9 | Home / Today screen | Timeline view, status indicators, action buttons | Today shows all scheduled meds |
| 10 | Polish & UX | Animations, empty states, error handling, accessibility audit | Manual test on Android + iOS |

---

## 9. Git Strategy

```
master ← production-ready code
  └── feature/scaffold        ← Phase 1, Slice 1
  └── feature/database        ← Phase 1, Slices 2–3
  └── feature/scheduling      ← Phase 2, Slices 4–6
  └── feature/notifications   ← Phase 3, Slices 7–8
  └── feature/home-polish     ← Phase 4, Slices 9–10
```

- **Branch naming:** `feature/<name>`
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Merge:** Squash-merge feature branches into master when a phase is complete
- **No GitHub yet** — local Git only, ready for remote connection later

---

## 10. Folder Structure

```
medi-buddy/
├── app/                          # expo-router screens
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home / Today
│   │   ├── medications.tsx       # Medication list
│   │   └── settings.tsx          # Settings
│   ├── medication/
│   │   ├── [id].tsx
│   │   └── add.tsx
│   ├── preset/
│   │   ├── [id].tsx
│   │   └── add.tsx
│   └── schedule/
│       └── add.tsx
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── MedicationCard.tsx
│   │   ├── PresetChip.tsx
│   │   ├── TimelineItem.tsx
│   │   ├── DaySelector.tsx
│   │   ├── EmptyState.tsx
│   │   └── ...
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # SQL schema definitions
│   │   ├── migrations.ts         # Migration runner
│   │   ├── medications.ts        # Medication CRUD
│   │   ├── presets.ts            # Preset CRUD
│   │   ├── schedules.ts         # Schedule CRUD
│   │   └── intake.ts            # Intake log CRUD
│   ├── stores/                   # Zustand state stores
│   │   ├── useMedicationStore.ts
│   │   ├── usePresetStore.ts
│   │   └── useSettingsStore.ts
│   ├── services/                 # Business logic
│   │   └── notifications.ts     # Notification scheduling engine
│   ├── theme/                    # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── utils/                    # Helpers
│   │   ├── time.ts              # Time formatting, parsing
│   │   └── uuid.ts              # ID generation
│   └── types/                    # TypeScript types
│       └── index.ts
├── assets/                       # Images, sounds, fonts
│   ├── notification_icon.png
│   ├── alarm_sound.wav
│   └── images/
├── plans/                        # This document lives here
│   └── IMPLEMENTATION_PLAN.md
├── app.json                      # Expo config
├── tsconfig.json
├── package.json
└── README.md
```

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Android kills background notifications | Notifications don't fire | Use MAX importance channel + exact alarm permission + boot receiver (all handled by expo-notifications) |
| iOS 64-notification limit | Can't schedule more than 64 | Schedule only upcoming 7 days of notifications, refresh weekly |
| Preset cascade breaks notifications | Stale alarms fire at old times | Always cancel-then-reschedule; verify on app launch |
| expo-sqlite migration issues | Data loss on schema change | Versioned migrations with rollback |
| Expo Go limitations | Can't test notifications in Expo Go | Use EAS Development Build for notification testing |

---

## 12. Out of Scope (Future Features)

These are explicitly **not** in the MVP but could be added later:

- Cloud sync / backup (requires backend)
- Medication inventory / refill tracking
- Doctor/pharmacy contact integration
- Medication interaction warnings
- Family member medication management
- Dark mode (theme infrastructure supports it, but not in v1)
- Medication photos
- History/analytics dashboard
