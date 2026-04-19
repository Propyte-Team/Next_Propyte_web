import {
  Waves, Dumbbell, Shield, Car, TreePine, Users, Wifi, Coffee,
  ChefHat, Flower2, Wind, Sun, Building, Bike, Heart, Gamepad2,
  ParkingCircle, UtensilsCrossed, Flame, PawPrint, type LucideIcon,
} from 'lucide-react';

interface AmenityListProps {
  locale: string;
  amenities?: string[];
}

interface AmenityDef {
  key: string;
  es: string;
  en: string;
  icon: LucideIcon;
}

/**
 * 20 canonical amenities. When the unit brings its own list in `amenities`,
 * those are rendered; otherwise the full 20-item default is shown as a
 * "typical amenities at this development" hint.
 */
const AMENITIES: AmenityDef[] = [
  { key: 'alberca', es: 'Alberca', en: 'Pool', icon: Waves },
  { key: 'gym', es: 'Gimnasio', en: 'Gym', icon: Dumbbell },
  { key: 'seguridad', es: 'Seguridad 24/7', en: '24/7 Security', icon: Shield },
  { key: 'estacionamiento', es: 'Estacionamiento', en: 'Parking', icon: Car },
  { key: 'jardin', es: 'Jardín / Áreas verdes', en: 'Gardens', icon: TreePine },
  { key: 'salon_eventos', es: 'Salón de eventos', en: 'Event Room', icon: Users },
  { key: 'wifi', es: 'WiFi común', en: 'Common WiFi', icon: Wifi },
  { key: 'lounge', es: 'Lounge / Coworking', en: 'Lounge / Coworking', icon: Coffee },
  { key: 'cocina_equipada', es: 'Cocina equipada', en: 'Equipped Kitchen', icon: ChefHat },
  { key: 'spa', es: 'Spa', en: 'Spa', icon: Flower2 },
  { key: 'aire_acondicionado', es: 'Aire acondicionado', en: 'Air Conditioning', icon: Wind },
  { key: 'terraza', es: 'Terraza / Roof garden', en: 'Terrace / Roof Garden', icon: Sun },
  { key: 'elevador', es: 'Elevador', en: 'Elevator', icon: Building },
  { key: 'ciclopista', es: 'Ciclopista', en: 'Bike Lane', icon: Bike },
  { key: 'kids_area', es: 'Área infantil', en: "Kids' Area", icon: Heart },
  { key: 'game_room', es: 'Sala de juegos', en: 'Game Room', icon: Gamepad2 },
  { key: 'valet', es: 'Valet parking', en: 'Valet Parking', icon: ParkingCircle },
  { key: 'restaurante', es: 'Restaurante / Club', en: 'Restaurant / Club', icon: UtensilsCrossed },
  { key: 'asador', es: 'Asadores', en: 'BBQ Grills', icon: Flame },
  { key: 'pet_friendly', es: 'Pet friendly', en: 'Pet Friendly', icon: PawPrint },
];

export default function AmenityList({ locale, amenities }: AmenityListProps) {
  const isEn = locale === 'en';

  const activeAmenities = amenities && amenities.length > 0
    ? AMENITIES.filter((a) =>
        amenities.some((x) =>
          x.toLowerCase().includes(a.key.replace('_', ' ')) ||
          x.toLowerCase() === (isEn ? a.en.toLowerCase() : a.es.toLowerCase())
        )
      )
    : AMENITIES;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#2C2C2C] mb-4">
        {isEn ? 'Amenities' : 'Amenidades'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {activeAmenities.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.key}
              className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100"
            >
              <Icon size={18} className="text-[#5CE0D2] shrink-0" />
              <span className="text-sm text-gray-700 font-medium truncate">
                {isEn ? a.en : a.es}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
