import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de terrenos en la Riviera Maya. Cadenas planas: lo que
// interpola usa marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Información de {total} terrenos',
  titulo: 'Recibe precio, plan de pagos y estatus de cada lote',
  cuerpo:
    'Te llega por correo la ficha de cada terreno y un asesor te escribe por WhatsApp el mismo día hábil.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Terreno de interés',
  verTodas: 'Quiero ver todos',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $500 mil MXN', '$500 mil a $1.5 M MXN', 'Más de $1.5 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la información',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} el precio, el plan de pagos y el estatus de los {total} terrenos. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Riviera Maya (sin terreno específico)',
  whatsappGenerico:
    'Hola, vi los terrenos residenciales de la Riviera Maya en su página. ¿Me pasan precios y planes de pago?',
  whatsappPorPropiedad: 'Hola, me interesa este terreno: {titulo}. ¿Me pasan precio y plan de pagos?',
};

export const COMERCIALIZADORA =
  'Somos comercializadora, no desarrolladora: si ninguno encaja con tu presupuesto o tu superficie, dínoslo y te buscamos otro en la zona.';

export const NOTA_MENSUALIDAD =
  'Solo publicamos la mensualidad donde el desarrollador tiene el esquema declarado.';

export const PASOS: { titulo: string; cuerpo: string }[] = [
  {
    titulo: 'Revisas los documentos',
    cuerpo:
      'Te mandamos el contrato y el paquete documental del desarrollo para que lo revise tu abogado antes de entregar dinero.',
  },
  {
    titulo: 'Apartas por escrito',
    cuerpo:
      'El monto del apartado y sus condiciones quedan por escrito antes de cualquier pago. Si algo no está declarado, te lo decimos.',
  },
  {
    titulo: 'Escrituras o firmas fideicomiso',
    cuerpo:
      'La fecha de escrituración la declara cada desarrollador y conviene que quede en tu contrato. Si eres extranjero, la compra va por fideicomiso bancario.',
  },
];

export const CIERRE_PUNTOS: [string, string][] = [
  ['Precio cerrado', 'De cada terreno, en pesos mexicanos.'],
  ['Enganche y plazos', 'Lo que pide cada desarrollador y a cuántos meses.'],
  ['Estatus de urbanización', 'Qué servicios tiene hoy y qué falta, según el desarrollador.'],
  ['Disponibilidad', 'Cuáles siguen libres al día de tu solicitud.'],
];

export const PIE_AVISO =
  'Precios en pesos mexicanos, vigentes al momento de la consulta y sujetos a cambio y disponibilidad sin previo aviso. Las fechas de urbanización y escrituración son declaradas por el desarrollador y no constituyen garantía. Propyte no es la desarrolladora.';
