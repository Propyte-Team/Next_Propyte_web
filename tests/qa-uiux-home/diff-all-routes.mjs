/**
 * Diff baseline vs current all-routes-report.
 * Run: node tests/qa-uiux-home/diff-all-routes.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(readFileSync(join(HERE, 'all-routes-report.baseline-2026-05-08.json'), 'utf8'));
const current = JSON.parse(readFileSync(join(HERE, 'all-routes-report.json'), 'utf8'));

const lines = [];
lines.push(`# UI/UX Audit Diff — dev.propyte.com`);
lines.push(``);
lines.push(`**Baseline:** ${baseline.generatedAt}`);
lines.push(`**Current:**  ${current.generatedAt}`);
lines.push(``);
lines.push(`---`);
lines.push(``);

const sumByKind = { closed: {}, open: {}, new: {} };
const perRoute = [];

for (const [name, baseData] of Object.entries(baseline.routes)) {
  const curData = current.routes[name];
  if (!curData) continue;
  for (const vp of ['mobile', 'tablet']) {
    const baseIssues = baseData.viewports?.[vp]?.issues || [];
    const curIssues = curData.viewports?.[vp]?.issues || [];

    const baseKinds = new Set(baseIssues.map(i => i.kind));
    const curKinds = new Set(curIssues.map(i => i.kind));

    const closed = [...baseKinds].filter(k => !curKinds.has(k));
    const stillOpen = [...baseKinds].filter(k => curKinds.has(k));
    const fresh = [...curKinds].filter(k => !baseKinds.has(k));

    closed.forEach(k => { sumByKind.closed[k] = (sumByKind.closed[k] || 0) + 1; });
    stillOpen.forEach(k => { sumByKind.open[k] = (sumByKind.open[k] || 0) + 1; });
    fresh.forEach(k => { sumByKind.new[k] = (sumByKind.new[k] || 0) + 1; });

    if (closed.length + fresh.length > 0 || stillOpen.length > 0) {
      perRoute.push({
        route: name,
        vp,
        closed,
        stillOpen,
        fresh,
        baseMsg: baseIssues.map(i => `${i.kind}: ${i.msg}`),
        curMsg: curIssues.map(i => `${i.kind}: ${i.msg}`),
      });
    }
  }
}

lines.push(`## Resumen agregado (route × viewport hits)`);
lines.push(``);
lines.push(`### ✅ Cerrados`);
const closedEntries = Object.entries(sumByKind.closed).sort((a, b) => b[1] - a[1]);
if (closedEntries.length === 0) {
  lines.push(`_(ninguno)_`);
} else {
  closedEntries.forEach(([k, v]) => lines.push(`- **${k}** — cerrado en ${v} route×vp`));
}
lines.push(``);

lines.push(`### ⚠️ Siguen abiertos`);
const openEntries = Object.entries(sumByKind.open).sort((a, b) => b[1] - a[1]);
if (openEntries.length === 0) {
  lines.push(`_(ninguno)_`);
} else {
  openEntries.forEach(([k, v]) => lines.push(`- **${k}** — abierto en ${v} route×vp`));
}
lines.push(``);

lines.push(`### 🆕 Nuevos (no estaban en baseline)`);
const newEntries = Object.entries(sumByKind.new).sort((a, b) => b[1] - a[1]);
if (newEntries.length === 0) {
  lines.push(`_(ninguno)_`);
} else {
  newEntries.forEach(([k, v]) => lines.push(`- **${k}** — apareció en ${v} route×vp`));
}
lines.push(``);
lines.push(`---`);
lines.push(``);
lines.push(`## Detalle por ruta`);
lines.push(``);

for (const r of perRoute) {
  lines.push(`### \`${r.route}\` — ${r.vp}`);
  lines.push(``);
  if (r.closed.length) lines.push(`- ✅ Cerrados: ${r.closed.join(', ')}`);
  if (r.stillOpen.length) lines.push(`- ⚠️ Siguen: ${r.stillOpen.join(', ')}`);
  if (r.fresh.length) lines.push(`- 🆕 Nuevos: ${r.fresh.join(', ')}`);
  lines.push(``);
  lines.push(`<details><summary>Mensajes</summary>`);
  lines.push(``);
  lines.push(`**Baseline (2026-05-08):**`);
  r.baseMsg.forEach(m => lines.push(`- ${m}`));
  lines.push(``);
  lines.push(`**Current (${current.generatedAt.slice(0,10)}):**`);
  r.curMsg.forEach(m => lines.push(`- ${m}`));
  lines.push(``);
  lines.push(`</details>`);
  lines.push(``);
}

const out = join(HERE, 'DIFF-all-routes.md');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Diff written → ${out}`);
console.log(`\nResumen:`);
console.log(`  ✅ Cerrados (kind hits): ${Object.values(sumByKind.closed).reduce((a,b)=>a+b,0)}`);
console.log(`  ⚠️  Abiertos (kind hits): ${Object.values(sumByKind.open).reduce((a,b)=>a+b,0)}`);
console.log(`  🆕 Nuevos   (kind hits): ${Object.values(sumByKind.new).reduce((a,b)=>a+b,0)}`);
