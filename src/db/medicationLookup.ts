/**
 * BD Medication Database — offline autocomplete search.
 *
 * The database is a bundled JSON file (~2 MB) containing ~20K medicines
 * from Bangladesh. Each entry has: n (name), g (generic), s (strength),
 * t (type), m (manufacturer).
 *
 * Search is case-insensitive prefix/substring matching on brand name and
 * generic name. Results are capped to avoid rendering thousands of items.
 */

export interface MedicationEntry {
  brandName: string;
  genericName: string;
  strength: string;
  type: string;
  manufacturer: string;
}

interface RawEntry {
  n: string;
  g: string;
  s: string;
  t: string;
  m: string;
}

let cachedDB: RawEntry[] | null = null;

function getDB(): RawEntry[] {
  if (!cachedDB) {
    // Metro can resolve JSON requires from assets at bundle time
    cachedDB = require('../../assets/data/bd-medications.json') as RawEntry[];
  }
  return cachedDB;
}

function toEntry(raw: RawEntry): MedicationEntry {
  return {
    brandName: raw.n,
    genericName: raw.g,
    strength: raw.s,
    type: raw.t,
    manufacturer: raw.m,
  };
}

/**
 * Search medications by query string.
 * Matches brand name and generic name (case-insensitive substring).
 * Returns at most `limit` results (default 20).
 */
export function searchMedications(
  query: string,
  limit: number = 20
): MedicationEntry[] {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  const db = getDB();
  const results: MedicationEntry[] = [];

  // Prioritize prefix matches on brand name, then substring matches
  const prefixMatches: MedicationEntry[] = [];
  const substringMatches: MedicationEntry[] = [];

  for (const entry of db) {
    if (prefixMatches.length + substringMatches.length >= limit * 2) break;

    const nameLower = entry.n.toLowerCase();
    const genericLower = entry.g.toLowerCase();

    if (nameLower.startsWith(q)) {
      prefixMatches.push(toEntry(entry));
    } else if (nameLower.includes(q) || genericLower.includes(q)) {
      substringMatches.push(toEntry(entry));
    }
  }

  // Prefix matches first, then substring matches
  results.push(...prefixMatches.slice(0, limit));
  if (results.length < limit) {
    results.push(...substringMatches.slice(0, limit - results.length));
  }

  return results.slice(0, limit);
}

/**
 * Get total count of medications in the database.
 */
export function getMedicationCount(): number {
  return getDB().length;
}
