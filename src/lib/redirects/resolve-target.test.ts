import { describe, it, expect } from 'vitest';
import { resolveTarget, type RedirectMap, type RedirectRow } from './resolve-target';

/**
 * Estos tests fijan el hallazgo del 29-jul: para development/unit, `new_slug` es
 * una FOTO del momento y se podre. Medido sobre las 3,569 filas reales de
 * `real_estate_hub.slug_redirects`:
 *
 *   - 608 filas de desarrollos apuntan a un slug que hoy no existe, porque la
 *     entidad se despublicó. Un 308 hacia ahí es un 308 hacia un soft-404, que
 *     es peor señal que no redirigir.
 *   - 3 filas redirigen fuera de una URL que hoy está viva.
 *   - 11 filas apuntan a un destino obsoleto aunque la entidad siga publicada.
 *
 * Por eso development/unit se resuelven por `entity_id` contra el conjunto de
 * entidades publicadas, y no por `new_slug`.
 */

function mapa(
  filas: Array<[string, RedirectRow]>,
  vigentes: Array<[string, string]> = [],
): RedirectMap {
  return { filas: new Map(filas), slugVigentePorEntidad: new Map(vigentes) };
}

describe('resolveTarget — development / unit (filas que escribe un trigger)', () => {
  it('redirige al slug publicado HOY, ignorando el new_slug de la fila', () => {
    const m = mapa(
      [['development:manlika', { entityId: 'e1', newSlug: 'destino-podrido', kind: 'redirect' }]],
      [['e1', 'el-vigente-de-verdad']],
    );

    expect(resolveTarget(m, 'development', 'manlika')).toEqual({
      kind: 'redirect',
      slug: 'el-vigente-de-verdad',
    });
  });

  // 667 de 699 filas de desarrollos caen acá. Despublicar se revierte en un clic
  // desde el Hub, así que es 404 (no encontrada hoy) y no 410 (se fue para
  // siempre): la señal fuerte se reserva para el retiro deliberado.
  it('da 404 cuando la entidad ya no está publicada, aunque la fila traiga destino', () => {
    const m = mapa(
      [['development:manlika', { entityId: 'e1', newSlug: 'residenciales-boutique', kind: 'redirect' }]],
      [], // e1 no está publicada
    );

    expect(resolveTarget(m, 'development', 'manlika')).toEqual({ kind: 'not-found' });
  });

  // 3 filas. Redirigir aquí rompe una página que funciona.
  it('deja pasar cuando el slug pedido ES el vigente', () => {
    const m = mapa(
      [['development:sigue-vivo', { entityId: 'e1', newSlug: 'otra-cosa', kind: 'redirect' }]],
      [['e1', 'sigue-vivo']],
    );

    expect(resolveTarget(m, 'development', 'sigue-vivo')).toBeNull();
  });
});

describe('resolveTarget — unit está fuera de alcance a propósito', () => {
  /**
   * Medido en producción: /es/propiedades/<slug> con ext_publicado=false SÍ
   * renderiza, mientras /es/desarrollos/<slug> no. De 2,084 unidades solo 49 están
   * publicadas, así que tratar "publicada" como "viva" mandaría 410 a ~2,035
   * páginas que funcionan. Este test existe para que nadie reactive unidades sin
   * antes resolver ese conjunto.
   */
  it('nunca redirige una unidad, ni con fila y entidad publicada', () => {
    const m = mapa(
      [['unit:depto-viejo', { entityId: 'u9', newSlug: 'depto-nuevo', kind: 'redirect' }]],
      [['u9', 'depto-nuevo']],
    );

    expect(resolveTarget(m, 'unit', 'depto-viejo')).toBeNull();
  });

  it('tampoco aplica un gone a una unidad', () => {
    const m = mapa([['unit:x', { entityId: 'u1', newSlug: null, kind: 'gone' }]]);

    expect(resolveTarget(m, 'unit', 'x')).toBeNull();
  });

  // Confiar en `new_slug` es exactamente el error que estos tests impiden.
  it('no adivina cuando la fila no trae entity_id', () => {
    const m = mapa([['development:x', { entityId: null, newSlug: 'y', kind: 'redirect' }]], [['e1', 'y']]);

    expect(resolveTarget(m, 'development', 'x')).toBeNull();
  });

  it('respeta un gone explícito por encima del estado de la entidad', () => {
    const m = mapa(
      [['development:retirado', { entityId: 'e1', newSlug: null, kind: 'gone' }]],
      [['e1', 'sigue-publicado']],
    );

    expect(resolveTarget(m, 'development', 'retirado')).toEqual({ kind: 'gone' });
  });
});

describe('resolveTarget — blog_post (filas que escribe una persona)', () => {
  /**
   * Asimetría deliberada. Las filas de blog las escribe alguien desde el Hub al
   * retirar un artículo: `new_slug` es una decisión, no una foto, así que se
   * respeta —y sí se siguen cadenas, porque retirar B después de haber mandado
   * A→B deja A apuntando a un intermedio.
   */
  it('confía en el new_slug de la fila', () => {
    const m = mapa([['blog_post:viejo', { entityId: null, newSlug: 'nuevo', kind: 'redirect' }]]);

    expect(resolveTarget(m, 'blog_post', 'viejo')).toEqual({ kind: 'redirect', slug: 'nuevo' });
  });

  it('sigue la cadena hasta el destino final', () => {
    const m = mapa([
      ['blog_post:v1', { entityId: null, newSlug: 'v2', kind: 'redirect' }],
      ['blog_post:v2', { entityId: null, newSlug: 'v3', kind: 'redirect' }],
    ]);

    expect(resolveTarget(m, 'blog_post', 'v1')).toEqual({ kind: 'redirect', slug: 'v3' });
  });

  it('respeta un gone al final de la cadena', () => {
    const m = mapa([
      ['blog_post:v1', { entityId: null, newSlug: 'v2', kind: 'redirect' }],
      ['blog_post:v2', { entityId: null, newSlug: null, kind: 'gone' }],
    ]);

    expect(resolveTarget(m, 'blog_post', 'v1')).toEqual({ kind: 'gone' });
  });

  // Lo que no puede pasar nunca: que el middleware entre en bucle.
  it('no entra en bucle con un ciclo', () => {
    const m = mapa([
      ['blog_post:a', { entityId: null, newSlug: 'b', kind: 'redirect' }],
      ['blog_post:b', { entityId: null, newSlug: 'a', kind: 'redirect' }],
    ]);

    expect(resolveTarget(m, 'blog_post', 'a')).toBeNull();
  });

  it('no redirige un slug hacia sí mismo', () => {
    const m = mapa([['blog_post:a', { entityId: null, newSlug: 'a', kind: 'redirect' }]]);

    expect(resolveTarget(m, 'blog_post', 'a')).toBeNull();
  });

  it('no redirige si la fila no trae destino', () => {
    const m = mapa([['blog_post:a', { entityId: null, newSlug: null, kind: 'redirect' }]]);

    expect(resolveTarget(m, 'blog_post', 'a')).toBeNull();
  });

  it('corta una cadena patológicamente larga en lugar de recorrerla completa', () => {
    const filas: Array<[string, RedirectRow]> = [];
    for (let i = 0; i < 50; i++) {
      filas.push([`blog_post:s${i}`, { entityId: null, newSlug: `s${i + 1}`, kind: 'redirect' }]);
    }

    const out = resolveTarget(mapa(filas), 'blog_post', 's0');

    expect(out?.kind).toBe('redirect');
    expect(out && 'slug' in out && out.slug).toMatch(/^s\d+$/);
  });
});

describe('resolveTarget — destino de página (page:)', () => {
  // El archivo editorial (maestro §15) retira piezas cuya intención cubre un
  // hub: la fila apunta a una PÁGINA (`page:como-invertir`), no a otro artículo.
  it('resuelve un destino page: hacia la página, no hacia otro post', () => {
    const m = mapa([
      ['blog_post:argumentos-viejos', { entityId: null, newSlug: 'page:como-invertir', kind: 'redirect' }],
    ]);

    expect(resolveTarget(m, 'blog_post', 'argumentos-viejos')).toEqual({
      kind: 'redirect-page',
      slug: 'como-invertir',
    });
  });

  it('una cadena que termina en page: llega a la página', () => {
    const m = mapa([
      ['blog_post:v1', { entityId: null, newSlug: 'v2', kind: 'redirect' }],
      ['blog_post:v2', { entityId: null, newSlug: 'page:como-comprar', kind: 'redirect' }],
    ]);

    expect(resolveTarget(m, 'blog_post', 'v1')).toEqual({ kind: 'redirect-page', slug: 'como-comprar' });
  });

  // Para development el new_slug es una foto y se ignora SIEMPRE — también
  // cuando trae la forma page:.
  it('development ignora un destino page: y se resuelve por entidad', () => {
    const m = mapa(
      [['development:x', { entityId: 'e1', newSlug: 'page:como-invertir', kind: 'redirect' }]],
      [['e1', 'slug-vigente']],
    );

    expect(resolveTarget(m, 'development', 'x')).toEqual({ kind: 'redirect', slug: 'slug-vigente' });
  });
});

describe('resolveTarget — casos comunes', () => {
  it('deja pasar un slug que no está en la tabla', () => {
    expect(resolveTarget(mapa([]), 'development', 'nunca-existio')).toBeNull();
  });

  it('no cruza tipos de entidad', () => {
    const m = mapa([['blog_post:x', { entityId: null, newSlug: 'y', kind: 'redirect' }]]);

    expect(resolveTarget(m, 'development', 'x')).toBeNull();
  });
});
