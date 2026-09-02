import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { toProxyImages } from '@/lib/images/proxyUrl';

// El proxy de imágenes existe para que el navegador no vea el host de Supabase
// ni el nombre de archivo: pide `/propyte-media/d/<uuid>/<idx>.webp` y la ruta
// sirve los bytes. `queries.ts` lo aplica con `maskRows`, pero `guia-terrenos.ts`
// consulta `v_developments` directo y se lo salta si nadie lo pone a mano.
//
// Se saltó de verdad: la guía salió a producción el 2026-09-02 publicando las
// URLs crudas del storage, y no se vio porque las imágenes cargan igual. Es un
// fallo invisible a ojo, así que va con guardia de fuente — no hay forma de
// testear esto desde `agruparPorProyecto`, que recibe los datos ya construidos.
describe('la guía sirve las fotos por el proxy, no crudas', () => {
  const rutaFuente = path.resolve(__dirname, 'guia-terrenos.ts');
  const fuente = readFileSync(rutaFuente, 'utf8');

  it('el campo `imagenes` se puebla pasando por `toProxyImages`', () => {
    const asignaciones = [...fuente.matchAll(/^\s*imagenes:\s*(.+)$/gm)].map((m) => m[1].trim());
    expect(asignaciones.length, 'no se encontró ninguna asignación de `imagenes`').toBeGreaterThan(0);

    // La del tipo (`imagenes: string[];`) no es una asignación; se descarta.
    const reales = asignaciones.filter((a) => !/^string\[\];?$/.test(a));
    expect(reales.length, 'no se encontró la asignación real de `imagenes`').toBeGreaterThan(0);

    const crudas = reales.filter((a) => !a.includes('toProxyImages') && !a.includes('dev.imagenes'));
    expect(
      crudas,
      `hay asignaciones de \`imagenes\` que no pasan por el proxy: ${crudas.join(' · ')}`,
    ).toEqual([]);
  });

  it('el módulo importa el helper del proxy', () => {
    expect(fuente).toMatch(/import\s*\{[^}]*toProxyImages[^}]*\}\s*from\s*'@\/lib\/images\/proxyUrl'/);
  });
});

// Control de que el helper hace lo que este arreglo asume: si algún día cambia
// de forma, el test de arriba seguiría pasando mientras la URL sale mal.
describe('toProxyImages sobre una portada real del inventario', () => {
  const real =
    'https://oaijxdpevakashxshhvm.supabase.co/storage/v1/object/public/property-images/desarrollo/09d27fcb-bbaf-4bb5-a7de-6d07a6575ec0/1787602924918-kgh74p.webp';

  it('oculta el host y el nombre de archivo', () => {
    const [url] = toProxyImages([real], 'd', '09d27fcb-bbaf-4bb5-a7de-6d07a6575ec0');
    expect(url).toBe('/propyte-media/d/09d27fcbbbaf4bb5a7de6d07a6575ec0/0.webp');
    expect(url).not.toContain('supabase.co');
    expect(url).not.toContain('kgh74p');
  });

  it('deja pasar una URL que no es de Supabase', () => {
    const externa = 'https://images.unsplash.com/photo-123.jpg';
    expect(toProxyImages([externa], 'd', '09d27fcb-bbaf-4bb5-a7de-6d07a6575ec0')).toEqual([externa]);
  });
});
