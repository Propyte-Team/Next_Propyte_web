import { describe, expect, it } from 'vitest';
import { compactFormData } from '@/lib/leads/compact-form-data';
import { sourceToZohoPayload, type FormData } from '@/lib/zoho/field-maps';
import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';
import { aFormData, leerEnvio, type EnvioAvica } from './envio';

/**
 * El cron /api/cron/zoho-retry reconstruye el payload desde `leads.form_data`
 * (`{ ...form_data }`). Si un dato de Avica no sobrevive a ese viaje, el lead
 * rescatado llega a Zoho mutilado: el hueco que ya mordió en /unete con el
 * teléfono. Aquí se simula el viaje completo.
 */
describe('un lead de Avica rescatado por el cron llega igual que por el push directo', () => {
  it('conserva proyecto, ciudad, interés, cómo nos conoció y casilla', async () => {
    const envio = leerEnvio({
      triggerType: 'form_submission',
      payload: {
        name: 'Email Footer',
        publishedPath: '/desarrollos/yaxnah',
        data: {
          nombre: 'Ana María Ruiz', tel: '9991234567', correo: 'ana@example.com', ciudad: 'Mérida',
          interes_en: 'broker', nos_encontro_en: 'referencias', mensaje: 'Tengo clientes', es_broker: 'true',
        },
      },
    }) as EnvioAvica;
    const directo = aFormData(envio);
    const reconstruido = { ...JSON.parse(JSON.stringify(compactFormData(directo))) } as FormData;
    const buscar = async () => '6040986000097746005';

    for (const fuente of ['avica_contacto', 'avica_broker'] as const) {
      const a = sourceToZohoPayload(fuente, directo, 'es', {}, await resolverProyectoZoho(null, fuente, directo, buscar));
      const b = sourceToZohoPayload(fuente, reconstruido, 'es', {}, await resolverProyectoZoho(null, fuente, reconstruido, buscar));
      expect(b).toEqual(a);
    }
    const contacto = sourceToZohoPayload(
      'avica_contacto', reconstruido, 'es', {},
      await resolverProyectoZoho(null, 'avica_contacto', reconstruido, buscar),
    );
    expect(contacto.lead.Proyecto_de_Interes).toEqual([{ Proyecto_de_Interes: { id: '6040986000097746005' } }]);
    expect(contacto.lead.City).toBe('Mérida');
    expect(contacto.lead.Description).toContain('Marcó «¿Eres broker inmobiliario?»');
  });
});
