import { useTranslations } from 'next-intl';
import { Bed, Bath, Maximize, Home, Calendar, CheckCircle } from 'lucide-react';
import type { Property } from '@/types/property';

interface PropertySpecsProps {
  property: Property;
}

export default function PropertySpecs({ property }: PropertySpecsProps) {
  const t = useTranslations('property');
  const tTypes = useTranslations('types');
  const tStages = useTranslations('stages');

  const specs = [
    property.specs.bedrooms > 0 && { icon: Bed, label: t('bedrooms'), value: property.specs.bedrooms },
    property.specs.bathrooms > 0 && { icon: Bath, label: t('bathrooms'), value: property.specs.bathrooms },
    { icon: Maximize, label: t('area'), value: `${property.specs.area.toLocaleString('es-MX')} m²` },
    { icon: Home, label: t('type'), value: tTypes(property.specs.type) },
    { icon: Calendar, label: t('stage'), value: tStages(property.stage) },
  ].filter(Boolean) as { icon: typeof Bed; label: string; value: string | number }[];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#2C2C2C] mb-4">{t('specs')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {specs.map((spec, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-[#F4F6F8] rounded-lg">
            <spec.icon size={20} className="text-[#1A2F3F] shrink-0" />
            <div>
              <div className="text-xs text-gray-500">{spec.label}</div>
              <div className="font-medium text-[#2C2C2C]">{spec.value}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-[#2C2C2C] mb-3">{t('amenities')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {property.amenities.map((amenity, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle size={16} className="text-[#22C55E] shrink-0" />
            {amenity}
          </div>
        ))}
      </div>
    </div>
  );
}
