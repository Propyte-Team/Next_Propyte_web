import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Globe, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDeveloperBySlug,
  getDeveloperDevelopments,
  type DeveloperDevelopment,
} from '@/lib/supabase/queries';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface Props {
  locale: string;
  slug: string;
}

function formatPrice(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function DevCard({ dev, locale }: { dev: DeveloperDevelopment; locale: string }) {
  const img = dev.images?.[0];
  const priceFrom = dev.min_price_mxn || dev.price_mxn;
  const stageMap: Record<string, string> = {
    preventa: 'Preventa', construccion: 'En construcción', entrega_inmediata: 'Entrega inmediata',
  };
  const stageLabel = dev.stage ? (stageMap[dev.stage] || dev.stage) : null;

  return (
    <Link
      href={`/${locale}/desarrollos/${dev.slug}`}
      className="group block propyte-card-glass-light propyte-card-hover-glow overflow-hidden"
    >
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={dev.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={40} className="text-gray-300" />
          </div>
        )}
        {stageLabel && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-propyte-brand text-[#1A2332] text-2xs font-bold rounded-full uppercase tracking-wider">
            {stageLabel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#0F766E] transition-colors">
          {dev.name}
        </h3>
        {(dev.city || dev.zone) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={11} />
            <span>{[dev.zone, dev.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {priceFrom && (
          <div className="mt-2 text-sm font-semibold text-[#0F766E]">
            Desde {formatPrice(priceFrom)} MXN
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function DeveloperProfilePage({ locale, slug }: Props) {
  const supabase = createPublicSupabaseClient();
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  if (!supabase) notFound();

  const developer = await getDeveloperBySlug(supabase, slug);
  if (!developer) notFound();

  const developments = await getDeveloperDevelopments(supabase, developer.id);

  const description = locale === 'en'
    ? developer.descriptionEn || developer.descriptionEs || ''
    : developer.descriptionEs || developer.descriptionEn || '';

  const initials = developer.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const stats: Array<{ label: string; value: string | number }> = [];
  if (developer.yearsExperience && developer.yearsExperience > 0)
    stats.push({ label: locale === 'es' ? 'Años de experiencia' : 'Years of experience', value: developer.yearsExperience });
  if (developments.length > 0)
    stats.push({ label: locale === 'es' ? 'Proyectos activos' : 'Active projects', value: developments.length });
  if (developer.projectsDelivered && developer.projectsDelivered > 0)
    stats.push({ label: locale === 'es' ? 'Proyectos entregados' : 'Projects delivered', value: developer.projectsDelivered });
  if (developer.unitsDelivered && developer.unitsDelivered > 0)
    stats.push({ label: locale === 'es' ? 'Unidades entregadas' : 'Units delivered', value: developer.unitsDelivered.toLocaleString() });

  return (
    <>
      <SchemaMarkup
        type="professionalService"
        data={{
          name: developer.name,
          description: description || undefined,
          url: developer.website || undefined,
          image: developer.logoUrl || undefined,
          areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: 20.63, longitude: -87.08 }, geoRadius: '300' },
        }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: locale === 'es' ? 'Desarrolladores' : 'Developers', href: `/${locale}/desarrolladores` },
          { label: developer.name },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Back link */}
        <Link
          href={`/${locale}/desarrolladores`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={15} />
          {locale === 'es' ? 'Todos los desarrolladores' : 'All developers'}
        </Link>

        {/* Hero card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
              {developer.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={developer.logoUrl} alt={developer.name} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-2xl font-extrabold text-[#0F766E] tracking-tight">{initials}</span>
              )}
            </div>

            {/* Name + badges + website */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2332] leading-tight">{developer.name}</h1>
                {developer.verified && (
                  <span className="px-2.5 py-0.5 text-2xs font-bold text-[#0F766E] bg-propyte-cyan-100 rounded-full uppercase tracking-wider">
                    {locale === 'es' ? 'Verificado' : 'Verified'}
                  </span>
                )}
              </div>
              {developer.website && (
                <a
                  href={developer.website.startsWith('http') ? developer.website : `https://${developer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#0F766E] hover:underline"
                >
                  <Globe size={13} />
                  {developer.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {/* Stats row */}
          {stats.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-extrabold text-[#1A2332]">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Developments */}
        {developments.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1A2332] mb-5">
              {locale === 'es' ? 'Sus proyectos en Propyte' : 'Their projects on Propyte'}
              <span className="ml-2 text-base font-normal text-gray-400">({developments.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {developments.map((dev) => (
                <DevCard key={dev.id} dev={dev} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {developments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {locale === 'es' ? 'Sin proyectos publicados aún' : 'No published projects yet'}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#1A2332] rounded-3xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">
            {locale === 'es' ? `¿Interesado en proyectos de ${developer.name}?` : `Interested in ${developer.name} projects?`}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {locale === 'es'
              ? 'Habla con un asesor Propyte para recibir información detallada y condiciones de inversión.'
              : 'Talk to a Propyte advisor for detailed information and investment terms.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/contacto?desarrollador=${encodeURIComponent(developer.name)}`}
              className="px-6 py-3 bg-propyte-brand text-[#1A2332] font-bold rounded-xl text-sm hover:bg-propyte-cyan-200 transition-colors"
            >
              {locale === 'es' ? 'Contactar asesor' : 'Contact advisor'}
            </Link>
            <Link
              href={`/${locale}/desarrollos?search=${encodeURIComponent(developer.name)}`}
              className="inline-flex items-center gap-1 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/20 transition-colors"
            >
              {locale === 'es' ? 'Ver todos los proyectos' : 'View all projects'}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
