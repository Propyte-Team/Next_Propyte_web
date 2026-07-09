'use client';

import dynamic from 'next/dynamic';

// financiamiento/page.tsx es un Server Component — `ssr: false` no está
// permitido ahí, por eso el boundary vive en este wrapper 'use client'.
// MortgageCalculator monta recharts (~340KB) solo para el PieChart interno;
// se carga en el cliente tras la hidratación. El placeholder reserva
// aproximadamente la altura completa de la sección real (header + grid de
// inputs/chart, que se apila en mobile y va lado a lado desde lg) para
// evitar CLS cuando el chunk termine de cargar.
const MortgageCalculator = dynamic(() => import('./MortgageCalculator'), {
  ssr: false,
  loading: () => (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="min-h-[1050px] lg:min-h-[680px] rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </section>
  ),
});

export default MortgageCalculator;
