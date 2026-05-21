import Image from 'next/image';
import { MapPin } from '@/lib/icons';

interface DeveloperLogosProps {
  developers: Array<{
    name: string;
    logo_url: string | null;
    slug: string;
    city: string | null;
    state: string | null;
  }>;
}

function formatLocation(city: string | null, state: string | null): string | null {
  if (city && state) return `${city}, ${state}`;
  return city ?? state ?? null;
}

export default function DeveloperLogos({ developers }: DeveloperLogosProps) {
  if (developers.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10">
          Nuestros socios desarrolladores
        </h2>
        <div className="flex flex-wrap items-stretch justify-center gap-6 md:gap-8">
          {developers.map((dev) => (
            <div
              key={dev.slug}
              className="flex flex-col items-center justify-between gap-4 p-6 md:p-8 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow duration-300 min-w-[200px] md:min-w-[220px]"
            >
              {dev.logo_url ? (
                <Image
                  src={dev.logo_url}
                  alt={dev.name}
                  width={200}
                  height={96}
                  unoptimized
                  className="h-20 md:h-24 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <div className="h-20 md:h-24 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">{dev.name}</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm md:text-base font-semibold text-[#1A2F3F] text-center leading-tight">
                  {dev.name}
                </span>
                {formatLocation(dev.city, dev.state) && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <MapPin size={12} strokeWidth={1.75} className="text-[#0E7490]" />
                    {formatLocation(dev.city, dev.state)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
