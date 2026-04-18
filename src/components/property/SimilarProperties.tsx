import { useTranslations } from 'next-intl';
import PropertyCard from '@/components/ui/PropertyCard';
import type { Property } from '@/types/property';

interface SimilarPropertiesProps {
  properties: Property[];
}

export default function SimilarProperties({ properties }: SimilarPropertiesProps) {
  const t = useTranslations('property');

  if (properties.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-[#2C2C2C] mb-6">{t('similar')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {properties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
