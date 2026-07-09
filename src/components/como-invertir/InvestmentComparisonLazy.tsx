'use client';

import dynamic from 'next/dynamic';

// como-invertir/page.tsx es un Server Component — `ssr: false` no está
// permitido ahí, por eso el boundary vive en este wrapper 'use client'.
// InvestmentComparison monta recharts (~340KB) solo para el BarChart interno;
// se carga en el cliente tras la hidratación. El placeholder reserva
// aproximadamente la altura completa de la sección real (header + grid de
// inputs/chart, que se apila en mobile y va lado a lado desde lg) para
// evitar CLS cuando el chunk termine de cargar.
const InvestmentComparison = dynamic(() => import('./InvestmentComparison'), {
  ssr: false,
  loading: () => (
    <section className="py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="min-h-[1100px] lg:min-h-[820px] rounded-2xl bg-white/5 animate-pulse" />
      </div>
    </section>
  ),
});

export default InvestmentComparison;
