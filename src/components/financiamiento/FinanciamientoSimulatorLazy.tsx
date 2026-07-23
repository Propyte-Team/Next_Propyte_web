'use client';

import dynamic from 'next/dynamic';

// financiamiento/page.tsx es un Server Component — `ssr: false` no está
// permitido ahí, por eso el boundary vive en este wrapper 'use client'.
// El simulador monta recharts (~340KB) vía CorridaCompacta; se carga en el
// cliente tras la hidratación. El placeholder reserva la altura aproximada
// de la sección (header + grid inputs/output + corrida) para evitar CLS.
const FinanciamientoSimulator = dynamic(() => import('./FinanciamientoSimulator'), {
  ssr: false,
  loading: () => (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="min-h-[1500px] lg:min-h-[1150px] rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </section>
  ),
});

export default FinanciamientoSimulator;
