import { beforeEach, describe, expect, it } from 'vitest';
import type { FormData } from '@/lib/zoho/field-maps';
import type { FuenteAvica } from './envio';
import { manejarWebhookAvica, type DepsWebhookAvica, type ResultadoProceso } from './manejador';

const TOKEN = 'token-largo-de-prueba-0123456789abcdef';
const URL_BASE = 'https://propyte.com/api/webhooks/webflow-avica';

const CONTACTO = {
  triggerType: 'form_submission',
  payload: {
    name: 'Email Footer',
    publishedPath: '/contacto',
    data: { nombre: 'Ana Ruiz', tel: '9991234567', correo: 'ana@example.com', interes_en: 'casa', mensaje: 'Hola' },
  },
};

let llamadas: Array<{ fuente: FuenteAvica; datos: FormData }>;
let bitacora: string[];

function deps(extra: Partial<DepsWebhookAvica> = {}, resultado: ResultadoProceso = 'guardado'): DepsWebhookAvica {
  return {
    token: TOKEN,
    procesar: async (fuente, datos) => {
      llamadas.push({ fuente, datos });
      return resultado;
    },
    registrar: (linea) => bitacora.push(linea),
    ...extra,
  };
}

function peticion(cuerpo: unknown, token: string | null = TOKEN) {
  const url = token === null ? URL_BASE : `${URL_BASE}?token=${encodeURIComponent(token)}`;
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

const conDatos = (data: Record<string, unknown>, name = 'Email Footer') => ({
  triggerType: 'form_submission',
  payload: { name, data },
});

beforeEach(() => {
  llamadas = [];
  bitacora = [];
});

describe('manejarWebhookAvica', () => {
  it('con token correcto guarda el contacto y responde 200', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resultado: 'guardado' });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].fuente).toBe('avica_contacto');
    expect(llamadas[0].datos).toMatchObject({ email: 'ana@example.com', page: 'https://www.avicainmobiliaria.com.mx/contacto' });
  });

  it('sin token, con token incorrecto o de otra longitud → 401 sin procesar', async () => {
    for (const token of [null, 'x'.repeat(TOKEN.length), 'corto']) {
      const res = await manejarWebhookAvica(peticion(CONTACTO, token), deps());
      expect(res.status).toBe(401);
    }
    expect(llamadas).toEqual([]);
  });

  it('sin token configurado en el servidor no acepta nada (503)', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps({ token: '' }));
    expect(res.status).toBe(503);
    expect(llamadas).toEqual([]);
  });

  it('JSON roto, otro evento u otro formulario → 200 «ignorado» (si no, Webflow reintenta)', async () => {
    const cuerpos = [
      '{roto',
      { triggerType: 'site_publish', payload: {} },
      conDatos({ correo: 'ana@example.com' }, 'Formulario nuevo'),
    ];
    for (const cuerpo of cuerpos) {
      const res = await manejarWebhookAvica(peticion(cuerpo), deps());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ resultado: 'ignorado' });
    }
    expect(llamadas).toEqual([]);
  });

  it('el spam responde 200 «descartado» y no se procesa', async () => {
    const spam = conDatos({ nombre: 'Promo', correo: 'x@ejemplo.top', mensaje: 'visita https://ejemplo.top' });
    const res = await manejarWebhookAvica(peticion(spam), deps());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resultado: 'descartado', motivo: 'enlaces' });
    const trampa = conDatos({ nombre: 'Ana', correo: 'ana@example.com', campo_extra_hp: 'bot' });
    expect(await (await manejarWebhookAvica(peticion(trampa), deps())).json()).toEqual({ resultado: 'descartado', motivo: 'trampa' });
    expect(llamadas).toEqual([]);
  });

  it('newsletter y broker llegan con su fuente', async () => {
    await manejarWebhookAvica(peticion(conDatos({ correo_newsletter: 'lector@example.com' }, 'Email Form')), deps());
    await manejarWebhookAvica(peticion(conDatos({ nombre: 'Luis', correo: 'luis@example.com', 'Field 8': 'true' })), deps());
    expect(llamadas.map((l) => l.fuente)).toEqual(['avica_newsletter', 'avica_broker']);
  });

  it('sin datos de contacto → 200 «omitido» (la fila se guarda, no va a Zoho)', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps({}, 'omitido'));
    expect(await res.json()).toEqual({ resultado: 'omitido' });
  });

  it('si no se pudo guardar → 500 para que Webflow reintente', async () => {
    const res = await manejarWebhookAvica(
      peticion(CONTACTO),
      deps({ procesar: async () => { throw new Error('leads.insert.failed'); } }),
    );
    expect(res.status).toBe(500);
  });

  it('una línea de bitácora por envío, sin datos personales', async () => {
    await manejarWebhookAvica(peticion(CONTACTO), deps());
    await manejarWebhookAvica(peticion(CONTACTO, 'malo'), deps());
    expect(bitacora).toHaveLength(2);
    expect(bitacora[0]).toMatch(/^\[webflow-avica\] guardado fuente=avica_contacto/);
    expect(bitacora.join('\n')).not.toMatch(/ana|ruiz|9991234567|example\.com/i);
  });

  it('la bitácora trae la ruta de la página: así se verifica en producción qué ficha llegó', async () => {
    await manejarWebhookAvica(peticion(CONTACTO), deps());
    expect(bitacora[0]).toBe('[webflow-avica] guardado fuente=avica_contacto pagina=/contacto');
  });
});
