import { describe, expect, it } from 'vitest';
import { KNOWN_SOURCES } from '@/lib/lead-sources';
import {
  composeDuplicateNote,
  faltanDatosDeContacto,
  sourceToZohoPayload,
  type FormData,
} from './field-maps';

/** Datos inventados con la forma real del formulario «Email Footer». */
const CONTACTO: FormData = {
  name: 'Ana María Ruiz',
  email: 'ana@example.com',
  phone: '9991234567',
  city: 'Mérida',
  message: 'Me interesa una casa de 3 recámaras',
  interestOption: 'casa',
  heardFrom: 'busqueda_google',
  page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
  propertyName: 'Yaxnáh',
};

describe('fuentes del sitio de Avica', () => {
  it('están en KNOWN_SOURCES: sin esto el cron nunca las reintenta', () => {
    expect(KNOWN_SOURCES).toEqual(
      expect.arrayContaining(['avica_contacto', 'avica_broker', 'avica_newsletter']),
    );
  });

  it('avica_contacto lleva la campaña y el formulario que leen las reglas del Zoho de Propyte', () => {
    const { lead } = sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {});
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - contacto - [LEADS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Contacto',
      Tipo_de_Contacto: 'Lead',
      Lead_Source: 'Sitio web',
      Plataforma_de_llegada: 'Sitio web',
      Lead_Status: 'Nuevo',
      Email: 'ana@example.com',
      Phone: '9991234567',
      City: 'Mérida',
      Mensaje: 'Me interesa una casa de 3 recámaras',
      Nombre_anuncio: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
    });
    expect(lead).not.toHaveProperty('Owner');
    expect(lead).not.toHaveProperty('Broker');
  });

  it('la descripción trae sitio, desarrollo, interés, cómo nos conoció y ciudad, con etiquetas legibles', () => {
    const { lead } = sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {});
    expect(lead.Description).toBe(
      [
        'Sitio: avicainmobiliaria.com.mx/desarrollos/yaxnah',
        'Desarrollo: Yaxnáh',
        'Interés: Comprar una casa',
        'Cómo nos conoció: Búsqueda en Google',
        'Ciudad: Mérida',
      ].join('\n'),
    );
  });

  it('una opción nueva de un select se escribe cruda, sin perderse', () => {
    const { lead } = sourceToZohoPayload(
      'avica_contacto',
      { ...CONTACTO, interestOption: 'terreno', heardFrom: 'tiktok' },
      'es',
      {},
    );
    expect(lead.Description).toContain('Interés: terreno');
    expect(lead.Description).toContain('Cómo nos conoció: tiktok');
  });

  it('Proyecto_de_Interes solo cuando se resolvió un id', () => {
    expect(
      sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {}, '6040986000097746005').lead.Proyecto_de_Interes,
    ).toEqual([{ id: '6040986000097746005' }]);
    expect(sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {}).lead).not.toHaveProperty('Proyecto_de_Interes');
  });

  it('avica_broker es un broker de Propyte: etiqueta [BROKERS], tipo Broker, marca Broker y sin proyecto', () => {
    const { lead } = sourceToZohoPayload(
      'avica_broker',
      { ...CONTACTO, isBroker: true },
      'es',
      {},
      '6040986000097746005',
    );
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - broker - [BROKERS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Broker',
      Tipo_de_Contacto: 'Broker',
      Broker: true,
    });
    expect(lead).not.toHaveProperty('Proyecto_de_Interes');
    expect(lead.Description).toContain('Marcó «¿Eres broker inmobiliario?»');
  });

  it('avica_newsletter: solo correo, «Suscriptor» de apellido y sin mensaje', () => {
    const datos: FormData = {
      email: 'lector@example.com',
      page: 'https://www.avicainmobiliaria.com.mx/blog',
    };
    expect(faltanDatosDeContacto('avica_newsletter', datos)).toBeNull();
    const { lead } = sourceToZohoPayload('avica_newsletter', datos, 'es', {});
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - newsletter - [LEADS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Newsletter',
      Last_Name: 'Suscriptor',
      Email: 'lector@example.com',
    });
    expect(lead).not.toHaveProperty('Mensaje');
  });

  it('la exención de newsletter NO se extiende al contacto de Avica', () => {
    expect(faltanDatosDeContacto('avica_contacto', { email: 'ana@example.com' })).toBe('sin nombre');
  });

  it('la nota de duplicado nombra el sitio de Avica, no propyte.com', () => {
    const nota = composeDuplicateNote('avica_contacto', CONTACTO, 'es', {});
    expect(nota.title).toBe('Nuevo contacto web — Contacto');
    expect(nota.content).toContain('Campaña: Sitio Avica - contacto');
  });

  it('las fuentes de propyte.com no cambian', () => {
    const { lead } = sourceToZohoPayload('contact', { name: 'Ana Ruiz', email: 'a@example.com', phone: '9991234567' }, 'es', {});
    expect(lead.Nombre_de_Campa_a).toBe('Propyte web - contacto - [LEADS]');
    expect(lead.Nombre_del_formulario).toBe('Formulario Propyte web ES - Contacto general');
    expect(composeDuplicateNote('contact', {}, 'es', {}).title).toBe('Nuevo contacto web — Contacto general');
  });
});
