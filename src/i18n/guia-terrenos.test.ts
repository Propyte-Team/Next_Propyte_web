import { describe, expect, it } from 'vitest';
import es from './messages/es.json';
import en from './messages/en.json';

// El copy de la guía de terrenos no lleva cifras a propósito: los precios, los
// plazos y las entregas salen del inventario en tiempo de render. Una cifra
// escrita aquí envejece sin que nadie la vuelva a mirar, así que estos tests la
// prohíben en vez de confiar en que nadie la escriba.

type Namespace = Record<string, unknown>;

const nsEs = (es as unknown as { guias: { terrenosResidenciales: Namespace } })
  .guias.terrenosResidenciales;
const nsEn = (en as unknown as { guias: { terrenosResidenciales: Namespace } })
  .guias.terrenosResidenciales;

const IDIOMAS = [
  { locale: 'es', ns: nsEs, marcaEquipo: 'nuestro equipo' },
  { locale: 'en', ns: nsEn, marcaEquipo: 'our team' },
] as const;

/** Cadenas del namespace, aplanadas: los arrays entran elemento por elemento. */
function cadenas(ns: Namespace): Array<[string, string]> {
  const salida: Array<[string, string]> = [];
  for (const [clave, valor] of Object.entries(ns)) {
    if (typeof valor === 'string') salida.push([clave, valor]);
    else if (Array.isArray(valor)) {
      valor.forEach((v, i) => {
        if (typeof v === 'string') salida.push([`${clave}[${i}]`, v]);
      });
    }
  }
  return salida;
}

// El cierre lo firma el equipo, no un asesor: el Gamma del que sale este copy
// venía en primera persona del singular y con firma personal. Esto barre el
// PATRÓN, no los literales del original —un guardia que solo conoce dos frases
// pasa en verde con el original apenas reformulado, y eso ya se midió—.
const VOZ_PERSONAL: ReadonlyArray<readonly [string, RegExp]> = [
  // Inglés. `\bI\b` cubre I, I'd, I'll, I'm: el apóstrofo es frontera de palabra.
  ['en: I', /\bI\b/],
  ['en: my', /\bmy\b/i],
  ['en: mine', /\bmine\b/i],
  ['en: personally', /\bpersonally\b/i],
  ['en: myself', /\bmyself\b/i],
  // Español. Pronombres y posesivos de primera persona del singular, más los
  // verbos que delatan a un asesor hablando de sí mismo.
  ['es: yo', /\byo\b/i],
  ['es: mi/mis', /\bmis?\b/i],
  ['es: mío/mía', /\bmí[oa]s?\b/i],
  ['es: conmigo', /\bconmigo\b/i],
  ['es: soy', /\bsoy\b/i],
  ['es: personalmente', /\bpersonalmente\b/i],
  ['es: me + verbo', /\bme (encantar|gustar|dar[íi]a|comprometo)/i],
];

/** Devuelve las marcas de voz personal que encuentra. Vacío = voz de equipo. */
function vozPersonal(texto: string): string[] {
  return VOZ_PERSONAL.filter(([, re]) => re.test(texto)).map(([nombre]) => nombre);
}

describe('guias.terrenosResidenciales', () => {
  it('tiene exactamente las mismas claves en los dos idiomas', () => {
    expect(Object.keys(nsEn).sort()).toEqual(Object.keys(nsEs).sort());
  });

  it.each(IDIOMAS)('ninguna cadena queda vacía ($locale)', ({ ns }) => {
    const encontradas = cadenas(ns);
    expect(encontradas.length).toBeGreaterThan(0);
    for (const [clave, valor] of encontradas) {
      expect(valor.trim(), clave).not.toBe('');
    }
  });

  it.each(IDIOMAS)('ninguna cadena lleva cifras, salvo `edicion` ($locale)', ({ ns }) => {
    // Los placeholders de next-intl —{meses}, {enganche}— no llevan dígitos, así
    // que pasan solos. `edicion` es la única excepción: ahí el año es el dato.
    const conDigito = cadenas(ns)
      .filter(([clave]) => clave !== 'edicion')
      .filter(([, valor]) => /\d/.test(valor))
      .map(([clave, valor]) => `${clave}: ${valor}`);
    expect(
      conDigito,
      `estas cadenas llevan una cifra que envejecerá sin que nadie la mire:\n${conDigito.join('\n')}`,
    ).toEqual([]);
  });

  it.each(IDIOMAS)('`edicion` sí lleva el año ($locale)', ({ ns }) => {
    expect(String(ns.edicion)).toMatch(/\d{4}/);
  });

  it.each(IDIOMAS)('`cierreBullets` son cinco cadenas no vacías ($locale)', ({ ns }) => {
    const bullets = ns.cierreBullets;
    expect(Array.isArray(bullets)).toBe(true);
    expect(bullets as unknown[]).toHaveLength(5);
    for (const b of bullets as unknown[]) {
      expect(typeof b).toBe('string');
      expect(String(b).trim()).not.toBe('');
    }
  });

  it.each(IDIOMAS)('los rótulos de base de precio traen sus placeholders ($locale)', ({ ns }) => {
    // Un placeholder mal escrito en un solo idioma es un texto roto en
    // producción que nadie ve hasta que lo ve un cliente.
    expect(String(ns.baseContadoParcial)).toContain('{enganche}');
    expect(String(ns.baseContadoParcial)).toContain('{contraentrega}');
    expect(String(ns.basePlazo)).toContain('{meses}');
    // `baseContado` es el caso sin variable: no debe llevar ninguna.
    expect(String(ns.baseContado)).not.toMatch(/\{[^}]+\}/);
  });

  describe('el cierre lo firma el equipo, no un asesor', () => {
    it('el guardia muerde el cierre original de Gamma (control positivo)', () => {
      // Sin este control el guardia es teatro. Se ejercita con el cierre
      // personal del documento de origen, apenas reformulado: si el guardia se
      // relaja hasta dejar pasar esto, este test cae antes que el copy.
      expect(
        vozPersonal(
          "I would be delighted to help you find the project. My goal is not to sell you a project",
        ),
      ).not.toEqual([]);
      expect(
        vozPersonal('me encantaría ayudarte personalmente, soy tu asesor'),
      ).not.toEqual([]);
    });

    it('el guardia no muerde un cierre en voz de equipo (control negativo)', () => {
      expect(vozPersonal('Nuestro equipo puede acompañarte a encontrar el proyecto.')).toEqual([]);
      expect(vozPersonal('Our team can help you find the project that fits you.')).toEqual([]);
    });

    it.each(IDIOMAS)('el cierre publicado no habla en singular ($locale)', ({ ns }) => {
      // Solo el bloque narrativo del cierre: los botones del formulario sí van
      // en primera persona del comprador ("Agendar mi videollamada").
      const bloque = [
        String(ns.cierreTitle),
        String(ns.cierreBody),
        ...(ns.cierreBullets as string[]),
      ].join(' ');
      const marcas = vozPersonal(bloque);
      expect(marcas, `voz personal en el cierre: ${marcas.join(', ')}`).toEqual([]);
      expect(bloque).not.toMatch(/Sanfilippo/i);
    });

    it.each(IDIOMAS)('el cierre nombra al equipo ($locale)', ({ ns, marcaEquipo }) => {
      // Prohibir el singular no basta: un cierre impersonal también lo pasaría.
      // La regla es que hable el equipo, así que se exige positivamente.
      expect(String(ns.cierreBody).toLowerCase()).toContain(marcaEquipo);
    });
  });
});
