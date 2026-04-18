import { useLocale } from 'next-intl';
import { Waves, Plane, ShoppingCart, Cross, GraduationCap, UtensilsCrossed } from 'lucide-react';

interface ProximityItem {
  icon: typeof Waves;
  label: string;
  distance: string;
}

function getProximityData(city: string, zone: string, locale: string): ProximityItem[] {
  const isPlaya = city === 'Playa del Carmen';
  const isTulum = city === 'Tulum';

  const beach: ProximityItem = {
    icon: Waves,
    label: locale === 'es' ? 'Playa' : 'Beach',
    distance: zone === '5ta Avenida' || zone === 'Centro' ? '5-10 min' :
              zone === 'Playacar' ? '3 min' :
              zone === 'Zamá' ? '8 min' : '10-15 min',
  };

  const airport: ProximityItem = {
    icon: Plane,
    label: locale === 'es' ? 'Aeropuerto CUN' : 'CUN Airport',
    distance: isPlaya ? '45 min' : isTulum ? '1h 30min' : '1h',
  };

  const shopping: ProximityItem = {
    icon: ShoppingCart,
    label: locale === 'es' ? 'Supermercado' : 'Grocery',
    distance: zone === 'Centro' || zone === '5ta Avenida' ? '3 min' : '5-10 min',
  };

  const hospital: ProximityItem = {
    icon: Cross,
    label: locale === 'es' ? 'Hospital' : 'Hospital',
    distance: isPlaya ? '10 min' : '15 min',
  };

  const schools: ProximityItem = {
    icon: GraduationCap,
    label: locale === 'es' ? 'Escuelas' : 'Schools',
    distance: '5-15 min',
  };

  const dining: ProximityItem = {
    icon: UtensilsCrossed,
    label: locale === 'es' ? 'Restaurantes' : 'Restaurants',
    distance: zone === 'Centro' || zone === '5ta Avenida' ? '2 min' :
              zone === 'Playacar' ? '5 min' : '5-10 min',
  };

  return [beach, airport, shopping, hospital, schools, dining];
}

interface ProximityProps {
  city: string;
  zone: string;
}

export default function Proximity({ city, zone }: ProximityProps) {
  const locale = useLocale();
  const items = getProximityData(city, zone, locale);

  return (
    <div>
      <h2 className="text-lg font-bold text-[#2C2C2C] mb-3">
        {locale === 'es' ? 'Cercanía' : 'Nearby'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 bg-[#5CE0D2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon size={18} className="text-[#5CE0D2]" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-sm font-bold text-[#2C2C2C]">{item.distance}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
