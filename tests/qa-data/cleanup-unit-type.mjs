#!/usr/bin/env node
/**
 * Identifies + (optionally) normalizes unit_type values that are out of the
 * supported i18n enum (8 values: departamento, penthouse, terreno, macrolote,
 * casa, studio, townhouse, local_comercial).
 *
 * Detected once in the wild: '1BR/1BA' (Sesión 32 backlog). The page already
 * has a defensive try/catch wrapper (commit 23dde3f), so missing translations
 * fall back to the raw string. This script handles the data-side fix so
 * Supabase rows match the enum.
 *
 * Run dry (preview only):
 *   node tests/qa-data/cleanup-unit-type.mjs
 * Run apply (mutate DB):
 *   APPLY=1 node tests/qa-data/cleanup-unit-type.mjs
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (or .env.local).
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const apply = process.env.APPLY === '1';

const VALID_TYPES = new Set([
  'departamento',
  'penthouse',
  'terreno',
  'macrolote',
  'casa',
  'studio',
  'townhouse',
  'local_comercial',
]);

// Heuristic remap from common wild values → canonical enum.
const REMAP = {
  '1BR/1BA': 'departamento',
  '2BR/2BA': 'departamento',
  '3BR/2BA': 'departamento',
  '3BR/3BA': 'departamento',
  '4BR/3BA': 'casa',
  apartment: 'departamento',
  apt: 'departamento',
  condo: 'departamento',
  ph: 'penthouse',
  lot: 'terreno',
  land: 'terreno',
  house: 'casa',
  villa: 'casa',
};

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Mode: ${apply ? 'APPLY (will mutate)' : 'DRY (preview only)'}`);
  const { data, error } = await supabase
    .schema('real_estate_hub')
    .from('Propyte_unidades')
    .select('id, unit_number, unit_type')
    .order('id');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  const offenders = (data ?? []).filter(
    (r) => r.unit_type && !VALID_TYPES.has(r.unit_type),
  );

  if (offenders.length === 0) {
    console.log('No rows with out-of-enum unit_type. Done.');
    return;
  }

  // Group by unique value
  const byValue = new Map();
  for (const row of offenders) {
    const arr = byValue.get(row.unit_type) ?? [];
    arr.push(row);
    byValue.set(row.unit_type, arr);
  }

  console.log(`\nFound ${offenders.length} row(s) across ${byValue.size} distinct value(s):`);
  for (const [value, rows] of byValue) {
    const target = REMAP[value] ?? null;
    console.log(`  '${value}' × ${rows.length}  →  ${target ?? '<no remap>'}`);
  }

  const remappable = offenders.filter((r) => REMAP[r.unit_type]);
  const unmapped = offenders.filter((r) => !REMAP[r.unit_type]);

  console.log(`\nRemappable: ${remappable.length}`);
  console.log(`Unmapped (manual review): ${unmapped.length}`);

  if (!apply) {
    console.log('\nDry run only. Re-run with APPLY=1 to mutate.');
    return;
  }

  let updated = 0;
  for (const row of remappable) {
    const target = REMAP[row.unit_type];
    const { error: upErr } = await supabase
      .schema('real_estate_hub')
      .from('Propyte_unidades')
      .update({ unit_type: target })
      .eq('id', row.id);
    if (upErr) {
      console.error(`Failed to update ${row.id}: ${upErr.message}`);
      continue;
    }
    updated++;
  }
  console.log(`\nUpdated ${updated} row(s).`);
  if (unmapped.length > 0) {
    console.log('\nManual review needed for these unit_type values:');
    for (const row of unmapped) {
      console.log(`  id=${row.id} unit=${row.unit_number ?? '—'} type='${row.unit_type}'`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
