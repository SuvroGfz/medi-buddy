/**
 * MediBuddy Color Palette — Healthcare Teal
 *
 * Accessibility:
 *   Primary Dark (#0F3D3E) on white → WCAG AAA (11.9:1)
 *   Primary (#14746F) on white       → WCAG AA  (5.6:1)
 */

export const colors = {
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

export type ColorKey = keyof typeof colors;
