'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { trackGenerateLead } from '@/lib/analytics/track';

// ============================================================
// LA CONVERSIÓN de la variante C.
//
// ═══ LA PLOMERÍA ES LA MISMA. NO SE TOCA. ═══
//
// Cambia el estilo, no la medición. Este componente es un gemelo visual de
// `FormTerrenos` con la MISMA tubería, y eso es deliberado:
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
// ═══ DOS CAMPOS, UN PASO, SIN COMPUERTA ═══
//
// Ya se pagó por aprender esto: la campaña gastó $991.40 MXN en 72 clics en 6
// días con CERO envíos porque los campos vivían detrás de dos preguntas y
// `document.querySelectorAll('form').length` daba 0. Un formulario detrás de
// una compuerta no es un formulario corto: es un formulario invisible.
//
// El plazo SÍ se pregunta y va PRIMERO, porque no es fricción: es el gancho. Ya
// viene contestado con el plazo más largo —la mensualidad más baja—, así que el
// coste de entrada sigue siendo cero.
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

// Aquí vivía un `ORDINAL` que rotulaba el panel como «Solicitud · 01 / 02 / 03».
// Se quitó: era numeración INTERNA —la posición de la instancia en el
// documento— expuesta al visitante, que no tiene forma de saber qué significa
// ni qué pasó con las otras dos. Lo mismo con el «2 campos» de la esquina: era
// un dato de diseñador, no del comprador, y los dos campos ya se ven.
// La instancia sigue viajando al CRM en el `message`, que es donde importa.

export interface FormEngancheProps {
  variante: 'hero' | 'medio' | 'cierre';
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

export default function FormEnganche({
  variante,
  plazos,
  loteRef,
  loteTitulo,
  engancheTexto,
  tiempoRespuesta = 'el mismo día hábil',
}: FormEngancheProps) {
  const uid = useId();
  const [plazo, setPlazo] = useState<number | null>(plazos.at(-1) ?? null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);
  /** Fallo de red o del endpoint. Distinto de `errores`, que son de los campos. */
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<{ nombre?: string; whatsapp?: string }>({});
  const [enviado, setEnviado] = useState(false);
  const atribucion = useRef<Atribucion>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const refNombre = useRef<HTMLInputElement>(null);
  const refWhatsapp = useRef<HTMLInputElement>(null);

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
   * navegador, que rellena los dos campos de golpe y en muchos navegadores no
   * dispara el `onChange` que React escucha. O sea, le pasa justo a quien tiene
   * sus datos guardados y venía con la menor fricción posible.
   *
   * Se descubrió aquí con el escenario B de `tests/lp-enganche-conversion.mjs`,
   * que dio rojo la primera vez que se corrió contra esta variante: el
   * formulario se copió de `FormTerrenos` SIN este efecto.
   *
   * Sincronizar el DOM hacia React es el caso de uso legítimo de `useEffect`:
   * leer un sistema externo que cambió por fuera. Solo escribe si hay
   * divergencia real, así que en el camino normal no provoca ni un render.
   */
  useEffect(() => {
    const nombreDom = refNombre.current?.value ?? '';
    const waDom = refWhatsapp.current?.value ?? '';
    if (nombreDom) setNombre((actual) => (actual === nombreDom ? actual : nombreDom));
    if (waDom) setWhatsapp((actual) => (actual === waDom ? actual : waDom));
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
     * adivinar cuál falló, y el aviso vivía a 200 px del campo culpable. Ahora
     * cada campo dice lo suyo, debajo de sí mismo, y lleva `aria-invalid` +
     * `aria-describedby` para que un lector de pantalla lo anuncie al llegar.
     */
    const nuevos: { nombre?: string; whatsapp?: string } = {};
    if (!nombre.trim()) nuevos.nombre = 'Escribe tu nombre para que sepamos cómo llamarte.';
    // 10 dígitos es el largo de un móvil en México. Se cuentan DÍGITOS, no se
    // valida un formato: quien escribe "984 123 4567" o "+52 984..." no puede
    // perder el lead por un espacio.
    const digitos = whatsapp.replace(/\D/g, '').length;
    if (!whatsapp.trim()) {
      nuevos.whatsapp = 'Necesitamos tu WhatsApp para mandarte el plan.';
    } else if (digitos < 10) {
      nuevos.whatsapp = `Van ${digitos} de 10 dígitos.`;
    }

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      // Llevar el foco al primer campo con problema: sin esto, en móvil el
      // mensaje puede quedar fuera de pantalla y el botón parece no hacer nada.
      (nuevos.nombre ? refNombre : refWhatsapp).current?.focus();
      return;
    }

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
          phone: whatsapp.trim(),
          whatsapp: whatsapp.trim(),
          propertyName: loteTitulo,
          message: [
            `Lote ref. ${loteRef}.`,
            plazo
              ? `Pidió el plan de pagos a ${plazo} meses.`
              : 'Pidió el plan de pagos completo.',
            `Origen: landing de enganche (variante C), bloque «${variante}».`,
          ].join(' '),
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
        </p>
      </div>
    );
  }

  const campo =
    'lpe-cuerpo min-h-[56px] w-full rounded-[var(--lpe-r-pill)] border px-5 text-[1rem] text-[var(--lpe-tinta)] transition-colors duration-200 placeholder:text-[var(--lpe-tinta-3-texto)]';

  return (
    <form
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
              // El error se limpia al TECLEAR, no al reenviar: dejarlo en rojo
              // mientras la persona lo corrige es castigarla por corregir.
              if (errores.nombre) setErrores((x) => ({ ...x, nombre: undefined }));
            }}
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? `${uid}-nombre-error` : undefined}
            className={`${campo} ${
              errores.nombre
                ? 'border-[#b42318] bg-white'
                : // Un campo LLENO se ve más activo, no menos: antes el relleno
                  // quedaba gris hundido y parecía deshabilitado.
                  nombre
                  ? 'border-[var(--lpe-tinta-3)] bg-white'
                  : 'border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] focus:border-[var(--lpe-tinta)] focus:bg-white'
            }`}
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

        <div>
          <label
            htmlFor={`${uid}-wa`}
            className="lpe-cuerpo mb-2 block text-[0.875rem] font-medium text-[var(--lpe-tinta)]"
          >
            Tu WhatsApp
          </label>
          <input
            id={`${uid}-wa`}
            ref={refWhatsapp}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="984 123 4567"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              if (errores.whatsapp) setErrores((x) => ({ ...x, whatsapp: undefined }));
            }}
            aria-invalid={errores.whatsapp ? true : undefined}
            aria-describedby={errores.whatsapp ? `${uid}-wa-error` : `${uid}-wa-ayuda`}
            className={`${campo} ${
              errores.whatsapp
                ? 'border-[#b42318] bg-white'
                : whatsapp
                  ? 'border-[var(--lpe-tinta-3)] bg-white'
                  : 'border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] focus:border-[var(--lpe-tinta)] focus:bg-white'
            }`}
          />
          {errores.whatsapp ? (
            <p
              id={`${uid}-wa-error`}
              role="alert"
              className="lpe-cuerpo mt-2 text-[0.8125rem] text-[#b42318]"
            >
              {errores.whatsapp}
            </p>
          ) : (
            /* La ayuda va SIEMPRE visible, no solo cuando ya fallaste: decir el
               formato antes evita el error, en vez de regañarlo después. */
            <p
              id={`${uid}-wa-ayuda`}
              className="lpe-cuerpo mt-2 text-[0.8125rem] text-[var(--lpe-tinta-3-texto)]"
            >
              10 dígitos. Es donde te llega el plan.
            </p>
          )}
        </div>
      </div>

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
          haber leído el resto de la página. */}
      {plazos.length > 0 && (
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
