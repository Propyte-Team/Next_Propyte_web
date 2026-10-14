import { describe, expect, it } from 'vitest';
import { CAMPO_TRAMPA, aFormData, fuenteAvica, leerEnvio, motivoDescarte, type EnvioAvica } from './envio';

/** Forma real del webhook form_submission de Webflow; los datos son inventados. */
function webhook(
  data: Record<string, unknown>,
  extra: Record<string, unknown> = {},
  formulario = 'Email Footer',
) {
  return {
    triggerType: 'form_submission',
    payload: {
      name: formulario,
      siteId: '660ddb316dd471209be88ddc',
      data,
      submittedAt: '2026-10-14T17:20:00.000Z',
      id: 'evento-1',
      formId: 'formulario-1',
      ...extra,
    },
  };
}

const LEGITIMO = {
  nombre: '  Ana María Ruiz ',
  tel: '999 123 4567',
  correo: 'Ana.Ruiz@Example.com ',
  ciudad: 'Mérida',
  interes_en: 'casa',
  nos_encontro_en: 'busqueda_google',
  mensaje: '¿Tienen casas de 3 recámaras?',
  'Field 8': 'false',
};

const leido = (data: Record<string, unknown>, extra = {}, formulario?: string) =>
  leerEnvio(webhook(data, extra, formulario)) as EnvioAvica;

describe('leerEnvio', () => {
  it('toma los campos del formulario y los limpia', () => {
    expect(leido(LEGITIMO, { publishedPath: '/desarrollos/yaxnah' })).toEqual<EnvioAvica>({
      formulario: 'Email Footer',
      pagina: '/desarrollos/yaxnah',
      nombre: 'Ana María Ruiz',
      telefono: '999 123 4567',
      correo: 'ana.ruiz@example.com',
      ciudad: 'Mérida',
      interes: 'casa',
      fuente: 'busqueda_google',
      mensaje: '¿Tienen casas de 3 recámaras?',
      esBroker: false,
      trampa: null,
    });
  });

  it('los vacíos quedan en null y un correo mal escrito se ignora', () => {
    expect(leido({ nombre: 'Juan', tel: '', correo: 'juan@', mensaje: '   ' })).toMatchObject({
      nombre: 'Juan', telefono: null, correo: null, mensaje: null, ciudad: null, interes: null, pagina: null,
    });
  });

  it('sin publishedPath usa la ruta de pageUrl', () => {
    expect(leido(LEGITIMO, { pageUrl: 'https://www.avicainmobiliaria.com.mx/contacto?utm_source=x' }).pagina)
      .toBe('/contacto');
  });

  it('el newsletter manda su correo en «correo_newsletter»', () => {
    expect(leido({ correo_newsletter: 'Lector@Example.com' }, {}, 'Email Form')).toMatchObject({
      formulario: 'Email Form', correo: 'lector@example.com',
    });
  });

  it('la casilla de broker: «Field 8» sin publicar, «es_broker» publicada, texto o booleano', () => {
    expect(leido({ ...LEGITIMO, 'Field 8': 'true' }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': undefined, es_broker: 'true' }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': undefined, es_broker: true }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': 'false' }).esBroker).toBe(false);
    expect(leido({ nombre: 'Juan', correo: 'juan@example.com' }).esBroker).toBe(false);
  });

  it('lee el campo trampa', () => {
    expect(leido({ ...LEGITIMO, [CAMPO_TRAMPA]: 'bot' }).trampa).toBe('bot');
  });

  it('null si no es un form_submission con datos', () => {
    expect(leerEnvio({ triggerType: 'site_publish', payload: {} })).toBeNull();
    expect(leerEnvio({ triggerType: 'form_submission', payload: { name: 'Email Footer' } })).toBeNull();
    expect(leerEnvio('basura')).toBeNull();
    expect(leerEnvio(null)).toBeNull();
  });
});

describe('motivoDescarte', () => {
  const base = leido(LEGITIMO);

  it('un lead normal no se descarta', () => {
    expect(motivoDescarte(base)).toBeNull();
  });

  it('descarta si el campo trampa viene lleno', () => {
    expect(motivoDescarte({ ...base, trampa: 'x' })).toBe('trampa');
  });

  it('descarta enlaces o HTML en nombre, ciudad o mensaje (así llegó el 100% del spam medido)', () => {
    expect(motivoDescarte({ ...base, mensaje: 'Ruta en Madrid <a href=https://ejemplo.top>tour</a>' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'visita https://ejemplo.top' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'mira www.ejemplo.top' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, nombre: '<b>Promo</b>' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, ciudad: 'http://spam.top' })).toBe('enlaces');
  });

  it('también en mayúsculas', () => {
    expect(motivoDescarte({ ...base, mensaje: 'VISITA HTTPS://EJEMPLO.TOP' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'MIRA WWW.EJEMPLO.TOP' })).toBe('enlaces');
  });

  it('no confunde un correo o una comparación con un enlace', () => {
    expect(motivoDescarte({ ...base, mensaje: 'Escríbanme a ana@example.com, ¿precio < 2 millones?' })).toBeNull();
  });

  it('la falta de contacto NO es spam: la decide faltanDatosDeContacto y la fila se guarda', () => {
    expect(motivoDescarte({ ...base, correo: null, telefono: null })).toBeNull();
  });
});

describe('fuenteAvica', () => {
  const base = leido(LEGITIMO);

  it('newsletter, broker por interés o por casilla, y contacto', () => {
    expect(fuenteAvica({ ...base, formulario: 'Email Form' })).toBe('avica_newsletter');
    expect(fuenteAvica({ ...base, interes: 'broker' })).toBe('avica_broker');
    expect(fuenteAvica({ ...base, esBroker: true })).toBe('avica_broker');
    expect(fuenteAvica(base)).toBe('avica_contacto');
  });

  it('una opción nueva del select sigue siendo contacto', () => {
    expect(fuenteAvica({ ...base, interes: 'terreno' })).toBe('avica_contacto');
  });

  it('un formulario que no conocemos se ignora', () => {
    expect(fuenteAvica({ ...base, formulario: 'Formulario nuevo' })).toBeNull();
  });
});

describe('aFormData', () => {
  it('arma los datos de /api/leads con la página absoluta y el desarrollo de la ficha', () => {
    const datos = aFormData(leido(LEGITIMO, { publishedPath: '/desarrollos/yaxnah' }));
    expect(datos).toEqual({
      name: 'Ana María Ruiz',
      email: 'ana.ruiz@example.com',
      phone: '999 123 4567',
      city: 'Mérida',
      message: '¿Tienen casas de 3 recámaras?',
      interestOption: 'casa',
      heardFrom: 'busqueda_google',
      isBroker: null,
      propertyName: 'Yaxnáh',
      page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
    });
  });

  it('sin página usa la portada; la casilla marcada viaja como true', () => {
    const datos = aFormData({ ...leido(LEGITIMO), esBroker: true });
    expect(datos.page).toBe('https://www.avicainmobiliaria.com.mx/');
    expect(datos.propertyName).toBeNull();
    expect(datos.isBroker).toBe(true);
  });

  it('una opción nueva del select se conserva cruda', () => {
    expect(aFormData(leido({ ...LEGITIMO, interes_en: 'terreno' })).interestOption).toBe('terreno');
  });
});
