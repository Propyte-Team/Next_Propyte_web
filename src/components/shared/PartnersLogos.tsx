import Image from 'next/image';
import type { PartnerRow } from '@/lib/supabase/queries';

interface PartnersLogosProps {
  partners: PartnerRow[];
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Trust bar de logos de aliados (server component).
 *
 * Hide-when-empty: si `partners.length === 0`, retorna `null` y la sección
 * desaparece. Source of truth: hub.propyte.com/aliados (tabla
 * real_estate_hub.partners + view v_partners filtra active=TRUE +
 * logo_url IS NOT NULL).
 *
 * Cada logo se envuelve en `<a target="_blank">` cuando hay website_url.
 * Sin link → `<div>` con misma alineación.
 */
export default function PartnersLogos({
  partners,
  title,
  subtitle,
  className,
}: PartnersLogosProps) {
  if (!partners || partners.length === 0) return null;

  return (
    <section className={`py-12 md:py-16 bg-[#F4F6F8] ${className ?? ''}`}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <ul
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 md:gap-x-12 md:gap-y-8"
          aria-label="Aliados estratégicos"
        >
          {partners.map((p) => {
            const logoBlock = p.logo_url ? (
              <Image
                src={p.logo_url}
                alt={p.name}
                width={140}
                height={56}
                className="h-10 md:h-12 w-auto object-contain grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                unoptimized
              />
            ) : null;

            if (!logoBlock) return null;

            return (
              <li key={p.id} className="flex-shrink-0">
                {p.website_url ? (
                  <a
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    title={p.name}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] rounded"
                  >
                    {logoBlock}
                  </a>
                ) : (
                  <div title={p.name}>{logoBlock}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
