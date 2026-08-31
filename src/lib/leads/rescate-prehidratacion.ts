/**
 * ═══ RESCATE DE LO QUE SE ESCRIBIÓ ANTES DE HIDRATAR ═══
 *
 * El bug que esto arregla, medido contra producción el 2026-08-21:
 *
 *   El HTML del servidor pinta el formulario a los ~600 ms, pero React no
 *   hidrata hasta ~2.2 s —más en un móvil con 4G, porque compiten GA4, el
 *   Pixel de Meta, Hotjar y el de OpenAI por el hilo principal—. Quien
 *   rellene en esa ventana deja su texto en el DOM, pero el estado de React
 *   sigue en `''`: React nunca lee de vuelta un input controlado al hidratar.
 *
 *   El resultado en pantalla es el peor posible. El campo SE VE lleno, con el
 *   nombre y el teléfono a la vista, y al pulsar enviar sale «falta tu
 *   nombre» —o, en los formularios que solo hacen `return`, no pasa nada en
 *   absoluto—. No hay error de consola, no hay POST, no hay lead. Y no se
 *   cura solo: el estado sigue vacío hasta que la persona vuelve a teclear
 *   DENTRO del campo.
 *
 *   El disparador más común NO es teclear rápido: es el AUTOCOMPLETADO del
 *   navegador, que rellena los campos de golpe y en muchos navegadores no
 *   dispara el `change` que React escucha. Le toca justo a quien tenía sus
 *   datos guardados y llegaba con la menor fricción de todas.
 *
 * El rescate se hace EN EL ENVÍO, leyendo el `<form>` con `FormData`, y no con
 * un `useEffect` que sincronice al montar. Los dos arreglan el autocompletado
 * previo a la hidratación, pero el efecto solo mira una vez: si el gestor de
 * contraseñas rellena DESPUÉS de montar sin disparar `change` —lo hacen
 * varios—, el efecto ya pasó y el lead se pierde igual. `FormData` mira en el
 * único instante que importa, que es cuando la persona pulsa enviar.
 *
 * Requisito: cada campo debe llevar su `name` en el HTML, y ese `name` debe
 * coincidir con la clave del estado. Un campo sin `name` no aparece en
 * `FormData` y se queda con lo que tuviera el estado, que es el comportamiento
 * de antes: este rescate nunca puede empeorar un campo.
 */

/** Un campo cuyo valor canónico vive en el estado y NO en lo que se ve. */
export interface OpcionesRescate<T> {
  /**
   * Campos donde manda el estado y el DOM es solo la red de seguridad.
   *
   * El caso real es el teléfono: el `<input>` del selector de lada muestra el
   * número formateado («+52 984 123 4567») mientras el estado guarda el E.164
   * canónico («+529841234567»), que es lo que field-maps manda a Zoho. Si
   * ganara el DOM, el asesor recibiría el número con espacios.
   */
  estadoManda?: readonly (keyof T & string)[];
}

/**
 * Devuelve los valores del formulario con el DOM por delante del estado.
 *
 * @param origen   el `<form>` que se está enviando (`e.currentTarget`). Acepta
 *                 también un `FormData` ya construido: así la lógica de
 *                 precedencia se puede probar sin un DOM.
 * @param estado   las claves a rescatar, con el valor que tiene React
 */
export function rescatarDelDom<T extends Record<string, string | undefined>>(
  origen: HTMLFormElement | FormData,
  estado: T,
  opciones: OpcionesRescate<T> = {},
): { [K in keyof T]: string } {
  const campos = origen instanceof FormData ? origen : new FormData(origen);
  const estadoManda = new Set<string>(opciones.estadoManda ?? []);
  const rescatado = {} as { [K in keyof T]: string };

  for (const clave of Object.keys(estado) as (keyof T & string)[]) {
    const crudo = campos.get(clave);
    // Un `<input type="file">` devuelve un File; no es un campo de texto y no
    // tiene nada que rescatar.
    const enDom = typeof crudo === 'string' ? crudo.trim() : '';
    const enEstado = (estado[clave] ?? '').trim();

    rescatado[clave] = estadoManda.has(clave) ? enEstado || enDom : enDom || enEstado;
  }

  return rescatado;
}

/**
 * Updater para `setState` que sincroniza el estado con lo rescatado del DOM.
 *
 * Sin esto, la persona que fue rescatada se queda mirando unos campos llenos
 * que React sigue creyendo vacíos: si la validación falla por otro motivo, o
 * si la pantalla de éxito la saluda por su nombre, el dato no está. Devuelve
 * el objeto anterior cuando no hay divergencia, así que en el camino normal
 * —React hidrató antes de que nadie tocara nada— no provoca ni un render.
 */
export function sincronizar<T extends Record<string, string | undefined>>(datos: Partial<T>) {
  return (previo: T): T => {
    for (const clave of Object.keys(datos) as (keyof T)[]) {
      if (previo[clave] !== datos[clave]) return { ...previo, ...datos };
    }
    return previo;
  };
}
