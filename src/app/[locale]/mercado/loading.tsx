import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <>
      {/* Hero placeholder */}
      <section className="bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 space-y-4">
          <Skeleton className="h-5 w-28 bg-white/10" />
          <Skeleton className="h-10 md:h-14 w-3/4 max-w-2xl bg-white/10" />
          <Skeleton className="h-5 w-2/3 max-w-xl bg-white/10" />

          {/* KPI strip (4 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <Skeleton className="h-3 w-20 bg-white/10" />
                <Skeleton className="h-7 w-16 bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs + table area */}
      <section className="py-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-3 px-5 py-4">
                  <Skeleton className="h-4 col-span-2" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
