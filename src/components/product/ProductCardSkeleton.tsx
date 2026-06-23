interface ProductCardSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm animate-pulse">
      <div className="aspect-[4/5] bg-gray-200" />
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-3">
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3 hidden sm:block" />
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-100 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ count = 6 }: ProductCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  );
}
