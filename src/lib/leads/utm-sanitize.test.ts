import { describe, it, expect } from 'vitest';
import { sanitizeUtm, optionalUtmField, UTM_SAFE_REGEX } from './utm-sanitize';

// El regex original de /api/leads era `^[A-Za-z0-9._~-]{0,200}$` aplicado con
// `.regex()` dentro de un `z.object`. Un valor con espacio o acento no se
// descartaba: tumbaba el `safeParse` COMPLETO y la ruta respondia 400, asi que
// el lead se perdia entero — ni Supabase ni Zoho. `utm_campaign=Restaurante
// Corazon` (con acento) borraba a todos sus propios leads.
//
// El contrato nuevo: sanear siempre, nunca rechazar. La propiedad de seguridad
// original (la salida jamas escapa del alfabeto seguro) se mantiene intacta.

describe('sanitizeUtm', () => {
  it('conserva la atribucion de un valor con espacio y acento', () => {
    expect(sanitizeUtm('Restaurante Corazón')).toBe('Restaurante-Corazon');
  });

  it('deja intacto lo que ya era seguro', () => {
    expect(sanitizeUtm('google_ads')).toBe('google_ads');
    expect(sanitizeUtm('lp-lotes-pdc')).toBe('lp-lotes-pdc');
    expect(sanitizeUtm('cpc.2026~q3')).toBe('cpc.2026~q3');
  });

  it('trata vacio, nulo y no-string como ausencia de dato', () => {
    expect(sanitizeUtm('')).toBeNull();
    expect(sanitizeUtm('   ')).toBeNull();
    expect(sanitizeUtm(null)).toBeNull();
    expect(sanitizeUtm(undefined)).toBeNull();
    expect(sanitizeUtm(42)).toBeNull();
    expect(sanitizeUtm({ utm: 'x' })).toBeNull();
    expect(sanitizeUtm(['a'])).toBeNull();
  });

  it('devuelve null cuando no sobrevive ningun caracter util', () => {
    // Si todo se cae, el campo debe quedar ausente — nunca cadena vacia, que en
    // Zoho se veria como "atribucion conocida y vacia" en vez de "sin dato".
    expect(sanitizeUtm('¿¡!')).toBeNull();
    expect(sanitizeUtm('---')).toBeNull();
    expect(sanitizeUtm('中文')).toBeNull();
  });

  it('colapsa separadores repetidos y recorta los de los extremos', () => {
    expect(sanitizeUtm('  restaurante   corazon  ')).toBe('restaurante-corazon');
    expect(sanitizeUtm('/qr/mesa 4/')).toBe('qr-mesa-4');
  });

  it('trunca a 200 caracteres sin dejar separador colgando', () => {
    const largo = sanitizeUtm('a'.repeat(250));
    expect(largo).toHaveLength(200);

    const conCorte = sanitizeUtm(`${'a'.repeat(199)} bcdef`);
    expect(conCorte).toHaveLength(199);
    expect(conCorte?.endsWith('-')).toBe(false);
  });

  it('neutraliza intentos de inyeccion sin perder el resto del valor', () => {
    expect(sanitizeUtm('<script>alert(1)</script>')).toBe('script-alert-1-script');
    expect(sanitizeUtm("robert'); DROP TABLE leads;--")).toBe('robert-DROP-TABLE-leads');
  });

  // La invariante que hace segura toda la operacion: pase lo que pase, la
  // salida cabe en el alfabeto que el endpoint ya consideraba seguro.
  it('INVARIANTE: la salida siempre satisface el alfabeto seguro', () => {
    const hostiles = [
      'Restaurante Corazón',
      '<script>alert(1)</script>',
      'a'.repeat(500),
      '¿¡!',
      'ñoño Ñ ÁÉÍÓÚ üÜ',
      '../../etc/passwd',
      'utm|pipe&amp=1',
      '%3Cscript%3E',
      '\n\t\r inyeccion \0',
      'emoji 🎯 campana',
      "'; SELECT * FROM leads; --",
      '中文 campaign',
    ];
    for (const entrada of hostiles) {
      const salida = sanitizeUtm(entrada);
      if (salida !== null) {
        expect(UTM_SAFE_REGEX.test(salida), `entrada: ${entrada} → salida: ${salida}`).toBe(true);
      }
    }
  });
});

// Contrato entre repos: el `short_code` que estampa el Hub como `?qr=` pasa por
// este mismo saneo. `generateShortCode` (Propyte_hub/src/lib/qr/short-code.ts)
// produce base62, que cae entero dentro del alfabeto seguro — asi que debe
// sobrevivir INTACTO. Si alguien cambia el alfabeto de cualquiera de los dos
// lados, la atribucion se corromperia en silencio; este test lo delata.
describe('sanitizeUtm — short_code del QR (contrato con el Hub)', () => {
  it('un short_code base62 sobrevive sin un solo cambio', () => {
    const codigos = ['aB3xK9z', '0000000', 'ZZZZZZZ', 'qR7mN2p', '1a2B3c4'];
    for (const codigo of codigos) {
      expect(sanitizeUtm(codigo), `short_code: ${codigo}`).toBe(codigo);
    }
  });

  it('cubre todo el alfabeto base62 de generateShortCode', () => {
    const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    expect(sanitizeUtm(base62)).toBe(base62);
  });
});

describe('optionalUtmField', () => {
  it('NUNCA falla el parse — ese era el bug que perdia leads', () => {
    const hostiles = ['Restaurante Corazón', '<script>x</script>', 'a'.repeat(500), 42, null, undefined, {}];
    for (const entrada of hostiles) {
      expect(optionalUtmField.safeParse(entrada).success, `entrada: ${String(entrada)}`).toBe(true);
    }
  });

  it('entrega el valor saneado, no el crudo', () => {
    expect(optionalUtmField.parse('Restaurante Corazón')).toBe('Restaurante-Corazon');
  });

  it('normaliza la ausencia de dato a null', () => {
    expect(optionalUtmField.parse('')).toBeNull();
    expect(optionalUtmField.parse(undefined)).toBeNull();
    expect(optionalUtmField.parse(null)).toBeNull();
  });
});
