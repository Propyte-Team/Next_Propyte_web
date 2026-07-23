import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';

export interface EjemploCard {
  slug: string;
  name: string;
  image: string;
  city: string;
  bedrooms: number;
  areaM2: number;
  priceMxn: number;
  enganchePct: number;
  engancheMxn: number;
  mensualidadMxn: number;
}

/** Fail-closed: sin ejemplos válidos la sección no se renderiza. */
export default async function EjemplosPropiedades({ locale, ejemplos }: { locale: string; ejemplos: EjemploCard[] }) {
  if (ejemplos.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'financiamiento' });
  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2 text-center">{t('examplesTitle')}</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">{t('examplesSubtitle')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ejemplos.map((e) => (
            <article key={e.slug} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/${locale}/propiedades/${e.slug}`} className="flex flex-col h-full">
                <div className="relative aspect-[4/3]">
                  <Image src={e.image} alt={e.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-base font-bold text-[#1A2F3F] leading-snug">{e.name}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {[
                        e.city || null,
                        e.bedrooms > 0 ? t('examplesBedrooms', { n: e.bedrooms }) : null,
                        e.areaM2 > 0 ? `${Math.round(e.areaM2)} m²` : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="text-xl font-bold text-[#1A2F3F] tabular-nums">{formatPrice(e.priceMxn)}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                    <div>
                      <div className="text-2xs text-gray-600 uppercase">{t('examplesDownPayment', { pct: e.enganchePct })}</div>
                      <div className="font-bold text-gray-900 tabular-nums">{formatPrice(e.engancheMxn)}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-gray-600 uppercase">{t('examplesMonthly')}</div>
                      <div className="font-bold text-[#0E7490] tabular-nums">{formatPrice(e.mensualidadMxn)}</div>
                    </div>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 text-sm font-semibold text-[#0E7490] group-hover:underline">
                    {t('examplesCta')} <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <p className="text-xs text-gray-600 text-center mt-6">{t('examplesNote')}</p>
      </div>
    </section>
  );
}
