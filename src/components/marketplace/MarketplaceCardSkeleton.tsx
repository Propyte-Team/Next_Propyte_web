export default function MarketplaceCardSkeleton() {
  return (
    <div className="border-b border-r border-gray-100 animate-pulse">
      <div className="aspect-[16/10] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-32" />
        <div className="h-4 bg-gray-100 rounded w-48" />
        <div className="h-3 bg-gray-100 rounded w-24 mt-1" />
        <div className="flex gap-2 mt-1.5">
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}
