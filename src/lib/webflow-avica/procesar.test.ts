import { describe, expect, it } from 'vitest';
import type { FormData } from '@/lib/zoho/field-maps';
import { crearProcesador, type ClienteLeads, type DepsProcesar } from './procesar';

/**
 * El contrato audit-first de /api/leads, ahora para el sitio de Avica:
 * la fila se guarda ANTES de Zoho, se lanza SOLO si no se pudo guardar
 * (es el único 500 que le sirve a Webflow), y ni un error ni la lentitud
 * de Zoho llegan a Webflow: su reintento duplicaría el lead.
 */

const CONTACTO: FormData = {
  name: 'Ana María Ruiz',
  email: 'ana@example.com',
  phone: '9991234567',
  city: 'Mérida',
  message: 'Hola',
  interestOption: 'casa',
  page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
  propertyName: 'Yaxnáh',
};

type Fila = Record<string, unknown>;

/** Cliente falso con la forma de supabase-js que usa procesar: insert directo o insert().select().single(). */
function clienteFalso(opciones: { fallaInsert?: boolean } = {}) {
  const filas: Fila[] = [];
  const cliente = {
    from: (tabla: string) => ({
      insert: (fila: Fila) => {
        const error = opciones.fallaInsert
          ? { code: '23502', message: 'null value in column', details: 'Failing row contains (Ana María Ruiz, Mérida)' }
          : null;
        if (!error) filas.push({ tabla, ...fila });
        return {
          then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => Promise.resolve({ error }).then(ok, ko),
          select: () => ({
            single: async () => (error ? { data: null, error } : { data: { id: 'lead-1' }, error: null }),
          }),
        };
      },
    }),
  };
  return { cliente: cliente as unknown as ClienteLeads, filas };
}

function preparar(extra: Partial<DepsProcesar> = {}, opciones: { fallaInsert?: boolean } = {}) {
  const { cliente, filas } = clienteFalso(opciones);
  const eventos: Fila[] = [];
  const pushes: Array<{ leadId: string; filasAlEmpujar: number; proyecto: unknown }> = [];
  const deps: DepsProcesar = {
    cliente: async () => cliente,
    push: async (_sb, leadId, _source, payload) => {
      pushes.push({ leadId, filasAlEmpujar: filas.length, proyecto: payload.lead.Proyecto_de_Interes });
    },
    resolverProyecto: async () => '6040986000097746005',
    limiteZohoMs: 50,
    registrar: (evento) => eventos.push(evento),
    ...extra,
  };
  return { procesar: crearProcesador(deps), filas, eventos, pushes };
}

describe('procesar (sitio de Avica → public.leads → Zoho)', () => {
  it('guarda la fila PENDING_SYNC primero y después empuja a Zoho con su id y proyecto', async () => {
    const { procesar, filas, pushes } = preparar();
    expect(await procesar('avica_contacto', CONTACTO)).toBe('guardado');
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      tabla: 'leads',
      source: 'avica_contacto',
      email: 'ana@example.com',
      zoho_sync_error: 'PENDING_SYNC',
      nombre_campana: 'Sitio Avica - contacto - [LEADS]',
      nombre_formulario: 'Formulario sitio Avica ES - Contacto',
    });
    expect(pushes).toEqual([{ leadId: 'lead-1', filasAlEmpujar: 1, proyecto: [{ id: '6040986000097746005' }] }]);
  });

  it('sin datos de contacto: fila SKIPPED, sin Zoho, y el motivo queda registrado sin datos personales', async () => {
    const { procesar, filas, pushes, eventos } = preparar();
    expect(await procesar('avica_contacto', { name: 'Ana María Ruiz', phone: '9991234567' })).toBe('omitido');
    expect(filas[0]).toMatchObject({ zoho_sync_error: 'SKIPPED: sin datos de contacto' });
    expect(pushes).toEqual([]);
    expect(eventos).toEqual([
      expect.objectContaining({ event: 'webflow-avica.sin-datos-de-contacto', source: 'avica_contacto', razon: 'sin email' }),
    ]);
    expect(JSON.stringify(eventos)).not.toMatch(/ana|9991234567/i);
  });

  it('un correo mal escrito no se pierde: la fila SKIPPED lo conserva en form_data', async () => {
    const { procesar, filas } = preparar();
    await procesar('avica_contacto', { ...CONTACTO, email: null, invalidEmail: 'ana@gmail' });
    expect(filas[0]).toMatchObject({ zoho_sync_error: 'SKIPPED: sin datos de contacto' });
    expect(filas[0].form_data).toMatchObject({ invalidEmail: 'ana@gmail' });
  });

  it('si el INSERT falla lanza (Webflow reintenta), no empuja y el log no lleva la fila', async () => {
    const { procesar, pushes, eventos } = preparar({}, { fallaInsert: true });
    await expect(procesar('avica_contacto', CONTACTO)).rejects.toThrow('leads.insert.failed');
    expect(pushes).toEqual([]);
    expect(JSON.stringify(eventos)).not.toMatch(/ana|mérida|failing row/i);
  });

  it('si Supabase no está configurado lanza', async () => {
    const { procesar } = preparar({ cliente: async () => null });
    await expect(procesar('avica_contacto', CONTACTO)).rejects.toThrow('supabase_sin_configurar');
  });

  it('si el push a Zoho lanza, ya está guardado: responde guardado y lo registra', async () => {
    const { procesar, eventos } = preparar({ push: async () => { throw new Error('zoho caído'); } });
    expect(await procesar('avica_contacto', CONTACTO)).toBe('guardado');
    expect(eventos).toEqual([expect.objectContaining({ event: 'webflow-avica.push-zoho.uncaught', lead_id: 'lead-1' })]);
  });

  it('si Zoho no contesta, responde guardado al vencer el límite: nginx no llega a cortar y Webflow no reintenta', async () => {
    const { procesar, eventos } = preparar({ push: () => new Promise<void>(() => {}), limiteZohoMs: 20 });
    const inicio = Date.now();
    expect(await procesar('avica_contacto', CONTACTO)).toBe('guardado');
    expect(Date.now() - inicio).toBeLessThan(1000);
    expect(eventos).toEqual([expect.objectContaining({ event: 'webflow-avica.push-zoho.lento', lead_id: 'lead-1' })]);
  });
});
