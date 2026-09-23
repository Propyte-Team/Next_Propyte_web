'use client';

import { useEffect, useId, useRef, useState } from 'react';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';
import { trackGenerateLead } from '@/lib/analytics/track';

// ============================================================
// LA CONVERSIÓN de la variante C.
//
// ═══ LA PLOMERÍA ES LA MISMA. NO SE TOCA. ═══
//
// Cambia el estilo y —desde el 2026-09-02— el JUEGO DE CAMPOS de cada bloque,
// pero no la medición:
//
//   · `source: 'lp_lotes_pdc'` — literal de `KNOWN_SOURCES` en `/api/leads`.
//     Inventar un `source` nuevo NO daría un error visible: daría un lead que
//     entra a Supabase y NO llega a Zoho.
//   · `trackGenerateLead()` — dispara GA4 `generate_lead`, el `Lead` de Meta y
//     el `gtag('event','conversion')` con el `send_to` de Ads. Misma acción de
//     conversión que las otras dos variantes, mismo valor (ninguno).
//
// Si además de la página cambiara la medición, la diferencia de resultados
// entre las tres variantes no sería atribuible al diseño.
//
// ═══ LO ÚNICO QUE CAMBIA EN LOS DATOS ═══
//
// `FORM_TYPE`, que es lo que separa las variantes en GA4, y el `bloque` dentro
// del `message`. En Zoho las separa `page` → `Nombre_anuncio`.
//
// ═══ LOS TRES BLOQUES YA NO SON EL MISMO FORMULARIO ═══
//
// Antes eran tres instancias idénticas —nombre + WhatsApp— y la única
// diferencia era el rótulo del `bloque`. Decisión de Luis del 2026-09-02: cada
// posición pide lo que su lector puede dar en ese punto de la página.
//
//   · `hero`   → el tradicional: nombre, correo y teléfono con selector de
//                lada. Nada más. Quien acaba de llegar del anuncio no ha leído
//                un solo argumento; cualquier pregunta extra aquí es peaje.
//   · `medio`  → SE QUEDA COMO ESTABA. Es el control: si el hero y el cierre
//                mueven la conversión, este bloque es la referencia contra la
//                que se mide. Cambiarlo es perder el punto de comparación.
//   · `cierre` → el diagnóstico. Quien llega hasta abajo se leyó las doce
//                secciones: ya no está averiguando si le interesa, está
//                averiguando cuál. Tres toques —uso, enganche disponible y
//                zona— y el asesor abre la conversación con una opción, no con
//                el catálogo.
//
// La compuerta que costó $991.40 MXN en 72 clics con CERO envíos NO vuelve: en
// los tres bloques los campos se ven de entrada, sin preguntas previas. El
// diagnóstico del cierre son campos VISIBLES del mismo formulario, no un paso
// que haya que desbloquear.
// ============================================================

/** Claves de atribución que se leen de la URL. Sin storage: viven en un ref. */
const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
  'qr',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

/** Segmenta la variante C en GA4 sin tocar la acción de conversión de Ads. */
const FORM_TYPE = 'lp_enganche_pdc';

type Variante = 'hero' | 'medio' | 'cierre';

/**
 * Qué pide cada bloque. Vive en una tabla y no en `if (variante === ...)`
 * repartidos por el JSX para que se pueda leer de un golpe QUÉ formulario es
 * cada instancia — que es justo el dato que se necesita al mirar los leads en
 * el CRM y preguntarse por qué unos traen correo y otros no.
 */
const PERFIL: Record<Variante, {
  correo: boolean;
  /** `true` ⇒ selector de lada E.164; `false` ⇒ campo simple de 10 dígitos. */
  lada: boolean;
  plazo: boolean;
  diagnostico: boolean;
}> = {
  hero: { correo: true, lada: true, plazo: false, diagnostico: false },
  medio: { correo: false, lada: false, plazo: true, diagnostico: false },
  cierre: { correo: true, lada: true, plazo: true, diagnostico: true },
};

/**
 * ⚠️ PALANCA DE NEGOCIO, no de diseño.
 *
 * Con `true`, el cierre no envía sin las tres respuestas del diagnóstico. Es
 * deliberado: si fueran opcionales, casi nadie las contesta y el bloque acaba
 * siendo el mismo formulario del hero con más scroll — se paga la fricción del
 * diseño sin cobrar el dato. El hero y el medio siguen siendo la vía corta para
 * quien no quiera contestar nada, así que exigirlo aquí no cierra ninguna
 * puerta.
 *
 * Ponerlo en `false` los vuelve opcionales sin tocar nada más.
 */
const DIAGNOSTICO_OBLIGATORIO = true;

interface Opcion {
  /** Lo que se muestra. ⚠️ Sin cifras con «$»: ver la nota de MXN más abajo. */
  etiqueta: string;
  /** Lo que viaja al CRM. Se escribe para leerse dentro de la ficha de Zoho. */
  valor: string;
  ayuda?: string;
}

/** → `investmentType`, que en `field-maps.ts` sale como «Objetivo:». */
const USOS: Opcion[] = [
  {
    etiqueta: 'Plusvalía',
    valor: 'Plusvalía — comprar y vender más adelante',
    ayuda: 'Comprar hoy y vender cuando suba',
  },
  {
    etiqueta: 'Rentas',
    valor: 'Rentas — Airbnb o renta a largo plazo',
    ayuda: 'Airbnb o renta a largo plazo',
  },
  {
    etiqueta: 'Construir mi casa',
    valor: 'Construir casa propia',
    ayuda: 'Para vivir o para vacacionar',
  },
  {
    etiqueta: 'Aún estoy explorando',
    valor: 'Aún explorando — quiere entender los números',
    ayuda: 'Todavía comparando opciones',
  },
];

/**
 * → `budget`, que en `field-maps.ts` sale como «Enganche disponible:».
 *
 * ⚠️ LAS ETIQUETAS NO LLEVAN «$». El contrato de marcado
 * (`tests/lp-enganche-contrato.mjs`) exige que toda cifra en pesos del HTML
 * tenga «MXN» a menos de 12 caracteres, y un rango tipo «$150,000 – $300,000
 * MXN» deja la primera cifra justo en el límite. La moneda se dice UNA vez, en
 * la pregunta; las cifras completas y con MXN viven en `valor`, que va al CRM y
 * no al DOM.
 */
const ENGANCHES: Opcion[] = [
  { etiqueta: 'Hasta 150 mil', valor: 'Hasta $150,000 MXN' },
  { etiqueta: '150 a 300 mil', valor: 'De $150,000 MXN a $300,000 MXN' },
  { etiqueta: '300 a 600 mil', valor: 'De $300,000 MXN a $600,000 MXN' },
  { etiqueta: 'Más de 600 mil', valor: 'Más de $600,000 MXN' },
];

/**
 * → `location`, que en `field-maps.ts` cae en `City` de Zoho cuando no vino
 * `city`.
 *
 * `ciudad: null` en la última a propósito: «abierto a la mejor opción» NO es
 * una ciudad y mandarlo como `City` mete basura en un campo que el CRM usa para
 * segmentar. La respuesta no se pierde — va completa en el `message`, que Zoho
 * recibe como `Mensaje`.
 */
const ZONAS: (Opcion & { ciudad: string | null })[] = [
  { etiqueta: 'Playa del Carmen', valor: 'Playa del Carmen', ciudad: 'Playa del Carmen' },
  { etiqueta: 'Tulum', valor: 'Tulum', ciudad: 'Tulum' },
  { etiqueta: 'Puerto Aventuras', valor: 'Puerto Aventuras', ciudad: 'Puerto Aventuras' },
  {
    etiqueta: 'Abierto a la mejor opción',
    valor: 'Abierto — quiere la mejor opción de la Riviera Maya',
    ciudad: null,
  },
];

// Aquí vivía un `ORDINAL` que rotulaba el panel como «Solicitud · 01 / 02 / 03».
// Se quitó: era numeración INTERNA —la posición de la instancia en el
// documento— expuesta al visitante, que no tiene forma de saber qué significa
// ni qué pasó con las otras dos. Lo mismo con el «2 campos» de la esquina: era
// un dato de diseñador, no del comprador, y los dos campos ya se ven.
// La instancia sigue viajando al CRM en el `message`, que es donde importa.

export interface FormEngancheProps {
  variante: Variante;
  /** Plazos publicados. Vacío ⇒ no se pregunta. */
  plazos: number[];
  loteRef: string;
  /** Título de la unidad, ya saneado de nombre comercial aguas arriba. */
  loteTitulo: string;
  /** El enganche ya formateado con «MXN». Se rotula en la cabecera del panel. */
  engancheTexto: string | null;
  /**
   * ⚠️ COMPROMISO OPERATIVO, no copy: define qué promete la marca al enviar.
   * Cambiarlo es decisión de negocio.
   */
  tiempoRespuesta?: string;
}

type ClaveError = 'nombre' | 'correo' | 'telefono' | 'uso' | 'enganche' | 'zona';

/**
 * Un grupo de opciones del diagnóstico. Un toque, sin desplegables: en móvil un
 * `<select>` abre una hoja modal que tapa la pregunta que acaba de leer.
 *
 * ⚠️ VIVE FUERA DEL COMPONENTE A PROPÓSITO. Definido dentro, su identidad de
 * tipo cambia en cada render y React desmonta y vuelve a montar el subárbol
 * entero: al elegir una opción el botón pulsado PIERDE EL FOCO, así que quien
 * navega con teclado vuelve al principio del formulario en cada toque. No es un
 * detalle de estilo, es el grupo entero inutilizable sin ratón.
 */
function GrupoOpciones({
  idBase,
  clave,
  pregunta,
  nota,
  opciones,
  valor,
  elegir,
  error,
  columna = false,
}: {
  idBase: string;
  clave: ClaveError;
  pregunta: string;
  nota?: string;
  opciones: Opcion[];
  valor: string | null;
  elegir: (v: string) => void;
  error?: string;
  columna?: boolean;
}) {
  const hayError = Boolean(error);
  return (
    <fieldset data-lpe-grupo={clave}>
      <legend className="lpe-cuerpo text-[0.9375rem] font-medium text-[var(--lpe-tinta)]">
        {pregunta}
      </legend>
      {nota && (
        <p className="lpe-cuerpo mt-1 text-[0.8125rem] text-[var(--lpe-tinta-3-texto)]">{nota}</p>
      )}
      <div className={columna ? 'mt-3 grid gap-2' : 'mt-3 flex flex-wrap gap-2.5'}>
        {opciones.map((o) => {
          const activo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              onClick={() => elegir(o.valor)}
              aria-pressed={activo}
              aria-describedby={hayError ? `${idBase}-${clave}-error` : undefined}
              className={`lpe-cuerpo min-h-11 border text-[0.9375rem] transition-[background-color,border-color,color] duration-200 ${
                columna
                  ? 'rounded-[var(--lpe-r-int)] px-5 py-3 text-left'
                  : 'rounded-[var(--lpe-r-pill)] px-5'
              } ${
                activo
                  ? 'border-[var(--lpe-tinta)] bg-[var(--lpe-tinta)] font-medium text-[var(--lpe-blanco)]'
                  : `bg-transparent text-[var(--lpe-tinta-2)] hover:border-[var(--lpe-tinta-3)] ${
                      hayError ? 'border-[#b42318]' : 'border-[var(--lpe-linea)]'
                    }`
              }`}
            >
              <span className="block">{o.etiqueta}</span>
              {columna && o.ayuda && (
                <span
                  className={`mt-0.5 block text-[0.8125rem] font-normal ${
                    activo ? 'text-[var(--lpe-teal)]' : 'text-[var(--lpe-tinta-3-texto)]'
                  }`}
                >
                  {o.ayuda}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          id={`${idBase}-${clave}-error`}
          role="alert"
          className="lpe-cuerpo mt-2 text-[0.8125rem] text-[#b42318]"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default function FormEnganche({
  variante,
  plazos,
  loteRef,
  loteTitulo,
  engancheTexto,
  tiempoRespuesta = 'el mismo día hábil',
}: FormEngancheProps) {
  const uid = useId();
  const perfil = PERFIL[variante];

  // El plazo solo arranca contestado donde SE PREGUNTA. En el hero, que no lo
  // pregunta, queda en null y el `message` dice «plan de pagos completo»: es
  // cierto, y es mejor que mandar al CRM un plazo que nadie eligió.
  const [plazo, setPlazo] = useState<number | null>(
    perfil.plazo ? (plazos.at(-1) ?? null) : null,
  );
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  /** Campo simple de 10 dígitos. Solo en `medio`. */
  const [whatsapp, setWhatsapp] = useState('');
  /** E.164 del selector de lada (`+529841234567`). En `hero` y `cierre`. */
  const [telefono, setTelefono] = useState<string | undefined>(undefined);
  const [uso, setUso] = useState<string | null>(null);
  const [enganche, setEnganche] = useState<string | null>(null);
  const [zona, setZona] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  /** Fallo de red o del endpoint. Distinto de `errores`, que son de los campos. */
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Partial<Record<ClaveError, string>>>({});
  const [enviado, setEnviado] = useState(false);
  const atribucion = useRef<Atribucion>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const refNombre = useRef<HTMLInputElement>(null);
  const refCorreo = useRef<HTMLInputElement>(null);
  const refWhatsapp = useRef<HTMLInputElement>(null);
  /** Contenedor del selector de lada: el `<input>` real vive dentro. */
  const cajaTelefono = useRef<HTMLDivElement>(null);
  /** Para llevar el foco a los grupos del diagnóstico, que no son `<input>`. */
  const refForm = useRef<HTMLFormElement>(null);

  function limpiar(clave: ClaveError) {
    // El error se limpia al TECLEAR o al elegir, no al reenviar: dejarlo en
    // rojo mientras la persona lo corrige es castigarla por corregir.
    setErrores((x) => (x[clave] ? { ...x, [clave]: undefined } : x));
  }

  /**
   * ⚠️ EL CAMPO SE VE LLENO Y EL BOTÓN DICE QUE ESTÁ VACÍO.
   *
   * Este efecto NO es opcional y no se puede borrar por parecer redundante. El
   * componente es un formulario CONTROLADO servido por SSR: entre que el HTML
   * llega y React hidrata hay una ventana en la que el DOM acepta texto que el
   * estado de React nunca ve. Al hidratar, React reconcilia el nodo y da por
   * bueno su estado —vacío—, así que el valor escrito antes queda huérfano.
   *
   * El resultado en pantalla es el peor posible: el campo SE VE lleno, con el
   * nombre y el teléfono a la vista, y al pulsar enviar sale «Falta tu nombre o
   * tu WhatsApp». Sin error de consola, sin POST y sin lead. Y no se cura solo:
   * el estado sigue vacío hasta que la persona vuelve a teclear.
   *
   * El disparador más común no es teclear rápido: es el AUTOCOMPLETADO del
   * navegador, que rellena los campos de golpe y en muchos navegadores no
   * dispara el `onChange` que React escucha. O sea, le pasa justo a quien tiene
   * sus datos guardados y venía con la menor fricción posible.
   *
   * Se descubrió aquí con el escenario B de `tests/lp-enganche-conversion.mjs`,
   * que dio rojo la primera vez que se corrió contra esta variante: el
   * formulario se copió de `FormTerrenos` SIN este efecto.
   *
   * ⚠️ EL SELECTOR DE LADA TAMBIÉN. Los otros formularios del sitio
   * (`FormTerrenos`, `LeadFormLotes`, `FormCasas`) dejan el teléfono FUERA de
   * esta sincronía porque su `<input>` muestra el número formateado mientras el
   * estado guarda el E.164 canónico. Pero eso solo aplica al submit; en la
   * ventana pre-hidratación el problema es idéntico al del nombre, y aquí el
   * escenario B lo cubre con una aserción. Así que sí se lee, y se normaliza:
   * el autocompletado escribe «9849876543», no «+529849876543».
   *
   * Sincronizar el DOM hacia React es el caso de uso legítimo de `useEffect`:
   * leer un sistema externo que cambió por fuera. Solo escribe si hay
   * divergencia real, así que en el camino normal no provoca ni un render.
   */
  useEffect(() => {
    const nombreDom = refNombre.current?.value ?? '';
    const correoDom = refCorreo.current?.value ?? '';
    const waDom = refWhatsapp.current?.value ?? '';
    if (nombreDom) setNombre((actual) => (actual === nombreDom ? actual : nombreDom));
    if (correoDom) setCorreo((actual) => (actual === correoDom ? actual : correoDom));
    if (waDom) setWhatsapp((actual) => (actual === waDom ? actual : waDom));

    const inputTel = cajaTelefono.current?.querySelector<HTMLInputElement>(
      'input[name="phone"]',
    );
    const telDom = inputTel?.value ?? '';
    const digitos = telDom.replace(/\D/g, '');
    // El selector renderiza «+52» de fábrica: dos dígitos no son un teléfono.
    // Se exigen 10, que es el mínimo de un móvil mexicano.
    if (digitos.length >= 10) {
      const e164 = telDom.trim().startsWith('+')
        ? `+${digitos}`
        : // Sin lada explícita se asume México, que es el `defaultCountry` del
          // selector y de dónde viene el tráfico de esta campaña.
          `+52${digitos.slice(-10)}`;
      setTelefono((actual) =>
        (actual ?? '').replace(/\D/g, '').length >= 10 ? actual : e164,
      );
    }
  }, []);

  // Atribución leída una vez, al montar. Deliberadamente sin sessionStorage: el
  // POST sale de esta misma vista, no hay navegación que sobrevivir.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const captura: Atribucion = {};
    for (const clave of CLAVES_URL) {
      const valor = params.get(clave);
      if (valor) captura[clave] = valor;
    }
    atribucion.current = captura;
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);

    /**
     * ⚠️ EL ERROR VA EN EL CAMPO, NO EN UN AVISO GENERAL.
     *
     * Antes era un solo mensaje debajo del formulario: «Falta tu nombre o tu
     * WhatsApp». Con dos campos, un «o» obliga a la persona a mirar los dos y
     * adivinar cuál falló, y el aviso vivía a 200 px del campo culpable. Con
     * seis campos en el cierre eso sería inaceptable. Ahora cada campo dice lo
     * suyo, debajo de sí mismo, y lleva `aria-invalid` + `aria-describedby`
     * para que un lector de pantalla lo anuncie al llegar.
     */
    const nuevos: Partial<Record<ClaveError, string>> = {};

    if (!nombre.trim()) nuevos.nombre = 'Escribe tu nombre para que sepamos cómo llamarte.';

    if (perfil.correo) {
      // Regex laxa a propósito. El zod de `/api/leads` sí valida `.email()`, y
      // un correo que no pase ALLÍ tumba el `safeParse` entero: 400 y lead
      // perdido. Filtrar aquí lo evidente es lo que impide que eso pase; pasar
      // de laxo a estricto sería inventar reglas que ningún RFC exige.
      if (!correo.trim()) {
        nuevos.correo = 'Necesitamos tu correo para mandarte el plan en PDF.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
        nuevos.correo = 'Revisa el correo: parece que le falta algo.';
      }
    }

    if (perfil.lada) {
      // La validación por país la hace el selector: quien escribe desde fuera
      // de México ya no pierde el lead por no tener 10 dígitos.
      if (!telefono) {
        nuevos.telefono = 'Necesitamos tu teléfono para mandarte el plan.';
      } else if (!isValidPhoneNumber(telefono)) {
        nuevos.telefono = 'Revisa el número: elige tu país y escríbelo completo.';
      }
    } else {
      // 10 dígitos es el largo de un móvil en México. Se cuentan DÍGITOS, no se
      // valida un formato: quien escribe "984 123 4567" o "+52 984..." no puede
      // perder el lead por un espacio.
      const digitos = whatsapp.replace(/\D/g, '').length;
      if (!whatsapp.trim()) {
        nuevos.telefono = 'Necesitamos tu WhatsApp para mandarte el plan.';
      } else if (digitos < 10) {
        nuevos.telefono = `Van ${digitos} de 10 dígitos.`;
      }
    }

    if (perfil.diagnostico && DIAGNOSTICO_OBLIGATORIO) {
      if (!uso) nuevos.uso = 'Elige para qué lo quieres.';
      if (!enganche) nuevos.enganche = 'Elige un rango. Es aproximado, no un compromiso.';
      if (!zona) nuevos.zona = 'Elige una zona o marca que estás abierto.';
    }

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      // Llevar el foco al primer campo con problema: sin esto, en móvil el
      // mensaje puede quedar fuera de pantalla y el botón parece no hacer nada.
      // El orden del array ES el orden visual del formulario.
      const primero = (['nombre', 'correo', 'telefono', 'uso', 'enganche', 'zona'] as const).find(
        (clave) => nuevos[clave],
      );
      const destino =
        primero === 'nombre'
          ? refNombre.current
          : primero === 'correo'
            ? refCorreo.current
            : primero === 'telefono'
              ? (perfil.lada
                  ? cajaTelefono.current?.querySelector<HTMLInputElement>('input[name="phone"]')
                  : refWhatsapp.current) ?? null
              : // Los grupos del diagnóstico no son un `<input>`: el foco va al
                // primer botón, que es lo que un teclado puede accionar.
                refForm.current?.querySelector<HTMLButtonElement>(
                  `[data-lpe-grupo="${primero}"] button`,
                ) ?? null;
      destino?.focus();
      destino?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const telefonoEnviado = perfil.lada ? (telefono ?? '') : whatsapp.trim();
    const zonaElegida = ZONAS.find((z) => z.valor === zona);

    setEnviando(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ⚠️ Literal de `KNOWN_SOURCES`. Cambiarlo rompe el mapa de Zoho.
          source: 'lp_lotes_pdc',
          locale: 'es',
          name: nombre.trim(),
          ...(perfil.correo ? { email: correo.trim() } : {}),
          phone: telefonoEnviado,
          whatsapp: telefonoEnviado,
          propertyName: loteTitulo,
          // El diagnóstico va en CAMPOS, no solo en el texto: `field-maps.ts`
          // los saca en la Description de Zoho como «Objetivo», «Enganche
          // disponible» y —vía `City`— la zona. Un dato en la Description se
          // lee; un dato dentro de un párrafo se pierde.
          ...(perfil.diagnostico
            ? {
                ...(uso ? { investmentType: uso } : {}),
                ...(enganche ? { budget: enganche } : {}),
                ...(zonaElegida?.ciudad ? { location: zonaElegida.ciudad } : {}),
              }
            : {}),
          message: [
            `Lote ref. ${loteRef}.`,
            plazo
              ? `Pidió el plan de pagos a ${plazo} meses.`
              : 'Pidió el plan de pagos completo.',
            // Repetir el diagnóstico aquí no es redundancia gratuita: es lo
            // único que sobrevive si mañana alguien cambia el mapa de campos.
            perfil.diagnostico && (uso || enganche || zona)
              ? `Diagnóstico — uso: ${uso ?? 'sin responder'}; enganche disponible: ${
                  enganche ?? 'sin responder'
                }; zona: ${zona ?? 'sin responder'}.`
              : null,
            `Origen: landing de enganche (variante C), bloque «${variante}».`,
          ]
            .filter(Boolean)
            .join(' '),
          // `page` se mapea a Nombre_anuncio en Zoho: es lo que permite separar
          // los leads de esta variante de los de las otras dos dentro del CRM.
          page: window.location.href,
          website: honeypot.current?.value || '',
          ...atribucion.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // El disparo a Ads va DESPUÉS del 200: una conversión reportada sobre un
      // lead que no se guardó es peor que ninguna.
      trackGenerateLead({ formType: FORM_TYPE });
      setEnviado(true);
    } catch {
      setError('No pudimos enviarlo. Inténtalo otra vez o escríbenos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  }

  // Agradecimiento en la misma ruta. Redirigir a /gracias perdería el gclid de
  // la URL y el contexto de medición.
  if (enviado) {
    return (
      <div
        data-lpe-form={variante}
        className="rounded-[var(--lpe-r)] border border-[var(--lpe-linea)] bg-[var(--lpe-aqua-suave)] p-7 sm:p-9"
      >
        <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">Solicitud recibida</p>
        <p className="lpe-titular mt-3 text-[clamp(1.5rem,1.2rem+1.4vw,2rem)]">
          Listo, {nombre.trim().split(' ')[0]}.
        </p>
        <p className="lpe-cuerpo mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--lpe-tinta-2)]">
          Te escribimos por WhatsApp {tiempoRespuesta} con el plan completo
          {plazo ? ` a ${plazo} meses` : ''}: enganche, mensualidad, contraentrega
          y qué cubre la escritura. Una persona, no un robot.
          {perfil.diagnostico
            ? ' Y con la opción que cuadra con lo que nos dijiste, no con el catálogo entero.'
            : ''}
        </p>
      </div>
    );
  }

  const campo =
    'lpe-cuerpo min-h-[56px] w-full rounded-[var(--lpe-r-pill)] border px-5 text-[1rem] text-[var(--lpe-tinta)] transition-colors duration-200 placeholder:text-[var(--lpe-tinta-3-texto)]';

  /** Un campo LLENO se ve más activo, no menos: antes el relleno quedaba gris
   *  hundido y parecía deshabilitado. `dentro` es para el selector de lada, que
   *  dibuja el borde en el contenedor y no en el `<input>`. */
  const bordes = (lleno: boolean, hayError: boolean, dentro = false) =>
    hayError
      ? 'border-[#b42318] bg-white'
      : lleno
        ? 'border-[var(--lpe-tinta-3)] bg-white'
        : dentro
          ? 'border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] focus-within:border-[var(--lpe-tinta)] focus-within:bg-white'
          : 'border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] focus:border-[var(--lpe-tinta)] focus:bg-white';

  return (
    <form
      ref={refForm}
      onSubmit={enviar}
      data-lpe-form={variante}
      noValidate
      className="rounded-[var(--lpe-r)] border border-[var(--lpe-linea)] bg-[var(--lpe-blanco)] p-6 shadow-[0_28px_70px_-32px_rgb(15_25_35/0.35)] sm:p-9"
    >
      {/* ═══ LA PROMESA ═══
          ⚠️ EL TITULAR DICE LO QUE RECIBES, NO LO QUE PAGAS.

          Antes decía «Aparta el tuyo con $202,176 MXN» encima de dos campos, y
          esa era la peor frase del formulario: prometía una transacción donde
          solo hay una solicitud de información. Quien lo lee entiende que al
          enviar aparta un lote o que le van a cobrar, y no pasa ninguna de las
          dos cosas — lo que llega es un PDF por WhatsApp.

          La cifra del enganche no desaparece de la página: es el H1 del hero,
          justo al lado, y la sección 03 la desglosa entera. Aquí sobraba, y
          encima competía con el botón por decir de qué va la acción.

          Ahora el titular y el botón dicen LO MISMO, que es la regla más básica
          de un formulario que se entiende sin pensarlo. */}
      <h2 className="lpe-titular text-[clamp(1.5rem,1.3rem+1.1vw,2rem)]">
        Recibe el <span className="lpe-italica">plan de pagos</span> completo
      </h2>

      {/* Qué trae, ANTES de pedir los datos. Es la respuesta a «¿para qué te doy
          mi teléfono?», y estaba enterrada debajo del botón. */}
      <ul className="mt-5 space-y-2">
        {[
          engancheTexto ? `Enganche de ${engancheTexto}` : 'El enganche exacto',
          'La mensualidad de cada plazo',
          'Contraentrega y gastos de escrituración',
        ].map((linea) => (
          <li key={linea} className="flex items-start gap-2.5">
            <svg
              className="mt-[3px] shrink-0 text-[var(--lpe-teal-texto)]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 8.5l3 3 6-6.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="lpe-cuerpo text-[0.9375rem] leading-snug text-[var(--lpe-tinta-2)]">
              {linea}
            </span>
          </li>
        ))}
      </ul>

      {/* ═══ LOS CAMPOS ═══
          ⚠️ ETIQUETA VISIBLE Y PERMANENTE, NO PLACEHOLDER.

          Antes el `<label>` era `sr-only` y el nombre del campo vivía en el
          placeholder. En cuanto escribes, el placeholder desaparece: el
          formulario relleno ya no dice qué es cada cosa, y para recordarlo hay
          que borrar el campo. Con dos campos casi se adivina; con el teléfono
          NO, porque ahí el formato importa.

          El placeholder queda para lo único que sí sabe hacer: dar un EJEMPLO
          del formato esperado. */}
      <div className="mt-7 space-y-5">
        <div>
          <label
            htmlFor={`${uid}-nombre`}
            className="lpe-cuerpo mb-2 block text-[0.875rem] font-medium text-[var(--lpe-tinta)]"
          >
            Tu nombre
          </label>
          <input
            id={`${uid}-nombre`}
            ref={refNombre}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Como quieres que te llamemos"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              limpiar('nombre');
            }}
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? `${uid}-nombre-error` : undefined}
            className={`${campo} ${bordes(Boolean(nombre), Boolean(errores.nombre))}`}
          />
          {errores.nombre && (
            <p
              id={`${uid}-nombre-error`}
              role="alert"
              className="lpe-cuerpo mt-2 text-[0.8125rem] text-[#b42318]"
            >
              {errores.nombre}
            </p>
          )}
        </div>

        {/* El correo solo en `hero` y `cierre`. En el medio se quedó fuera a
            propósito: ese bloque es el control del experimento. */}
        {perfil.correo && (
          <div>
            <label
              htmlFor={`${uid}-correo`}
              className="lpe-cuerpo mb-2 block text-[0.875rem] font-medium text-[var(--lpe-tinta)]"
            >
              Tu correo
            </label>
            <input
              id={`${uid}-correo`}
              ref={refCorreo}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                limpiar('correo');
              }}
              aria-invalid={errores.correo ? true : undefined}
              aria-describedby={
                errores.correo ? `${uid}-correo-error` : `${uid}-correo-ayuda`
              }
              className={`${campo} ${bordes(Boolean(correo), Boolean(errores.correo))}`}
            />
            {errores.correo ? (
              <p
                id={`${uid}-correo-error`}
                role="alert"
                className="lpe-cuerpo mt-2 text-[0.8125rem] text-[#b42318]"
              >
                {errores.correo}
              </p>
            ) : (
              <p
                id={`${uid}-correo-ayuda`}
                className="lpe-cuerpo mt-2 text-[0.8125rem] text-[var(--lpe-tinta-3-texto)]"
              >
                Ahí te llega el plan en PDF.
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor={`${uid}-tel`}
            className="lpe-cuerpo mb-2 block text-[0.875rem] font-medium text-[var(--lpe-tinta)]"
          >
            {perfil.lada ? 'Tu teléfono o WhatsApp' : 'Tu WhatsApp'}
          </label>

          {/* ⚠️ EL SELECTOR DE LADA, no un campo de 10 dígitos.
              Decisión de Luis del 2026-09-02: iguala el hero y el cierre con
              los otros 18 formularios del sitio y con las variantes A y B, que
              ya lo usan. El número sale en E.164 (`+529841234567`), que es lo
              que llega a Zoho — cualquier aserción sobre `phone` debe esperar
              ese formato, no lo tecleado. El `medio` conserva el campo simple:
              es el control del experimento. */}
          {perfil.lada ? (
            <div ref={cajaTelefono}>
              <PhoneInputField
                id={`${uid}-tel`}
                name="phone"
                value={telefono}
                onChange={(v) => {
                  setTelefono(v);
                  limpiar('telefono');
                }}
                placeholder="984 123 4567"
                required
                invalid={Boolean(errores.telefono)}
                describedBy={
                  errores.telefono ? `${uid}-tel-error` : `${uid}-tel-ayuda`
                }
                className={`${campo} ${bordes(
                  Boolean(telefono),
                  Boolean(errores.telefono),
                  true,
                )}`}
              />
            </div>
          ) : (
            <input
              id={`${uid}-tel`}
              ref={refWhatsapp}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="984 123 4567"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                limpiar('telefono');
              }}
              aria-invalid={errores.telefono ? true : undefined}
              aria-describedby={
                errores.telefono ? `${uid}-tel-error` : `${uid}-tel-ayuda`
              }
              className={`${campo} ${bordes(Boolean(whatsapp), Boolean(errores.telefono))}`}
            />
          )}

          {errores.telefono ? (
            <p
              id={`${uid}-tel-error`}
              role="alert"
              className="lpe-cuerpo mt-2 text-[0.8125rem] text-[#b42318]"
            >
              {errores.telefono}
            </p>
          ) : (
            /* La ayuda va SIEMPRE visible, no solo cuando ya fallaste: decir el
               formato antes evita el error, en vez de regañarlo después. */
            <p
              id={`${uid}-tel-ayuda`}
              className="lpe-cuerpo mt-2 text-[0.8125rem] text-[var(--lpe-tinta-3-texto)]"
            >
              {perfil.lada
                ? 'Elige tu país y escribe el número. Es donde te llega el plan.'
                : '10 dígitos. Es donde te llega el plan.'}
            </p>
          )}
        </div>
      </div>

      {/* ═══ EL DIAGNÓSTICO ═══ (solo el cierre)
          ⚠️ NO ES UNA COMPUERTA. Son campos visibles del mismo formulario, en
          la misma pantalla y con el mismo botón. La compuerta de la variante A
          —dos preguntas ANTES de que existiera un `<form>`— costó $991.40 MXN
          en 72 clics con cero envíos; eso no vuelve.

          Va DESPUÉS de los datos de contacto, no antes: si alguien abandona a
          mitad del diagnóstico, al menos el navegador ya guardó su nombre y su
          correo para el siguiente formulario. Al revés se pierde todo. */}
      {perfil.diagnostico && (
        <div className="mt-8 space-y-7 border-t border-[var(--lpe-linea)] pt-7">
          <div>
            <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">
              Tres toques y llegamos con una opción
            </p>
            <p className="lpe-cuerpo mt-2 text-[0.875rem] leading-relaxed text-[var(--lpe-tinta-2)]">
              Con esto el asesor te escribe con el lote y el plan que cuadran con
              tu caso, no con el catálogo entero. Nada de esto es un compromiso.
            </p>
          </div>

          <GrupoOpciones
            idBase={uid}
            clave="uso"
            pregunta="¿Para qué lo quieres?"
            opciones={USOS}
            valor={uso}
            error={errores.uso}
            elegir={(v) => {
              setUso(v);
              limpiar('uso');
            }}
            columna
          />

          <GrupoOpciones
            idBase={uid}
            clave="enganche"
            pregunta="¿Cuánto puedes poner de enganche?"
            nota="En miles de pesos mexicanos (MXN). Aproximado."
            opciones={ENGANCHES}
            valor={enganche}
            error={errores.enganche}
            elegir={(v) => {
              setEnganche(v);
              limpiar('enganche');
            }}
          />

          <GrupoOpciones
            idBase={uid}
            clave="zona"
            pregunta="¿Dónde te interesa?"
            opciones={ZONAS}
            valor={zona}
            error={errores.zona}
            elegir={(v) => {
              setZona(v);
              limpiar('zona');
            }}
          />
        </div>
      )}

      {/* ═══ EL PLAZO ═══
          ⚠️ VA DESPUÉS DE LOS CAMPOS, Y SE LEE COMO UN AJUSTE.

          Estaba ARRIBA del todo, con dos botones a ancho completo, y era lo
          primero y más pesado del panel: el formulario abría con una pregunta y
          se leía como un cuestionario. Peor, decía «¿A cuántos meses quieres el
          resto?» — «el resto» no tiene antecedente dentro del formulario, y
          quien entra directo aquí desde el anuncio no sabe de qué resto habla.

          Sigue viniendo contestado con el plazo más largo, así que el coste de
          entrada sigue siendo cero y el asesor abre la conversación sabiendo de
          qué plan se habla. Lo que cambia es que ahora está donde le toca: un
          ajuste, después de lo importante, y dicho de forma que se entienda sin
          haber leído el resto de la página.

          En el HERO ya no se pregunta: ese bloque es «el tradicional» —nombre,
          correo, teléfono— y el plazo, aunque venga contestado, es una cuarta
          decisión en el primer viewport. */}
      {perfil.plazo && plazos.length > 0 && (
        <fieldset className="mt-7 border-t border-[var(--lpe-linea)] pt-6">
          <legend className="sr-only">Plazo para calcular las mensualidades</legend>
          <p
            aria-hidden="true"
            className="lpe-cuerpo text-[0.875rem] font-medium text-[var(--lpe-tinta)]"
          >
            ¿A cuántos meses te lo calculamos?{' '}
            <span className="font-normal text-[var(--lpe-tinta-3-texto)]">
              Puedes cambiarlo después.
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {plazos.map((m) => {
              const activo = plazo === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPlazo(m)}
                  aria-pressed={activo}
                  className={`lpe-cuerpo min-h-11 rounded-[var(--lpe-r-pill)] border px-5 text-[0.9375rem] transition-[background-color,border-color,color] duration-200 ${
                    activo
                      ? 'border-[var(--lpe-tinta)] bg-[var(--lpe-tinta)] font-medium text-[var(--lpe-blanco)]'
                      : 'border-[var(--lpe-linea)] bg-transparent text-[var(--lpe-tinta-2)] hover:border-[var(--lpe-tinta-3)]'
                  }`}
                >
                  {m} meses
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Honeypot. `aria-hidden` + tabIndex para que ningún lector lo anuncie. */}
      <input
        ref={honeypot}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* Fallo de red o del endpoint. Es distinto de un campo mal llenado: no es
          culpa de la persona y la salida es otra, así que va aparte y pegado al
          botón que falló. */}
      {error && (
        <p role="alert" className="lpe-cuerpo mt-5 text-[0.875rem] text-[#b42318]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="group mt-7 flex min-h-[60px] w-full items-center justify-between gap-3 rounded-[var(--lpe-r-pill)] bg-[var(--lpe-teal)] pl-7 pr-2.5 text-[1.0625rem] font-medium text-[var(--lpe-tinta)] transition-[background-color,transform] duration-200 hover:bg-[var(--lpe-teal-hover)] active:translate-y-px disabled:opacity-60"
      >
        <span className="lpe-cuerpo font-medium">
          {enviando ? 'Enviando…' : 'Recibe el plan de pagos'}
        </span>
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--lpe-tinta)] text-[var(--lpe-teal)] transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h9M8.5 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Qué pasa DESPUÉS de pulsar, con el icono del canal: quien deja su
          WhatsApp quiere saber si le va a sonar el teléfono. */}
      <p className="lpe-cuerpo mt-4 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3-texto)]">
        <svg
          className="mt-[2px] shrink-0 text-[var(--lpe-wa)]"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.26 8.23Z" />
        </svg>
        <span>
          Te escribe un asesor por WhatsApp {tiempoRespuesta}. Sin llamadas
          automáticas y sin compartir tu número con terceros.
        </span>
      </p>
    </form>
  );
}
