import Image from 'next/image';
import type { CaseStudyRow } from '@/lib/supabase/queries';

interface CaseStudiesProps {
  studies: CaseStudyRow[];
  locale: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Grid de casos de éxito (server component).
 *
 * Hide-when-empty: si `studies.length === 0`, retorna `null`.
 * Source of truth: hub.propyte.com/casos. Cada caso muestra imagen
 * hero + cliente + título + resumen + 3 KPIs (label + value).
 */
export default function CaseStudies({
  studies,
  locale,
  title,
  subtitle,
  className,
}: CaseStudiesProps) {
  if (!studies || studies.length === 0) return null;

  const isEs = locale === 'es';

  return (
    <section className={`py-16 md:py-20 ${className ?? ''}`}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-10 md:mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {studies.map((s) => {
            const titleStr = isEs ? s.title_es : (s.title_en ?? s.title_es);
            const summaryStr = isEs ? s.summary_es : (s.summary_en ?? s.summary_es);

            const metrics = [1, 2, 3]
              .map((n) => {
                const label = isEs
                  ? (s[`metric${n}_label_es` as 'metric1_label_es'] ?? null)
                  : (s[`metric${n}_label_en` as 'metric1_label_en']
                      ?? s[`metric${n}_label_es` as 'metric1_label_es']
                      ?? null);
                const value = s[`metric${n}_value` as 'metric1_value'];
                return label && value ? { label, value } : null;
              })
              .filter((m): m is { label: string; value: string } => m !== null);

            return (
              <article
                key={s.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                {s.image_url && (
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <Image
                      src={s.image_url}
                      alt={s.client_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs font-semibold text-[#0F766E] uppercase tracking-wide mb-1">
                    {s.client_name}
                  </p>
                  <h3 className="text-lg font-bold text-[#1A2F3F] mb-2 leading-snug">
                    {titleStr}
                  </h3>
                  {summaryStr && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {summaryStr}
                    </p>
                  )}
                  {metrics.length > 0 && (
                    <dl className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                      {metrics.map((m, i) => (
                        <div key={i} className="text-center">
                          <dt className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide leading-tight">
                            {m.label}
                          </dt>
                          <dd className="text-lg font-bold text-[#0F766E] tabular-nums mt-1">
                            {m.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
