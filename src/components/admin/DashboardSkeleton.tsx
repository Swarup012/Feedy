import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-full overflow-hidden space-y-4">
        {/* Header skeleton */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-11 w-40 rounded-lg" />
          </div>
        </section>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
            >
              <Skeleton className="mt-0.5 w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="min-w-0 space-y-2 flex-1">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* Two-column content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Recent Posts skeleton */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="divide-y divide-border">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                    <Skeleton className="h-3 w-16 flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-3 w-8 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Most Requested skeleton */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-36 mt-1.5" />
              </div>
              <div className="divide-y divide-border">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <Skeleton className="w-5 h-4 flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-3 w-8 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Boards skeleton */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="divide-y divide-border">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Status skeleton */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40 mt-1.5" />
              </div>
              <div className="px-5 py-4 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tracked Users skeleton */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-lg bg-muted/40 py-2 text-center space-y-1">
                      <Skeleton className="h-3 w-10 mx-auto" />
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
