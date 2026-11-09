import { SEED_PRESETS, SCHEMA_VERSION } from '../../src/db/schema';

describe('schema', () => {
  it('has 7 default preset seeds', () => {
    expect(SEED_PRESETS).toHaveLength(7);
  });

  it('all presets have valid time format', () => {
    for (const preset of SEED_PRESETS) {
      expect(preset.time).toMatch(/^\d{2}:\d{2}$/);
      const [h, m] = preset.time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(23);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(59);
    }
  });

  it('all presets have required fields', () => {
    for (const preset of SEED_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.icon).toBeTruthy();
      expect(typeof preset.sortOrder).toBe('number');
    }
  });

  it('presets are sorted by sortOrder', () => {
    for (let i = 1; i < SEED_PRESETS.length; i++) {
      expect(SEED_PRESETS[i].sortOrder).toBeGreaterThan(
        SEED_PRESETS[i - 1].sortOrder
      );
    }
  });

  it('schema version is a positive integer', () => {
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
  });
});
