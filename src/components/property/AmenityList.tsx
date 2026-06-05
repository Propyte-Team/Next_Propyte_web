import {
  Waves, Dumbbell, Shield, Car, Users, Wifi, Coffee,
  ChefHat, Wind, Sun, Building, Bike, Heart, Gamepad2,
  ParkingCircle, UtensilsCrossed, Flame, PawPrint, CheckCircle2,
  Spa, Plant,
  type LucideIcon,
} from '@/lib/icons';
import { getTranslations } from 'next-intl/server';

interface AmenityListProps {
  locale: string;
  amenities?: string[];
  title?: string;
}

interface AmenityDef {
  key: string;
  es: string;
  en: string;
  icon: LucideIcon;
  match: RegExp;
}

const AMENITIES: AmenityDef[] = [
  // Alberca PRIVADA (de la unidad) — debe ir ANTES de la genérica porque el
  // match es "primer canónico que coincide" (.find en orden). Sin esto,
  // "Alberca Privada" caía en la genérica y se mostraba igual que la comunal.
  { key: 'alberca_privada', es: 'Alberca privada', en: 'Private pool', icon: Waves, match: /alberca\s*privada|piscina\s*privada|private\s*pool/i },
  // Genérica/comunal: "Alberca Comunitaria" y cualquier otra → "Alberca" / "Pool".
  { key: 'alberca', es: 'Alberca', en: 'Pool', icon: Waves, match: /alberca|pool|piscina/i },
  { key: 'gym', es: 'Gimnasio', en: 'Gym', icon: Dumbbell, match: /gym|gimnasio|fitness/i },
  { key: 'seguridad', es: 'Seguridad 24/7', en: '24/7 Security', icon: Shield, match: /seguridad|security|vigilancia/i },
  { key: 'estacionamiento', es: 'Estacionamiento', en: 'Parking', icon: Car, match: /estacionamiento|parking|garage/i },
  { key: 'jardin', es: 'Jardín / Áreas verdes', en: 'Gardens', icon: Plant, match: /jardin|jardín|garden|green|areas verdes/i },
  { key: 'salon_eventos', es: 'Salón de eventos', en: 'Event Room', icon: Users, match: /salon|salón|event|social/i },
  { key: 'wifi', es: 'WiFi común', en: 'Common WiFi', icon: Wifi, match: /wifi|wi-fi|internet/i },
  { key: 'lounge', es: 'Lounge / Coworking', en: 'Lounge / Coworking', icon: Coffee, match: /lounge|coworking|business center/i },
  { key: 'cocina_equipada', es: 'Cocina equipada', en: 'Equipped Kitchen', icon: ChefHat, match: /cocina|kitchen/i },
  { key: 'spa', es: 'Spa', en: 'Spa', icon: Spa, match: /spa|sauna|jacuzzi/i },
  { key: 'aire_acondicionado', es: 'Aire acondicionado', en: 'Air Conditioning', icon: Wind, match: /aire|ac|a\/c|air cond|minisplit/i },
  { key: 'terraza', es: 'Terraza / Roof garden', en: 'Terrace / Roof Garden', icon: Sun, match: /terraza|terrace|roof|azotea/i },
  { key: 'elevador', es: 'Elevador', en: 'Elevator', icon: Building, match: /elevador|elevator|ascensor/i },
  { key: 'ciclopista', es: 'Ciclopista', en: 'Bike Lane', icon: Bike, match: /ciclopista|bike|bici/i },
  { key: 'kids_area', es: 'Área infantil', en: "Kids' Area", icon: Heart, match: /kids|infantil|ni(n|ñ)os|playground/i },
  { key: 'game_room', es: 'Sala de juegos', en: 'Game Room', icon: Gamepad2, match: /game|juegos|billar|pool table/i },
  { key: 'valet', es: 'Valet parking', en: 'Valet Parking', icon: ParkingCircle, match: /valet/i },
  { key: 'restaurante', es: 'Restaurante / Club', en: 'Restaurant / Club', icon: UtensilsCrossed, match: /restaurant|club|beach club/i },
  { key: 'asador', es: 'Asadores', en: 'BBQ Grills', icon: Flame, match: /asador|bbq|parrilla|grill/i },
  { key: 'pet_friendly', es: 'Pet friendly', en: 'Pet Friendly', icon: PawPrint, match: /pet|mascot/i },
];

/**
 * Renders amenities with matching canonical icons when possible.
 * - With a real list: each entry is matched against 20 canonical regexes.
 *   Unmatched strings render as generic chips (CheckCircle2 icon).
 * - Without a list: renders nothing (returns null). NO se hace fallback a
 *   "todas las amenidades": mostrar las 20 canónicas cuando el desarrollo no
 *   tiene amenidades definidas en el Hub publicitaba amenidades inexistentes.
 */
export default async function AmenityList({ locale, amenities, title }: AmenityListProps) {
  const t = await getTranslations({ locale, namespace: 'property' });
  const pickAmenityLabel = (c: AmenityDef) => locale === 'en' ? c.en : c.es;

  // Sin amenidades definidas → ocultar la sección por completo.
  if (!amenities || amenities.length === 0) return null;

  const items: Array<{ key: string; label: string; icon: LucideIcon }> =
    amenities.map((raw, idx) => {
      const canonical = AMENITIES.find((c) => c.match.test(raw));
      return canonical
        ? { key: `${canonical.key}-${idx}`, label: pickAmenityLabel(canonical), icon: canonical.icon }
        : { key: `raw-${idx}`, label: raw, icon: CheckCircle2 };
    });

  const resolvedTitle = title ?? t('amenities');

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--propyte-dark-900)] mb-4">{resolvedTitle}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.key}
              className="flex items-center gap-2 px-3 py-2.5 bg-[var(--propyte-cyan-50)]/60 rounded-xl border border-[var(--propyte-cyan-100)]/40"
            >
              <Icon size={18} className="propyte-amenity-icon" />
              <span className="text-sm text-[var(--propyte-dark-900)] font-medium truncate">{a.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
