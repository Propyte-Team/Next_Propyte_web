import { describe, expect, it } from 'vitest';
import { resolverProyectoZoho } from './resolve-proyecto-interes';

const YAXNAH_HUB = '76dfb7d5-4755-4938-8bf2-07aed5d2df15';
const ZOHO_YAXNAH = '6040986000097746005';

/** Mapa falso Hub → Zoho: registra a quién le preguntaron. */
function mapaFalso(mapa: Record<string, string>) {
  const preguntas: string[] = [];
  const buscar = async (hubId: string) => {
    preguntas.push(hubId);
    return mapa[hubId] ?? null;
  };
  return { buscar, preguntas };
}

describe('resolverProyectoZoho', () => {
  it('avica_contacto: la ficha → desarrollo del Hub → id de Zoho', async () => {
    const { buscar, preguntas } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    const id = await resolverProyectoZoho(
      null, 'avica_contacto',
      { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah' },
      buscar,
    );
    expect(id).toBe(ZOHO_YAXNAH);
    expect(preguntas).toEqual([YAXNAH_HUB]);
  });

  it('avica_contacto sin ficha: decide el interés', async () => {
    const { buscar } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/', interestOption: 'casa' }, buscar),
    ).toBe(ZOHO_YAXNAH);
  });

  it('sin desarrollo del Hub no se consulta el mapa', async () => {
    const { buscar, preguntas } = mapaFalso({});
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/real-caucel' }, buscar),
    ).toBeUndefined();
    expect(preguntas).toEqual([]);
  });

  it('el mapa sin id de Zoho → sin proyecto, sin fallar', async () => {
    const { buscar } = mapaFalso({});
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah' }, buscar),
    ).toBeUndefined();
  });

  it('broker, newsletter y las fuentes de propyte.com sin unidad → sin proyecto', async () => {
    const { buscar, preguntas } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    const ficha = { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah', interestOption: 'casa' };
    expect(await resolverProyectoZoho(null, 'avica_broker', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'avica_newsletter', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'contact', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'property_inquiry', {}, buscar)).toBeUndefined();
    expect(preguntas).toEqual([]);
  });
});
