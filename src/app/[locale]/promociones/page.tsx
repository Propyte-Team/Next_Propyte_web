import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDevelopments } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { MapPin, Building2, Tag, ArrowRight } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Special Offers & Promotions | Propyte' : 'Promociones y Ofertas Especiales | Propyte',
    description: isEn
      ? 'Discover real estate projects with special offers, discounts, and exclusive promotions in Mexico\'s Riviera Maya.'
      : 'Descubre proyectos inmobiliarios con ofertas especiales, descuentos y promociones exclusivas en la Riviera Maya.',
    alternates: {
      canonical: `/${locale}/promociones`,
      languages: { es: '/es/promociones', en: '/en/promociones', 'x-default': '/es/promociones' },
    },
  };
}

export default async function PromocionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';

  let developments: any[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await getDevelopments(supabase, { featured: true });
    if (data) developments = data;
  } catch {
    // Supabase not available
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5A623]/20 text-[#F5A623] rounded-full text-sm font-bold mb-6">
            <Tag size={16} />
            {isEn ? 'Limited Time Offers' : 'Ofertas por Tiempo Limitado'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Promotions & Special Offers' : 'Promociones y Ofertas Especiales'}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {isEn
              ? 'Featured developments with exclusive discounts, incentives, and special financing plans.'
              : 'Desarrollos destacados con descuentos exclusivos, incentivos y planes de financiamiento especiales.'}
          </p>
        </div>
      </section>

      {/* Featured Developments */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {developments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developments.map((dev: any) => (
                <Link
                  key={dev.id}
                  href={`/${locale}/desarrollos/${dev.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    {dev.images?.[0] ? (
                      <img src={dev.images[0]} alt={dev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Building2 size={36} className="text-gray-300" />
                      </div>
                    )}
                    {/* Promo banner */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#F5A623] to-[#FF8C00] px-4 py-2 text-white text-xs font-bold uppercase tracking-wider text-center">
                      {isEn ? 'Featured Promotion' : 'Promoción Destacada'}
                    </div>
                    {dev.stage && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded bg-[#1A2F3F]/80">
                          {dev.stage}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#5CE0D2] transition-colors mb-1 line-clamp-1">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin size={14} />
                      <span>{dev.zone}, {dev.city}</span>
                    </div>
                    {(dev.price_min_mxn > 0 || dev.price_mxn > 0) && (
                      <div className="font-bold text-lg text-gray-900">
                        {isEn ? 'From ' : 'Desde '}{formatPrice(dev.price_min_mxn || dev.price_mxn)}
                      </div>
                    )}
                    {dev.roi_projected > 0 && (
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/8 text-[#4BCEC0] text-xs font-bold rounded-full">
                        ROI {dev.roi_projected}%
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {isEn ? 'No active promotions right now' : 'No hay promociones activas en este momento'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isEn
                  ? 'Check back soon or browse all available developments.'
                  : 'Vuelve pronto o explora todos los desarrollos disponibles.'}
              </p>
              <Link
                href={`/${locale}/propiedades`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
              >
                {isEn ? 'View All Properties' : 'Ver Todas las Propiedades'}
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
