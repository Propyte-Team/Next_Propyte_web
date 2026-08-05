import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { INDEXNOW_KEY, toAbsoluteUrls } from './submit';

describe('IndexNow — el archivo de verificación', () => {
  // Este es el test que importa. Si la key del payload y la del archivo
  // divergen, IndexNow rechaza los envíos EN SILENCIO: no hay error, no hay
  // log, simplemente nada se indexa. Atarlos aquí es la única forma de
  // enterarse en CI y no meses después.
  const file = join(process.cwd(), 'public', `${INDEXNOW_KEY}.txt`);

  it('existe en public/ con el nombre <key>.txt', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('contiene exactamente la key, sin nada más', () => {
    expect(readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY);
  });

  it('la key cumple el formato del protocolo (8-128 chars, [a-zA-Z0-9-])', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });
});

describe('toAbsoluteUrls', () => {
  const base = 'https://propyte.com';

  it('convierte rutas relativas a absolutas', () => {
    expect(toAbsoluteUrls(['/es/blog/x'], base)).toEqual(['https://propyte.com/es/blog/x']);
  });

  it('deduplica la misma URL llegue como relativa o absoluta', () => {
    expect(toAbsoluteUrls(['/es', 'https://propyte.com/es'], base)).toEqual([
      'https://propyte.com/es',
    ]);
  });

  it('descarta otros hosts: uno solo invalida el lote entero en IndexNow', () => {
    expect(toAbsoluteUrls(['https://otro.com/x', '/es'], base)).toEqual([
      'https://propyte.com/es',
    ]);
  });

  it('ignora vacíos y basura sin reventar', () => {
    expect(toAbsoluteUrls(['', '   ', '/es'], base)).toEqual(['https://propyte.com/es']);
  });

  it('devuelve lista vacía cuando no queda nada válido', () => {
    expect(toAbsoluteUrls([], base)).toEqual([]);
  });
});
