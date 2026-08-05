import { LayoutGrid } from '@/lib/icons';

interface BlogHeroProps {
  t: {
    heroHeadLine1: string;
    heroHeadLine2: string;
    heroDescription: string;
  };
}

/**
 * Hero del listado de blog.
 *
 * Los dos CTA de "Para Asesores" / "Para Inversionistas" se quitaron el
 * 2026-08-05: eran el filtro de audiencia disfrazado de botón —enlazaban a
 * `?categoria=`— y desde que existe la barra de filtros hacían exactamente lo
 * mismo dos veces, con el agravante de que uno de los dos desaparecía cuando su
 * categoría se quedaba sin piezas publicadas.
 *
 * Al quedarse sin ellos el componente dejó de necesitar estado de cliente, así
 * que volvió a ser server component: un hero estático no tiene por qué viajar en
 * el bundle.
 */
export default function BlogHero({ t }: BlogHeroProps) {
  return (
    <section className="bg-[#0F1923] w-full py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A2F9FF]/10 border border-[#A2F9FF]/30 text-[#A2F9FF] text-xs font-semibold tracking-widest uppercase mb-8">
          <LayoutGrid size={12} />
          Propyte Blog
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          <span className="text-white block">{t.heroHeadLine1}</span>
          <span className="text-[#A2F9FF] block">{t.heroHeadLine2}</span>
        </h1>

        <p className="text-white/70 text-lg max-w-xl mx-auto">
          {t.heroDescription}
        </p>
      </div>
    </section>
  );
}
