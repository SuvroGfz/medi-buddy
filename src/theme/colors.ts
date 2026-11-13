/**
 * MediBuddy Color Palette — Healthcare Teal
 *
 * Accessibility:
 *   Primary Dark (#0F3D3E) on white → WCAG AAA (11.9:1)
 *   Primary (#14746F) on white       → WCAG AA  (5.6:1)
 */

export const lightColors = {
  // Brand
  primaryDark: '#0F3D3E',
  primary: '#14746F',
  primaryLight: '#7ED9A6',
  surface: '#F1FBF6',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#64748B',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryLight: '#0F3D3E',

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Neutral
  disabled: '#E2E8F0',
  disabledText: '#94A3B8',
  border: '#CBD5E1',
  divider: '#F1F5F9',

  // Backgrounds
  backdrop: 'rgba(15, 61, 62, 0.5)',
  statusBar: '#0F3D3E',
} as const;

export const darkColors: ThemeColors = {
  // Brand
  primaryDark: '#0A2E2F',
  primary: '#14746F',
  primaryLight: '#7ED9A6',
  surface: '#121212',
  card: '#1E1E1E',

  // Text
  textPrimary: '#E8E8E8',
  textSecondary: '#A0A0A0',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryLight: '#0F3D3E',

  // Semantic
  success: '#22C55E',
  successLight: '#1A3A2A',
  warning: '#F59E0B',
  warningLight: '#3A3020',
  danger: '#EF4444',
  dangerLight: '#3A2020',

  // Neutral
  disabled: '#333333',
  disabledText: '#666666',
  border: '#333333',
  divider: '#2A2A2A',

  // Backgrounds
  backdrop: 'rgba(0, 0, 0, 0.7)',
  statusBar: '#0A2E2F',
} as const;

/** The shape of any color palette (light or dark). */
export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

/** Backward-compatible alias — use `useTheme().colors` in components instead. */
export const colors: ThemeColors = lightColors;

export type ColorKey = keyof ThemeColors;
