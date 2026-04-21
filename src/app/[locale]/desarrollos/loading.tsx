import MarketplaceCardSkeleton from '@/components/marketplace/MarketplaceCardSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      <div className="px-4 md:px-6 pt-4 pb-3 bg-white border-b border-gray-100 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-56" />
        <div className="h-4 bg-gray-100 rounded w-80 mt-2" />
      </div>
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="flex-1 overflow-hidden flex">
        <div className="w-[60%] bg-gray-100 animate-pulse" />
        <div className="w-[40%] border-l overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <MarketplaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
