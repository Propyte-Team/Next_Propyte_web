'use client';

import { useState } from 'react';
import FormCasas, { type OpcionCasa } from './FormCasas';

// ============================================================
// Envoltorio de estado para el formulario del hero.
//
// `FormCasas` es un componente CONTROLADO: la casa elegida entra por props
// porque en el cierre la manda la cuadrícula (pulsar «Me interesa» en una
// tarjeta la deja seleccionada abajo). El del hero no tiene cuadrícula encima
// —está en el primer pliegue, antes de que exista nada que elegir—, así que
// necesita quien le sostenga ese estado.
//
// Deliberadamente NO comparte estado con el del cierre. Son dos visitantes
// distintos: el del hero convierte sin explorar y no ha elegido casa; el del
// cierre llega después de comparar once. Un estado compartido haría que elegir
// una casa abajo reescribiera un formulario que ya no está en pantalla.
// ============================================================

export default function FormAutonomo({
  casas,
  telefonoWhatsApp,
}: {
  casas: OpcionCasa[];
  telefonoWhatsApp: string;
}) {
  const [casaSeleccionada, setCasaSeleccionada] = useState<string | null>(null);

  return (
    <FormCasas
      variante="hero"
      casas={casas}
      casaSeleccionada={casaSeleccionada}
      onCasaChange={setCasaSeleccionada}
      telefonoWhatsApp={telefonoWhatsApp}
    />
  );
}
