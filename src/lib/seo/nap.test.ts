import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  NAP_ADDRESS,
  NAP_ADDRESS_LINE_ES,
  NAP_ADDRESS_LINE_EN,
  NAP_EMAIL,
  NAP_GEO,
  NAP_OPENING_HOURS,
  NAP_SAME_AS,
  GBP_CID,
  GBP_URL,
  GBP_EMBED_URL,
} from './nap';

/**
 * El NAP vivía en cinco lugares y divergió sin que nadie lo notara: el JSON-LD
 * publicaba una calle y un CP que no eran los de la ficha, un email que no era
 * el público, y un horario que cerraba en domingo cuando la oficina abre los
 * siete días. El daño es silencioso — no rompe el build ni la página, solo
 * debilita la señal que Google usa para rankear en Maps y manda gente a una
 * puerta que cree cerrada.
 *
 * Estas pruebas fijan los valores contra la ficha verificada y vigilan que
 * nadie vuelva a hardcodear un NAP paralelo en el código.
 */

const SRC = join(process.cwd(), 'src');

/** Valores muertos que NO deben reaparecer en el código. */
const VALORES_OBSOLETOS = [
  { patron: '77710', porque: 'CP viejo; el de la ficha es 77720' },
  { patron: 'Calle 5 Norte 95', porque: 'dirección que nunca fue la de la ficha' },
  { patron: 'Av. 10 Norte', porque: 'tercera calle inventada, vivía en los mensajes de i18n' },
  { patron: 'info@propyte.com', porque: 'buzón no público; el correcto es contacto@propyte.com' },
  { patron: '9:00 – 18:00', porque: 'horario viejo; abre todos los días 10:00–19:00' },
  { patron: '10:00 – 14:00', porque: 'sábado corto que ya no existe' },
];

/**
 * `nap.ts` se excluye a propósito: su documentación cita los valores viejos para
 * explicar de qué se corrigieron. Es la única mención legítima que queda.
 */
const EXCEPTUADOS = ['nap.ts'];

function archivosFuente(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivosFuente(ruta));
    } else if (
      /\.(ts|tsx|json)$/.test(entrada) &&
      !entrada.endsWith('.test.ts') &&
      !EXCEPTUADOS.includes(entrada)
    ) {
      // Los .json entran a propósito: los mensajes de i18n escondían dos
      // direcciones más (una calle distinta en `contact.info.address` y otra en
      // `dondeEstamos.labAddress`, esta última renderizada en la home). Un
      // escaneo que solo mire TypeScript los deja pasar.
      salida.push(ruta);
    }
  }
  return salida;
}

describe('NAP canónico', () => {
  it('coincide con la ficha de Google Business Profile', () => {
    expect(NAP_ADDRESS.postalCode).toBe('77720');
    expect(NAP_ADDRESS.streetAddress).toBe('5ta Avenida esquina Calle 40 Norte');
    expect(NAP_ADDRESS.addressLocality).toBe('Playa del Carmen');
    expect(NAP_ADDRESS.addressCountry).toBe('MX');
    expect(NAP_EMAIL).toBe('contacto@propyte.com');
  });

  it('fija las coordenadas del pin, no el centroide de la calle', () => {
    expect(NAP_GEO.latitude).toBeCloseTo(20.6364179, 6);
    expect(NAP_GEO.longitude).toBeCloseTo(-87.0655601, 6);
  });

  it('enlaza la ficha por CID en hasMap, sameAs y el embed', () => {
    expect(GBP_URL).toBe(`https://maps.google.com/?cid=${GBP_CID}`);
    expect(GBP_EMBED_URL).toContain(`cid=${GBP_CID}`);
    expect(GBP_EMBED_URL).toContain('output=embed');
    // El CSP solo permite www.google.com en frame-src; maps.google.com se
    // bloquea, y hoy en report-only el fallo sería invisible.
    expect(GBP_EMBED_URL).toContain('https://www.google.com/');
    expect(GBP_EMBED_URL).not.toContain('https://maps.google.com');
    // El embed por búsqueda de texto no ata el sitio a la ficha.
    expect(GBP_EMBED_URL).not.toContain('?q=');
    expect(NAP_SAME_AS).toContain(GBP_URL);
  });

  it('declara los siete días de 10:00 a 19:00', () => {
    // Publicar un día como cerrado cuando sí abre le cuesta visitas reales:
    // quien consulta en domingo ve "cerrado" y no viene.
    expect(NAP_OPENING_HOURS).toHaveLength(1);
    const [tramo] = NAP_OPENING_HOURS;
    expect(tramo.dayOfWeek).toHaveLength(7);
    expect(tramo.dayOfWeek).toContain('Sunday');
    expect(tramo.dayOfWeek).toContain('Saturday');
    expect(tramo.opens).toBe('10:00');
    expect(tramo.closes).toBe('19:00');
  });

  it('mantiene el CP y la esquina en la dirección de una línea', () => {
    for (const linea of [NAP_ADDRESS_LINE_ES, NAP_ADDRESS_LINE_EN]) {
      expect(linea).toContain('77720');
      expect(linea).toContain('Playa del Carmen');
    }
  });
});

describe('ningún NAP paralelo en el código', () => {
  const fuentes = archivosFuente(SRC);

  it('encuentra archivos que revisar', () => {
    expect(fuentes.length).toBeGreaterThan(0);
  });

  for (const { patron, porque } of VALORES_OBSOLETOS) {
    it(`no reaparece "${patron}" (${porque})`, () => {
      const culpables = fuentes.filter((f) => readFileSync(f, 'utf8').includes(patron));
      expect(culpables.map((f) => f.replace(SRC, 'src'))).toEqual([]);
    });
  }
});
