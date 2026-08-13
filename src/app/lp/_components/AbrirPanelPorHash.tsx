'use client';

import { useEffect } from 'react';

// ============================================================
// Abre el panel del acordeón al que apunta el hash.
//
// POR QUÉ HACE FALTA JS AQUÍ, Y SOLO AQUÍ. El contenido de los cinco paneles
// está en el HTML servido: son `<details>` nativos, así que sin JS el visitante
// —y el crawler— los tiene todos, y se abren a mano. Lo que CSS no puede hacer
// es abrir un `<details>` cerrado porque el hash apunte a él: no existe
// selector para eso, y `:target` no cambia el atributo `open`.
//
// Sin esto, media docena de enlaces internos —el pie legal citando el artículo
// 69, los gates de la banda de cifras, la barra de credibilidad— llevarían al
// visitante a un panel cerrado. El enlace parecería roto justo en el bloque
// cuyo propósito es demostrar que no escondemos nada.
//
// Escucha `hashchange` además del montaje porque los enlaces de la propia
// página no recargan: sin él, solo funcionaría la primera navegación.
// ============================================================

export default function AbrirPanelPorHash() {
  useEffect(() => {
    const abrir = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;

      // `getElementById` y no un selector: el hash puede traer caracteres que
      // romperían un querySelector sin escapar.
      const destino = document.getElementById(id);
      if (!destino) return;

      const panel = destino.closest('details');
      if (!panel || panel.open) return;

      panel.open = true;
      // El scroll DESPUÉS de abrir: al abrirse, el panel empuja el contenido y
      // la posición que el navegador ya había calculado deja de ser válida.
      // `requestAnimationFrame` espera al reflow.
      requestAnimationFrame(() =>
        destino.scrollIntoView({ block: 'start', behavior: 'auto' }),
      );
    };

    abrir();
    window.addEventListener('hashchange', abrir);
    return () => window.removeEventListener('hashchange', abrir);
  }, []);

  return null;
}
