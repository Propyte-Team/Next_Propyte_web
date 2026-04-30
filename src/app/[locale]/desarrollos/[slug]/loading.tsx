import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3">
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Hero gallery 16:9 */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <div className="flex gap-2 mt-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-24 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Title + price strip + tabs */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 mt-6 space-y-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>

      {/* Body grid */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#F4F6F8] rounded-lg p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </aside>
      </div>
    </div>
  );
}
