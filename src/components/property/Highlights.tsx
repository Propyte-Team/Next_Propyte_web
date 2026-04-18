import { useTranslations, useLocale } from 'next-intl';
import {
  Waves, PawPrint, Building2, TrendingUp, Sun, Shield,
  Dumbbell, Car, Trees, Coffee, Lock, Palmtree
} from 'lucide-react';
import type { Property } from '@/types/property';

const HIGHLIGHT_ICONS: Record<string, typeof Waves> = {
  'Alberca': Waves,
  'Alberca privada': Waves,
  'Alberca infinity': Waves,
  'Pet-friendly': PawPrint,
  'Rooftop': Sun,
  'Rooftop Bar': Sun,
  'Gym': Dumbbell,
  'Seguridad 24/7': Shield,
  'Coworking': Coffee,
  'Estacionamiento': Car,
  'Jardín': Trees,
  'Jardín tropical': Palmtree,
  'Club de playa': Palmtree,
  'Concierge': Building2,
  'Terraza': Sun,
  'Lock-off': Lock,
};

function getHighlightTags(property: Property, locale: string): { label: string; icon: typeof Waves }[] {
  const tags: { label: string; icon: typeof Waves }[] = [];

  // Stage-based highlights
  if (property.stage === 'preventa') {
    tags.push({ label: locale === 'es' ? 'Precio de preventa' : 'Presale price', icon: TrendingUp });
  }
  if (property.financing.interestRate === 0) {
    tags.push({ label: locale === 'es' ? '0% interés' : '0% interest', icon: TrendingUp });
  }
  if (property.roi.projected >= 10) {
    tags.push({ label: `ROI ${property.roi.projected}%+`, icon: TrendingUp });
  }

  // Amenity-based highlights (pick top 4)
  for (const amenity of property.amenities.slice(0, 6)) {
    const icon = HIGHLIGHT_ICONS[amenity] as typeof Waves | undefined;
    if (icon != null && tags.length < 8) {
      tags.push({ label: amenity, icon });
    }
  }

  return tags;
}

interface HighlightsProps {
  property: Property;
}

export default function Highlights({ property }: HighlightsProps) {
  const locale = useLocale();
  const tags = getHighlightTags(property, locale);

  if (tags.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-[#2C2C2C] mb-3">
        {locale === 'es' ? 'Lo destacado' : "What's special"}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F6F8] border border-gray-100 rounded-full text-sm text-[#2C2C2C] font-medium"
          >
            <tag.icon size={14} className="text-[#5CE0D2]" />
            {tag.label}
          </div>
        ))}
      </div>
    </div>
  );
}
