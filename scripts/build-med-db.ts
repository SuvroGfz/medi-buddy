#!/usr/bin/env ts-node
/**
 * Convert the BD medicine CSV dataset into a JSON file that can be bundled with the app.
 *
 * Input:  /tmp/bd-medicine.csv (downloaded from GitHub)
 * Output: assets/data/bd-medications.json
 *
 * Usage: npx ts-node scripts/build-med-db.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface MedRecord {
  n: string; // brand name
  g: string; // generic name
  s: string; // strength
  t: string; // type (Capsule, Tablet, etc.)
  m: string; // manufacturer
}

const CSV_PATH = '/tmp/bd-medicine.csv';
const OUT_PATH = path.join(__dirname, '..', 'assets', 'data', 'bd-medications.json');

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  // Skip header: ,Type,Name,MG,Generic Name,Company Name,Price,Link
  const records: MedRecord[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    // cols: [index, Type, Name, MG, Generic Name, Company Name, Price, Link]
    if (cols.length < 6) continue;

    const name = cols[2]?.trim();
    const generic = cols[4]?.trim();
    const strength = cols[3]?.trim();
    const type = cols[1]?.trim();
    const manufacturer = cols[5]?.trim();

    if (!name) continue;

    // Deduplicate by name+strength
    const key = `${name.toLowerCase()}|${strength.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    records.push({
      n: name,
      g: generic || '',
      s: strength || '',
      t: type || '',
      m: manufacturer || '',
    });
  }

  // Sort by name for binary search friendliness
  records.sort((a, b) => a.n.localeCompare(b.n, 'en', { sensitivity: 'base' }));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(records));

  const sizeKB = Math.round(fs.statSync(OUT_PATH).size / 1024);
  console.log(`Written ${records.length} medications to ${OUT_PATH} (${sizeKB} KB)`);
}

main();
