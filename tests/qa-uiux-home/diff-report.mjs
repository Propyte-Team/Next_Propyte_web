/** Generate human-readable before/after delta report from report.json. */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const current = JSON.parse(readFileSync(join(HERE, 'report.json'), 'utf8'));

// Snapshot pre-fixes (from initial audit before any code changes)
const baseline = {
  local: {
    desktop: { h1: '56px', h2: '36px', h3: '18px', overflow: false, tapTargets: 0, contrast: 10 },
    tablet:  { h1: '54px', h2: '36px', h3: '18px', overflow: true, overflowPx: 28, tapTargets: 0, contrast: 10 },
    mobile:  { h1: '36px', h2: '28px', h3: '18px', overflow: false, tapTargets: 37, contrast: 8 },
  },
  staging: {
    desktop: { h1: '56px', h2: '36px', h3: '14px', overflow: false, tapTargets: 0, contrast: 9 },
    tablet:  { h1: '54px', h2: '36px', h3: '14px', overflow: true, overflowPx: 28, tapTargets: 0, contrast: 9 },
    mobile:  { h1: '36px', h2: '28px', h3: '14px', overflow: false, tapTargets: 39, contrast: 9 },
  },
};

function snap(viewport) {
  const d = viewport.design;
  const tt = viewport.issues.find((i) => i.kind === 'tap-target');
  const ct = viewport.issues.find((i) => i.kind === 'a11y-contrast');
  const ov = viewport.issues.find((i) => i.kind === 'overflow-x');
  return {
    h1: d.h1?.fontSize ?? '—',
    h2: d.h2?.fontSize ?? '—',
    h3: d.h3?.fontSize ?? '—',
    overflow: !!ov,
    overflowPx: ov ? Number(ov.msg.match(/(\d+)px > (\d+)px/)?.[1] ?? 0) - Number(ov.msg.match(/(\d+)px > (\d+)px/)?.[2] ?? 0) : 0,
    tapTargets: tt ? Number(tt.msg.match(/^(\d+)/)?.[1] ?? 0) : 0,
    contrast: ct ? Number(ct.msg.match(/^(\d+)/)?.[1] ?? 0) : 0,
  };
}

function row(label, before, after) {
  const fmt = (v) => (typeof v === 'boolean' ? (v ? '❌ true' : '✅ false') : v);
  const same = String(before) === String(after);
  const arrow = same ? '=' : '→';
  return `| ${label} | ${fmt(before)} | ${arrow} | ${fmt(after)} |`;
}

const lines = [];
lines.push('# UI/UX Audit — Diff before/after\n');
lines.push(`Generado: ${new Date().toISOString()}\n`);
lines.push('Comparativa entre el estado **antes** de los fixes (baseline del primer audit) y el **estado actual** (después de aplicar tipografía fluida + P0 fixes).\n');

for (const target of ['local', 'staging']) {
  lines.push(`\n## ${target.toUpperCase()} — ${current.targets[target].url}\n`);
  for (const vp of ['desktop', 'tablet', 'mobile']) {
    const before = baseline[target][vp];
    const after = snap(current.targets[target].viewports[vp]);
    lines.push(`\n### ${vp}\n`);
    lines.push('| Métrica | Antes | | Ahora |');
    lines.push('|---|---|:-:|---|');
    lines.push(row('h1 fontSize', before.h1, after.h1));
    lines.push(row('h2 fontSize', before.h2, after.h2));
    lines.push(row('h3 fontSize', before.h3, after.h3));
    lines.push(row('overflow-x', before.overflow, after.overflow));
    if (before.overflowPx || after.overflowPx) {
      lines.push(row('overflow extra px', before.overflowPx + 'px', after.overflowPx + 'px'));
    }
    lines.push(row('tap-targets <36px', before.tapTargets, after.tapTargets));
    lines.push(row('contrast samples (mostly false+)', before.contrast, after.contrast));
  }
}

lines.push('\n---\n');
lines.push('## Notas\n');
lines.push('- **staging** sigue mostrando los valores baseline porque su build no se ha redeployado desde los fixes — los números cambiarán cuando hagas `vercel --prod` desde `develop`.');
lines.push('- **local** refleja el estado de la rama actual.');
lines.push('- Las "muestras de contraste" son en su mayoría falsos positivos del analyzer (texto blanco sobre overlay con padre transparente). Verificado manualmente con `find-teal-on-light.mjs`: 0 hits reales sobre fondo claro.');
lines.push('- Tap targets restantes en mobile son dots de carruseles secundarios (TrendingMarket / FeaturedProperties / etc.). El patrón de fix está documentado en `Testimonials.tsx:88-99`.');
lines.push('\n## Sistema tipográfico nuevo\n');
lines.push('Las utilities Tailwind `text-2xs/xs/sm/base/lg/xl/2xl/3xl/4xl/5xl/6xl/7xl` ahora son **fluidas** (clamp 320→1440). h2 y h3 escalan suavemente entre breakpoints en lugar de saltar discretamente.');

const out = lines.join('\n') + '\n';
writeFileSync(join(HERE, 'DIFF.md'), out, 'utf8');
console.log(out);
