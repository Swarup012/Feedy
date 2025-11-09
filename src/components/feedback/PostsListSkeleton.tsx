import { Skeleton } from "@/components/ui/skeleton";

export function PostsListSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          {/* Title and upvotes */}
          <div className="flex items-start gap-3">
            {/* Upvote button skeleton */}
            <div className="flex flex-col items-center gap-1 min-w-[40px]">
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-3 w-6" />
            </div>

            {/* Post content skeleton */}
            <div className="flex-1 space-y-2">
              {/* Title */}
              <Skeleton className="h-5 w-3/4" />
              
              {/* Description */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              {/* Meta info */}
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostDetailsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Author info */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Comments section */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-6 w-24" />
        
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardsListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg"
        >
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
