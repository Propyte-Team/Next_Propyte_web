// ============================================================
// Copy de la landing de casas, en los dos idiomas que sirve.
//
// POR QUÉ UN DICCIONARIO Y NO UNA SEGUNDA COPIA DE LA PÁGINA. La variante en
// inglés (`/lp/homes-riviera-maya`) es la MISMA página: mismo formulario, misma
// cuadrícula, mismas reglas de dato. Lo único que cambia son las cadenas. Con
// dos árboles de componentes, el primer arreglo que alguien haga en el
// formulario —y el formulario de esta familia ya costó $991.40 en clics sin
// envíos— se aplicaría en uno solo y nadie se enteraría hasta leer el reporte.
//
// POR QUÉ VIVE DENTRO DE `casas-riviera-maya/` Y NO EN UNA CARPETA NEUTRA. Por
// no mover archivos de una página que ya está en producción y que otras ramas
// están tocando. La ruta en inglés importa de aquí; la deuda está anotada y es
// un `git mv` cuando no haya trabajo abierto encima.
//
// ⚠️ NO SE TRADUCEN LOS RANGOS DE PRESUPUESTO A DÓLARES. Publicar «Up to
// $350K USD» exige un tipo de cambio, y la regla de esta página es que ninguna
// cifra se inventa (ver la cabecera de `_components/format.ts`: dos casas se
// venden en USD y se publican en USD, sin conversión). Los rangos van en pesos
// con el código de moneda impreso, que es lo mismo que ve el visitante en las
// tarjetas.
// ============================================================

import type { Precio } from '@/lib/supabase/lp-casas';

/**
 * `tiempoRespuesta` es COMPROMISO OPERATIVO, no copy: define qué promete la
 * marca al enviar. Si el equipo comercial no puede sostener el plazo en inglés
 * —zona horaria distinta, asesor que no habla inglés—, se cambia AQUÍ y no en
 * el componente.
 */
export interface CopyCasas {
  /** Va al lead: Zoho lo usa para decidir en qué idioma se contesta. */
  locale: 'es' | 'en';

  meta: { title: string; description: string };

  legal: {
    privacidadHref: string;
    terminosHref: string;
    privacidad: string;
    terminos: string;
    /** Enlace dentro del formulario. */
    avisoPrivacidad: string;
  };

  /** Inventario vacío. Escenario probable, no caso borde. */
  vacio: {
    etiqueta: string;
    titulo: string;
    cuerpo: string;
    cta: string;
  };

  hero: {
    etiqueta: string;
    /**
     * Dos líneas: el <br /> lo pone la página. `todasInmediatas` permite decir
     * «con entrega inmediata» solo cuando es verdad para TODO el inventario.
     */
    titulo: (total: number, todasInmediatas: boolean) => [string, string];
    /** Sin cuerpo desde el brief de octubre-2026: el titular basta. */
    cuerpo?: string;
    cifras: {
      disponibles: [string, string];
      desde: [string, string];
      hasta: [string, string];
      enganche: [string, string];
    };
    /** `alt` del tríptico. */
    altFoto: (zona: string, ciudad: string) => string;
  };

  /** Las tres afirmaciones verificables, en vez de una banda de «beneficios». */
  afirmaciones: [string, string][];

  inventario: {
    etiqueta: (total: number) => string;
    titulo: string;
    cuerpo?: string;
    /** Chip «todas» del filtro de ubicación. */
    todas: string;
    preventa: string;
    entregaInmediata: string;
    sinFoto: string;
    /** Chip de dato ausente. Regla 3 del data layer. */
    confirmar: string;
    enganche: string;
    altFicha: (titulo: string, ciudad: string) => string;
    elegir: string;
    elegida: string;
    /** Sufijos de la línea de specs. */
    specs: {
      recamaras: string;
      banos: string;
      construidos: string;
      terreno: string;
      estacionamientos: string;
      alberca: string;
    };
  };

  cierre: {
    etiqueta: string;
    titulo: (total: number) => string;
    cuerpo?: string;
    puntos: [string, string][];
  };

  form: {
    etiqueta: (total: number) => string;
    titulo: string;
    cuerpo: (tiempoRespuesta: string) => string;
    tiempoRespuesta: string;
    nombre: string;
    nombrePlaceholder: string;
    whatsapp: string;
    whatsappPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    casaLabel: string;
    opcional: string;
    verTodas: string;
    presupuestoLabel: string;
    presupuestos: readonly string[];
    honeypot: string;
    enviar: string;
    enviando: string;
    preferirWhatsApp: string;
    notaPrivacidad: string;
    error: string;
    /**
     * Campos obligatorios que faltan. El <form> ya NO lleva `noValidate`, así
     * que el navegador avisa primero; esto es la red de abajo, para el envío
     * que el navegador SÍ deja pasar porque el DOM está lleno y el estado
     * React vacío (autocompletado que no dispara `change`).
     */
    faltanCampos: string;
    emailInvalido: string;
    telefonoInvalido: string;
    exito: {
      titulo: (nombre: string) => string;
      /** Cuando el campo de nombre vino vacío y el saludo se quedaría cojo. */
      sinNombre: string;
      cuerpo: (email: string, total: number, tiempoRespuesta: string) => string;
      cta: string;
    };
    /** Lo que el asesor ve primero en Zoho cuando no eligieron casa. */
    sinCasaEspecifica: string;
  };

  whatsapp: {
    generico: string;
    porCasa: (titulo: string) => string;
    ariaLabel: string;
  };

  barra: {
    verPrecios: (total: number) => string;
  };

  /** Pie legal. `rango` es null cuando el inventario no declara precios. */
  pie: {
    aviso: string;
    inventario: (total: number, desde: string, hasta: string) => string;
  };
}

export const COPY_ES: CopyCasas = {
  locale: 'es',

  meta: {
    // SIN «| Propyte» al final: el root layout aplica la plantilla `'%s | Propyte'`
    // y el sufijo salía DOS veces en la pestaña. Estaba así en producción.
    title: 'Casas en venta en Playa del Carmen y Tulum | Precios reales',
    description:
      'Inventario real de casas en la Riviera Maya con precio, enganche y disponibilidad verificados. Recibe el dossier completo por correo o pregunta por WhatsApp.',
  },

  legal: {
    privacidadHref: '/es/privacidad',
    terminosHref: '/es/terminos',
    privacidad: 'Privacidad',
    terminos: 'Términos',
    avisoPrivacidad: 'Aviso de privacidad',
  },

  vacio: {
    etiqueta: 'Inventario',
    titulo: 'Ahora mismo no tenemos casas publicadas en la Riviera Maya.',
    cuerpo:
      'No vamos a mostrarte departamentos como si fueran casas. Escríbenos y te avisamos en cuanto entre inventario, con los números completos.',
    cta: 'Avísenme por WhatsApp',
  },

  hero: {
    etiqueta: 'Inventario verificado · Playa del Carmen y Tulum',
    // Brief de octubre-2026: «15 casas con entrega inmediata en la Riviera
    // Maya». Se dice «con entrega inmediata» SOLO si ninguna está en preventa;
    // si alguna lo está, la frase honesta es «en venta».
    titulo: (total, todasInmediatas) => [
      `${total} casas ${todasInmediatas ? 'con entrega inmediata' : 'en venta'}`,
      'en la Riviera Maya.',
    ],
    cifras: {
      disponibles: ['Disponibles', 'casas publicadas'],
      desde: ['Desde', 'precio de entrada'],
      hasta: ['Hasta', 'tope del inventario'],
      enganche: ['Enganche', 'el más bajo publicado'],
    },
    altFoto: (zona, ciudad) => `Casa en ${zona}, ${ciudad}`,
  },

  afirmaciones: [
    [
      'Precio confirmado',
      'Cada casa tiene su precio en la moneda en que se vende (dos se venden en dólares).',
    ],
    [
      'Información real',
      'Donde el desarrollador no declaró una cifra verás «Confirmar»: preferimos un espacio honesto a un número que el asesor tenga que desmentir.',
    ],
    [
      'Cálculos en conjunto',
      'Publicamos el enganche porque cuadra contra el precio. La mensualidad la calculamos contigo según el esquema real de cada desarrollador.',
    ],
  ],

  inventario: {
    etiqueta: (total) => `Inventario · ${total} casas disponibles`,
    titulo: 'Casas disponibles',
    todas: 'Todas',
    preventa: 'Preventa',
    entregaInmediata: 'Entrega inmediata',
    sinFoto: 'Sin fotografía',
    confirmar: 'Confirmar',
    enganche: 'Enganche',
    altFicha: (titulo, ciudad) => `${titulo} — ${ciudad}`,
    elegir: 'Quiero esta casa',
    elegida: 'Elegida — completa tus datos',
    specs: {
      recamaras: 'rec',
      banos: 'baños',
      construidos: 'const.',
      terreno: 'terreno',
      estacionamientos: 'autos',
      alberca: 'Alberca',
    },
  },

  cierre: {
    etiqueta: 'Último paso',
    titulo: (total) => `Te mandamos la información completa de las ${total}.`,
    puntos: [
      ['Precio cerrado', 'De cada una de las casas, en su moneda de venta.'],
      ['Enganche y esquema', 'Lo que pide cada desarrollador para apartar.'],
      ['Qué incluye', 'Equipada, llave en mano o en obra.'],
      ['Disponibilidad', 'Cuáles siguen libres al día de tu solicitud.'],
    ],
  },

  form: {
    etiqueta: (total) => `Dossier de inventario · ${total} casas`,
    titulo: 'Recibe precios, enganche y disponibilidad',
    cuerpo: (t) =>
      `Te llega por correo la ficha completa de cada casa y un asesor te escribe por WhatsApp ${t}.`,
    tiempoRespuesta: 'el mismo día hábil',
    nombre: 'Nombre',
    nombrePlaceholder: 'Tu nombre',
    whatsapp: 'WhatsApp',
    whatsappPlaceholder: '+52 984 000 0000',
    email: 'Correo — es donde llega el dossier',
    emailPlaceholder: 'tu@correo.com',
    casaLabel: 'Casa de interés',
    opcional: '(opcional)',
    verTodas: 'Quiero ver todas',
    presupuestoLabel: 'Presupuesto',
    presupuestos: [
      'Hasta $6 M MXN',
      '$6 M a $11 M MXN',
      'Más de $11 M MXN',
      'Todavía lo estoy definiendo',
    ],
    honeypot: 'No llenar',
    enviar: 'Recibir el dossier',
    enviando: 'Enviando',
    preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
    notaPrivacidad:
      'Usamos tus datos solo para enviarte esta información y contactarte. Sin listas de terceros.',
    error: 'No pudimos enviar tus datos. Escríbenos por WhatsApp y lo resolvemos ahí.',
    faltanCampos: 'Completa nombre, WhatsApp y correo para recibir el dossier.',
    emailInvalido: 'Revisa el correo: es a donde te llega el dossier.',
    telefonoInvalido: 'Revisa el teléfono: elige tu país y escribe el número completo.',
    exito: {
      titulo: (nombre) => `Listo, ${nombre}.`,
      sinNombre: 'gracias',
      cuerpo: (email, total, t) =>
        `Te enviamos el dossier a ${email} con los precios, el enganche y la disponibilidad de las ${total} casas. Un asesor te escribe por WhatsApp ${t}.`,
      cta: 'Escribir ahora por WhatsApp',
    },
    sinCasaEspecifica: 'Riviera Maya (sin casa específica)',
  },

  whatsapp: {
    generico:
      'Hola, vi las casas de la Riviera Maya en su página. ¿Me pasan precios y disponibilidad?',
    porCasa: (titulo) => `Hola, me interesa esta casa: ${titulo}. ¿Me pasan precio y disponibilidad?`,
    ariaLabel: 'Escribir por WhatsApp',
  },

  barra: {
    verPrecios: (total) => `Ver precios de las ${total}`,
  },

  pie: {
    aviso:
      'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles.',
    inventario: (total, desde, hasta) =>
      `Inventario publicado: ${total} casas de ${desde} a ${hasta}.`,
  },
};

// ------------------------------------------------------------
// INGLÉS — para tráfico de Estados Unidos y Canadá.
//
// No es una traducción literal. El comprador extranjero llega con dos dudas que
// el mexicano no tiene —¿puedo comprar siendo extranjero? y ¿en qué moneda es
// ese precio?— y el copy las toca de frente donde cabe, sin prometer nada que
// la página no pueda respaldar con dato. El fideicomiso NO se explica aquí: es
// materia de la llamada, y una landing de conversión que abre un tema legal
// pierde al visitante en la lectura.
//
// El registro es el mismo que el español: afirmaciones verificables, cero
// urgencia inventada, cero superlativos. «Luxury», «paradise», «dream home» y
// el resto del vocabulario del portal quedan fuera a propósito — es justo lo
// que dice la competencia y no distingue nada.
// ------------------------------------------------------------

export const COPY_EN: CopyCasas = {
  locale: 'en',

  meta: {
    // Ver la nota del título en español: la plantilla del root layout ya añade
    // «| Propyte».
    title: 'Homes for Sale in Playa del Carmen & Tulum | Real Prices',
    description:
      'Verified inventory of homes in the Riviera Maya with published prices, down payment and availability. Get the full dossier by email or ask on WhatsApp.',
  },

  legal: {
    privacidadHref: '/en/privacidad',
    terminosHref: '/en/terminos',
    privacidad: 'Privacy',
    terminos: 'Terms',
    avisoPrivacidad: 'Privacy notice',
  },

  vacio: {
    etiqueta: 'Inventory',
    titulo: 'We have no homes published in the Riviera Maya right now.',
    cuerpo:
      "We won't show you condos and call them homes. Send us a message and we'll tell you the moment inventory comes in, with the full numbers.",
    cta: 'Let me know on WhatsApp',
  },

  hero: {
    etiqueta: 'Verified inventory · Playa del Carmen and Tulum',
    titulo: (total, todasInmediatas) => [
      `${total} ${todasInmediatas ? 'move-in ready homes' : 'homes for sale'}`,
      'in the Riviera Maya.',
    ],
    cifras: {
      disponibles: ['Available', 'homes published'],
      desde: ['From', 'entry price'],
      hasta: ['Up to', 'top of the inventory'],
      enganche: ['Down payment', 'lowest published'],
    },
    altFoto: (zona, ciudad) => `Home in ${zona}, ${ciudad}`,
  },

  afirmaciones: [
    [
      'Confirmed price',
      'Every home carries its price in the currency it sells in (two sell in dollars).',
    ],
    [
      'Real information',
      'Where the developer never declared a figure you will see "To confirm": we would rather leave an honest gap than print a number an advisor has to walk back.',
    ],
    [
      'Worked out together',
      "We publish the down payment because it reconciles against the price. The monthly payment we work out with you, against each developer's actual terms.",
    ],
  ],

  inventario: {
    etiqueta: (total) => `Inventory · ${total} homes available`,
    titulo: 'Available homes',
    todas: 'All',
    preventa: 'Pre-construction',
    entregaInmediata: 'Move-in ready',
    sinFoto: 'No photograph',
    confirmar: 'To confirm',
    enganche: 'Down payment',
    altFicha: (titulo, ciudad) => `${titulo} — ${ciudad}`,
    elegir: 'I want this home',
    elegida: 'Selected — fill in your details',
    specs: {
      recamaras: 'bd',
      banos: 'ba',
      construidos: 'built',
      terreno: 'lot',
      estacionamientos: 'cars',
      alberca: 'Pool',
    },
  },

  cierre: {
    etiqueta: 'Last step',
    titulo: (total) => `We send you the complete information on all ${total}.`,
    puntos: [
      ['Full price', 'For every home, in the currency it sells in.'],
      ['Down payment and terms', 'What each developer asks for to reserve.'],
      ['What it includes', 'Furnished, turnkey or under construction.'],
      ['Availability', 'Which ones are still free the day you ask.'],
    ],
  },

  form: {
    etiqueta: (total) => `Inventory dossier · ${total} homes`,
    titulo: 'Get prices, down payment and availability',
    cuerpo: (t) =>
      `You get the full sheet on every home by email, and an advisor writes to you on WhatsApp ${t}.`,
    // El plazo en inglés se dice en el mismo día hábil, pero la zona horaria del
    // visitante puede ir hasta 3 h por detrás de Quintana Roo. «Within one
    // business day» es lo que el equipo puede sostener sin quemar el lead.
    tiempoRespuesta: 'within one business day',
    nombre: 'Name',
    nombrePlaceholder: 'Your name',
    whatsapp: 'WhatsApp',
    whatsappPlaceholder: '+1 555 000 0000',
    email: 'Email — this is where the dossier lands',
    emailPlaceholder: 'you@email.com',
    casaLabel: 'Home you are interested in',
    opcional: '(optional)',
    verTodas: 'I want to see them all',
    presupuestoLabel: 'Budget',
    // En pesos y con el código impreso: convertir a dólares exigiría un tipo de
    // cambio inventado. Ver la cabecera de este archivo.
    presupuestos: [
      'Up to $6M MXN',
      '$6M to $11M MXN',
      'Over $11M MXN',
      'Still working it out',
    ],
    honeypot: 'Do not fill',
    enviar: 'Send me the dossier',
    enviando: 'Sending',
    preferirWhatsApp: "I'd rather ask on WhatsApp",
    notaPrivacidad:
      'We use your details only to send you this information and to contact you. No third-party lists.',
    error: "We couldn't send your details. Message us on WhatsApp and we'll sort it out there.",
    faltanCampos: 'Please add your name, WhatsApp and email so we can send the dossier.',
    emailInvalido: "Check your email address — that's where the dossier lands.",
    telefonoInvalido: 'Check your phone number — pick your country and enter the full number.',
    exito: {
      titulo: (nombre) => `Done, ${nombre}.`,
      sinNombre: 'thanks',
      cuerpo: (email, total, t) =>
        `We sent the dossier to ${email} with the prices, the down payment and the availability of all ${total} homes. An advisor writes to you on WhatsApp ${t}.`,
      cta: 'Message us on WhatsApp now',
    },
    sinCasaEspecifica: 'Riviera Maya (no specific home)',
  },

  whatsapp: {
    generico:
      'Hi, I saw your Riviera Maya homes on your page. Could you send me prices and availability?',
    porCasa: (titulo) =>
      `Hi, I'm interested in this home: ${titulo}. Could you send me price and availability?`,
    ariaLabel: 'Message us on WhatsApp',
  },

  barra: {
    verPrecios: (total) => `See prices for all ${total}`,
  },

  pie: {
    aviso:
      'Prices and availability are current at the time of enquiry and subject to confirmation with the developer. Propyte is not the developer of these properties.',
    inventario: (total, desde, hasta) =>
      `Published inventory: ${total} homes from ${desde} to ${hasta}.`,
  },
};

/** Reexport de conveniencia: la página vacía no necesita el resto del tipo. */
export type { Precio };

export type LocaleCasas = CopyCasas['locale'];

/**
 * 🚨 LO QUE CRUZA LA FRONTERA SERVIDOR→CLIENTE ES ESTA CLAVE, NUNCA EL OBJETO.
 *
 * `CopyCasas` interpola con FUNCIONES (`titulo(total)`, `cuerpo(email, …)`), y
 * una función no es serializable: pasar `copy` como prop a un componente
 * `'use client'` revienta el build entero con «Functions cannot be passed
 * directly to Client Components». No es un aviso, es un fallo de compilación —
 * y solo aparece en `next build`, no en el typecheck.
 *
 * Así que los componentes de cliente reciben `locale` (una cadena) y resuelven
 * su diccionario aquí dentro. El coste es que el bundle de cliente carga los
 * dos idiomas; son unos pocos KB de texto y el precio de la alternativa es
 * repartir la interpolación por seis archivos.
 */
export const COPY: Record<LocaleCasas, CopyCasas> = {
  es: COPY_ES,
  en: COPY_EN,
};
