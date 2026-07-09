import MarketplaceCardSkeleton from '@/components/marketplace/MarketplaceCardSkeleton';

/**
 * Card-grid skeleton para /desarrollos mientras se resuelve la data server-side
 * (getDevelopments). Mismas clases de grid que PropertyList variant="grid"
 * (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7)
 * para que el swap loading → contenido no salte de layout.
 */
export default function Loading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7">
        {Array.from({ length: 8 }).map((_, i) => (
          <MarketplaceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
