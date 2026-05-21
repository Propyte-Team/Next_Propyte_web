import type { Property } from '@/types/property';

interface RichContentSectionsProps {
  richContent: NonNullable<Property['richContent']>;
  locale: string;
  labels?: {
    features?: string;
    location?: string;
    lifestyle?: string;
  };
}

/**
 * Renderiza features/location/lifestyle bodies del JSON ext_content_{es,en}.
 * Cada sección sólo aparece si tiene contenido. Paragraphs separados por \n\n.
 */
export default function RichContentSections({ richContent, locale, labels }: RichContentSectionsProps) {
  const isEn = locale === 'en';
  const pick = (field: { es?: string; en?: string } | undefined) =>
    field ? (isEn ? field.en || field.es : field.es || field.en) : undefined;

  const features = pick(richContent.features);
  const location = pick(richContent.location);
  const lifestyle = pick(richContent.lifestyle);

  if (!features && !location && !lifestyle) return null;

  const featuresLabel = labels?.features ?? (isEn ? 'Features & Design' : 'Características y Diseño');
  const locationLabel = labels?.location ?? (isEn ? 'Location & Surroundings' : 'Ubicación y Entorno');
  const lifestyleLabel = labels?.lifestyle ?? (isEn ? 'Lifestyle' : 'Estilo de Vida');

  return (
    <div className="space-y-6">
      {features && <RichSection title={featuresLabel} body={features} />}
      {location && <RichSection title={locationLabel} body={location} />}
      {lifestyle && <RichSection title={lifestyleLabel} body={lifestyle} />}
    </div>
  );
}

function RichSection({ title, body }: { title: string; body: string }) {
  const paragraphs = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <div>
      <h3 className="text-lg font-bold text-[#2C2C2C] mb-3">{title}</h3>
      <div className="space-y-3 text-gray-600 leading-relaxed text-sm md:text-base">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
