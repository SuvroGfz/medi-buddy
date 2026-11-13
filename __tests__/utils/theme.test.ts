import { colors, lightColors, darkColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, touchTarget } from '../../src/theme/spacing';

describe('theme', () => {
  describe('colors', () => {
    it('has all required color keys', () => {
      expect(colors.primaryDark).toBe('#0F3D3E');
      expect(colors.primary).toBe('#14746F');
      expect(colors.primaryLight).toBe('#7ED9A6');
      expect(colors.surface).toBe('#F1FBF6');
      expect(colors.card).toBe('#FFFFFF');
      expect(colors.textPrimary).toBe('#1A1A2E');
      expect(colors.textSecondary).toBe('#64748B');
      expect(colors.textOnPrimary).toBe('#FFFFFF');
    });

    it('has semantic colors', () => {
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.danger).toBeDefined();
    });

    it('all color values are valid hex or rgba', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      const rgbaPattern = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;
      for (const [key, value] of Object.entries(colors)) {
        expect(
          hexPattern.test(value) || rgbaPattern.test(value)
        ).toBe(true);
      }
    });

    it('colors is an alias for lightColors', () => {
      expect(colors).toBe(lightColors);
    });

    it('darkColors has the same keys as lightColors', () => {
      const lightKeys = Object.keys(lightColors).sort();
      const darkKeys = Object.keys(darkColors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });

    it('darkColors has dark surface values', () => {
      expect(darkColors.surface).toBe('#121212');
      expect(darkColors.card).toBe('#1E1E1E');
    });
  });

  describe('typography', () => {
    it('has all text styles', () => {
      expect(typography.h1).toBeDefined();
      expect(typography.h2).toBeDefined();
      expect(typography.body).toBeDefined();
      expect(typography.bodySmall).toBeDefined();
      expect(typography.caption).toBeDefined();
      expect(typography.button).toBeDefined();
    });

    it('body text is at least 14sp for accessibility', () => {
      expect(typography.body.fontSize).toBeGreaterThanOrEqual(14);
      expect(typography.bodySmall.fontSize).toBeGreaterThanOrEqual(14);
    });

    it('caption is at least 12sp', () => {
      expect(typography.caption.fontSize).toBeGreaterThanOrEqual(12);
    });
  });

  describe('spacing', () => {
    it('base unit is 4', () => {
      expect(spacing.xs).toBe(4);
    });

    it('all values are multiples of 4', () => {
      for (const [, value] of Object.entries(spacing)) {
        expect(value % 4).toBe(0);
      }
    });
  });

  describe('touchTarget', () => {
    it('minimum is 44dp (Apple HIG / Material)', () => {
      expect(touchTarget.min).toBe(44);
    });
  });
});
