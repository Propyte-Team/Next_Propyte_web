import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <>
      {/* Hero placeholder */}
      <section className="bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center space-y-4">
          <Skeleton className="h-6 w-32 mx-auto bg-white/10" />
          <Skeleton className="h-12 md:h-16 w-3/4 max-w-2xl mx-auto bg-white/10" />
          <Skeleton className="h-5 w-2/3 max-w-xl mx-auto bg-white/10" />
        </div>
      </section>

      {/* Cards grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <article key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
