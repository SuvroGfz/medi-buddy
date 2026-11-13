// Mock the JSON database
jest.mock('../../assets/data/bd-medications.json', () => [
  { n: 'Napa', g: 'Paracetamol', s: '500 mg', t: 'Tablet', m: 'Beximco Pharma' },
  { n: 'Napa Extra', g: 'Paracetamol + Caffeine', s: '500 mg + 65 mg', t: 'Tablet', m: 'Beximco Pharma' },
  { n: 'Azimax', g: 'Azithromycin', s: '500 mg', t: 'Capsule', m: 'ACI Ltd.' },
  { n: 'Seclo', g: 'Omeprazole', s: '20 mg', t: 'Capsule', m: 'Square Pharma' },
  { n: 'Seclo 40', g: 'Omeprazole', s: '40 mg', t: 'Capsule', m: 'Square Pharma' },
  { n: 'Amoxil', g: 'Amoxicillin', s: '500 mg', t: 'Capsule', m: 'GSK' },
  { n: 'Panadol', g: 'Paracetamol', s: '500 mg', t: 'Tablet', m: 'GSK' },
], { virtual: true });

import { searchMedications, getMedicationCount } from '../../src/db/medicationLookup';

describe('Medication Lookup', () => {
  it('returns empty array for queries shorter than 2 characters', () => {
    expect(searchMedications('')).toEqual([]);
    expect(searchMedications('N')).toEqual([]);
  });

  it('searches by brand name prefix (case-insensitive)', () => {
    const results = searchMedications('nap');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].brandName).toBe('Napa');
  });

  it('searches by generic name substring', () => {
    const results = searchMedications('paracetamol');
    expect(results.length).toBeGreaterThanOrEqual(1);
    // Should find Napa and Panadol (both contain Paracetamol as generic)
    const names = results.map((r) => r.brandName);
    expect(names).toContain('Napa');
    expect(names).toContain('Panadol');
  });

  it('prioritizes prefix matches over substring matches', () => {
    const results = searchMedications('sec');
    expect(results[0].brandName).toBe('Seclo');
  });

  it('respects the limit parameter', () => {
    const results = searchMedications('a', 2);
    // 'a' is only 1 char, should return empty
    expect(results).toEqual([]);

    const results2 = searchMedications('am', 1);
    expect(results2.length).toBeLessThanOrEqual(1);
  });

  it('returns MedicationEntry objects with correct fields', () => {
    const results = searchMedications('Azimax');
    expect(results.length).toBe(1);
    expect(results[0]).toEqual({
      brandName: 'Azimax',
      genericName: 'Azithromycin',
      strength: '500 mg',
      type: 'Capsule',
      manufacturer: 'ACI Ltd.',
    });
  });

  it('getMedicationCount returns total count', () => {
    expect(getMedicationCount()).toBe(7);
  });
});
