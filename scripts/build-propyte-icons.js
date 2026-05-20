// Generator: reads SVGs from public/img/icons/propyte/ and emits src/lib/propyte-icons.tsx
// Run when the designer entrega más iconos: `node scripts/build-propyte-icons.js`
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'public', 'img', 'icons', 'propyte');
const outPath = path.join(__dirname, '..', 'src', 'lib', 'propyte-icons.tsx');

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.svg')).sort();

const toPascal = (slug) =>
  slug.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

const jsxify = (s) =>
  s
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/stroke-dasharray/g, 'strokeDasharray')
    .replace(/stroke-miterlimit/g, 'strokeMiterlimit')
    .replace(/fill-rule/g, 'fillRule')
    .replace(/clip-rule/g, 'clipRule')
    .replace(/clip-path/g, 'clipPath');

const bodies = {};
for (const f of files) {
  const slug = f.replace(/\.svg$/, '');
  const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
  const match = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!match) continue;
  let inner = match[1].trim();
  inner = jsxify(inner);
  inner = inner.replace(/\s*stroke="currentColor"/g, '');
  // Stripear cualquier strokeWidth hardcoded ("1", "1.5", "2", "2.5"...) para
  // que gane el default del wrapper (1.5 desde createIcon). Si el SVG trae
  // strokeWidth="2", anula el default y los iconos se ven más gruesos de lo
  // que la marca quiere. Fix iter 2026-05-20 noche después de svgs_mas.zip.
  inner = inner.replace(/\s*strokeWidth="[\d.]+"/g, '');
  inner = inner.replace(/\s*strokeLinecap="round"/g, '');
  inner = inner.replace(/\s*strokeLinejoin="round"/g, '');
  inner = inner.replace(/\s*fill="none"/g, '');
  inner = inner.replace(/<path([^/>]*?)\/>/g, '<path$1 />');
  bodies[slug] = inner;
}

let out = `// Auto-generated from designer-provided SVGs (svgs_corregido2.zip / svgs_finales_2/).
// Source SVGs live under public/img/icons/propyte/.
// Do not edit by hand — regenerate via the script in .tmp-icons-new/.
import { forwardRef } from 'react';
import type { LucideProps } from 'lucide-react';

export type PropyteIconProps = Omit<LucideProps, 'iconNode'>;

type Opts = { flipX?: boolean };

const createIcon = (
  name: string,
  body: React.ReactNode,
  opts: Opts = {}
) =>
  forwardRef<SVGSVGElement, PropyteIconProps>(function PropyteIcon(
    { size = 24, strokeWidth = 1.5, color = 'currentColor', className, style, ...rest },
    ref,
  ) {
    const merged: React.CSSProperties = opts.flipX
      ? { ...style, transform: \`scaleX(-1)\${style?.transform ? ' ' + style.transform : ''}\` }
      : (style as React.CSSProperties);
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={merged}
        data-propyte-icon={name}
        {...rest}
      >
        {body}
      </svg>
    );
  });

`;

const slugs = Object.keys(bodies).sort();
for (const slug of slugs) {
  const pascal = toPascal(slug);
  out += `export const ${pascal} = createIcon('${slug}', <>${bodies[slug]}</>);\n`;
}

// Synthetic ChevronRight = ChevronLeft mirrored horizontally
if (bodies['chevron-left']) {
  out += `\n// Synthetic: chevron-right is chevron-left mirrored on X axis\n`;
  out += `export const ChevronRight = createIcon('chevron-right', <>${bodies['chevron-left']}</>, { flipX: true });\n`;
}

fs.writeFileSync(outPath, out);
console.log('Wrote', outPath);
console.log('Components:', slugs.length + (bodies['chevron-left'] ? 1 : 0));
