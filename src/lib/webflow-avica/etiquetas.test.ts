import { describe, expect, it } from 'vitest';
import {
  FUENTE_AVICA,
  INTERES_AVICA,
  desarrolloDePagina,
  etiquetaAvica,
  hubIdAvica,
} from './etiquetas';

const YAXNAH = '76dfb7d5-78a7-47cd-b316-faadd97f4c9e';
const NATIVA = '5c171eb4-ef42-444c-9a81-6d61a5b20813';

describe('etiquetaAvica', () => {
  it('traduce las claves de los selects de Webflow a lo que vio el visitante', () => {
    expect(etiquetaAvica(INTERES_AVICA, 'casa')).toBe('Comprar una casa');
    expect(etiquetaAvica(INTERES_AVICA, 'broker')).toBe('Soy Broker');
    expect(etiquetaAvica(FUENTE_AVICA, 'busqueda_google')).toBe('Búsqueda en Google');
  });

  it('una opción nueva en Webflow se escribe tal cual: el dato no se pierde', () => {
    expect(etiquetaAvica(INTERES_AVICA, 'terreno')).toBe('terreno');
  });

  it('sin clave no hay etiqueta', () => {
    expect(etiquetaAvica(INTERES_AVICA, null)).toBeNull();
    expect(etiquetaAvica(INTERES_AVICA, '')).toBeNull();
  });
});

describe('desarrolloDePagina', () => {
  it('reconoce las fichas /desarrollos/<slug> del CMS de Webflow', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah'))
      .toEqual({ nombre: 'Yaxnáh', hubId: YAXNAH });
    expect(desarrolloDePagina('/desarrollos/nativa-tulum'))
      .toEqual({ nombre: 'Nativa Tulum', hubId: NATIVA });
  });

  it('tolera barra final y query string', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah/?utm_source=x')?.hubId)
      .toBe(YAXNAH);
  });

  it('Real Caucel se nombra pero no tiene desarrollo en el Hub', () => {
    expect(desarrolloDePagina('/desarrollos/real-caucel')).toEqual({ nombre: 'Real Caucel', hubId: null });
  });

  it('otras páginas o slugs desconocidos no son un desarrollo', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/contacto')).toBeNull();
    expect(desarrolloDePagina('/desarrollos/otro')).toBeNull();
    expect(desarrolloDePagina('/desarrollos')).toBeNull();
    expect(desarrolloDePagina(null)).toBeNull();
  });
});

describe('hubIdAvica', () => {
  it('la página manda sobre el interés', () => {
    expect(hubIdAvica('/desarrollos/nativa-tulum', 'casa')).toBe(NATIVA);
  });

  it('una ficha sin desarrollo en el Hub NO cae al interés', () => {
    expect(hubIdAvica('/desarrollos/real-caucel', 'casa')).toBeNull();
  });

  it('fuera de una ficha decide el interés: casa → Yaxnáh, departamento → Nativa Tulum', () => {
    expect(hubIdAvica('https://www.avicainmobiliaria.com.mx/', 'casa')).toBe(YAXNAH);
    expect(hubIdAvica('/contacto', 'departamento')).toBe(NATIVA);
  });

  it('asesor, broker, una opción nueva o nada → sin proyecto', () => {
    expect(hubIdAvica('/contacto', 'asesor')).toBeNull();
    expect(hubIdAvica('/contacto', 'broker')).toBeNull();
    expect(hubIdAvica('/contacto', 'terreno')).toBeNull();
    expect(hubIdAvica(null, null)).toBeNull();
  });
});
