import Image from 'next/image';
import Link from 'next/link';

interface DeveloperLogosProps {
  developers: Array<{
    name: string;
    logo_url: string | null;
    slug: string;
  }>;
}

export default function DeveloperLogos({ developers }: DeveloperLogosProps) {
  if (developers.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-gray-400 mb-8">
          Nuestros Socios Desarrolladores
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {developers.map((dev) => (
            <div
              key={dev.slug}
              className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
              title={dev.name}
            >
              {dev.logo_url ? (
                <img
                  src={dev.logo_url}
                  alt={dev.name}
                  className="h-10 md:h-12 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-gray-400">{dev.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
