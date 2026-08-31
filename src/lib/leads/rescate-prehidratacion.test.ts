import { describe, it, expect } from 'vitest';
import { rescatarDelDom } from './rescate-prehidratacion';

/**
 * Lo que se prueba aquí es la PRECEDENCIA, que es donde estaba el bug: al
 * enviar se leía el estado de React y el estado estaba vacío aunque el campo
 * se viera lleno. La prueba de que el rescate funciona de verdad contra un
 * navegador —autocompletado que rellena sin disparar `change`— vive en
 * `tests/e2e/forms-prehidratacion.spec.ts`, porque eso no se puede simular
 * sin un DOM.
 */

function formularioCon(entradas: Record<string, string>): FormData {
  const campos = new FormData();
  for (const [clave, valor] of Object.entries(entradas)) campos.append(clave, valor);
  return campos;
}

describe('rescatarDelDom', () => {
  it('el DOM gana cuando React nunca se enteró de lo que se escribió', () => {
    // El caso real: autocompletado antes de hidratar. Los inputs están llenos
    // y el estado sigue en ''. Antes del arreglo se enviaba esto vacío.
    const campos = formularioCon({ name: 'Ana Ruiz', email: 'ana@example.com' });

    expect(rescatarDelDom(campos, { name: '', email: '' })).toEqual({
      name: 'Ana Ruiz',
      email: 'ana@example.com',
    });
  });

  it('no rompe el camino normal: si el estado ya coincide, devuelve lo mismo', () => {
    const campos = formularioCon({ name: 'Ana Ruiz', email: 'ana@example.com' });

    expect(
      rescatarDelDom(campos, { name: 'Ana Ruiz', email: 'ana@example.com' }),
    ).toEqual({ name: 'Ana Ruiz', email: 'ana@example.com' });
  });

  it('en el teléfono manda el estado: el DOM enseña formato, el estado guarda E.164', () => {
    // Si ganara el DOM, a Zoho llegaría «+52 984 123 4567» con espacios en vez
    // del E.164 que espera field-maps.
    const campos = formularioCon({ phone: '+52 984 123 4567' });

    expect(
      rescatarDelDom(campos, { phone: '+529841234567' }, { estadoManda: ['phone'] }),
    ).toEqual({ phone: '+529841234567' });
  });

  it('pero el DOM sigue siendo la red de seguridad del teléfono si el estado está vacío', () => {
    const campos = formularioCon({ phone: '+529841234567' });

    expect(
      rescatarDelDom(campos, { phone: undefined }, { estadoManda: ['phone'] }),
    ).toEqual({ phone: '+529841234567' });
  });

  it('un campo sin `name` en el HTML se queda con el estado, nunca se vacía', () => {
    // Garantía de que el rescate no puede empeorar ningún campo: lo que no
    // aparece en el FormData conserva lo que tenía React.
    const campos = formularioCon({ name: 'Ana Ruiz' });

    expect(rescatarDelDom(campos, { name: '', budget: '2M MXN' })).toEqual({
      name: 'Ana Ruiz',
      budget: '2M MXN',
    });
  });

  it('recorta los espacios de lo que venga del DOM', () => {
    const campos = formularioCon({ name: '  Ana Ruiz  ', email: ' ' });

    expect(rescatarDelDom(campos, { name: '', email: 'ana@example.com' })).toEqual({
      name: 'Ana Ruiz',
      // El campo solo tenía espacios: eso no es un dato, gana el estado.
      email: 'ana@example.com',
    });
  });
});
