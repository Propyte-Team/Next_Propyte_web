#!/usr/bin/env node
/**
 * Runtime check that every TERM_LINKS entry in src/app/[locale]/glosario/page.tsx
 * points to an existing route under src/app/[locale]. Run via:
 *   node tests/qa-data/verify-glossary-links.mjs
 *
 * Exit 0 if all targets exist; 1 if any are missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const glossaryPagePath = path.join(repoRoot, 'src', 'app', '[locale]', 'glosario', 'page.tsx');
const localeRoot = path.join(repoRoot, 'src', 'app', '[locale]');

const src = fs.readFileSync(glossaryPagePath, 'utf8');

// Match: 4: '/como-invertir',
const linkRegex = /^\s*(\d+):\s*['"]([^'"]+)['"],?$/gm;
const links = [];
let m;
while ((m = linkRegex.exec(src))) {
  links.push({ termIndex: Number(m[1]), href: m[2] });
}

if (links.length === 0) {
  console.error('No TERM_LINKS entries parsed — regex may need updating.');
  process.exit(1);
}

const missing = [];
for (const { termIndex, href } of links) {
  // Strip leading slash + any trailing query/hash, take first segment.
  const route = href.replace(/^\//, '').split(/[?#]/)[0];
  const candidates = [
    path.join(localeRoot, route, 'page.tsx'),
    path.join(localeRoot, route, 'page.ts'),
  ];
  const exists = candidates.some((p) => fs.existsSync(p));
  if (!exists) {
    missing.push({ termIndex, href });
  }
}

console.log(`Checked ${links.length} TERM_LINKS entries:`);
for (const { termIndex, href } of links) {
  const ok = !missing.some((x) => x.termIndex === termIndex);
  console.log(`  term${termIndex} → ${href}  ${ok ? 'OK' : 'MISSING'}`);
}

if (missing.length > 0) {
  console.error(`\n${missing.length} broken link(s):`);
  for (const { termIndex, href } of missing) {
    console.error(`  term${termIndex} → ${href}`);
  }
  process.exit(1);
}

console.log('\nAll glossary saber-más links resolve to existing routes.');
process.exit(0);
