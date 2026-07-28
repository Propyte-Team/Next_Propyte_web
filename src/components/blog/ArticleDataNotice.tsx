import Link from 'next/link';
import { BarChart3, ScrollText } from '@/lib/icons';

interface ArticleDataNoticeProps {
  locale: string;
  /** El artículo publica porcentajes o montos → enlace a /metodologia. */
  showMethodology: boolean;
  /** Publica proyecciones, tasas o rendimientos → aviso legal de inversión. */
  showDisclaimer: boolean;
  t: {
    methodologyText: string;
    methodologyCta: string;
    disclaimerText: string;
    disclaimerCta: string;
  };
}

/**
 * Bloque reutilizable al pie del artículo: enlace contextual a /metodologia
 * (activo E-E-A-T que hoy solo se alcanza desde el pie del sitio) y al aviso
 * legal de inversión.
 *
 * Se renderiza según el contenido (ver `article-signals.ts`), no por artículo a
 * mano: un artículo nuevo con cifras queda cubierto el día que se publica.
 */
export default function ArticleDataNotice({
  locale,
  showMethodology,
  showDisclaimer,
  t,
}: ArticleDataNoticeProps) {
  if (!showMethodology && !showDisclaimer) return null;

  return (
    <aside className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
      {showMethodology && (
        <div className="flex gap-3">
          <BarChart3 size={18} className="mt-0.5 flex-none text-[#0E7490]" />
          <p className="text-sm leading-relaxed text-slate-600">
            {t.methodologyText}{' '}
            <Link
              href={`/${locale}/metodologia`}
              className="font-semibold text-[#0E7490] hover:underline"
            >
              {t.methodologyCta}
            </Link>
          </p>
        </div>
      )}

      {showDisclaimer && (
        <div className="flex gap-3">
          <ScrollText size={18} className="mt-0.5 flex-none text-slate-500" />
          <p className="text-sm leading-relaxed text-slate-600">
            {t.disclaimerText}{' '}
            <Link
              href={`/${locale}/aviso-legal-inversion`}
              className="font-semibold text-[#0E7490] hover:underline"
            >
              {t.disclaimerCta}
            </Link>
          </p>
        </div>
      )}
    </aside>
  );
}
