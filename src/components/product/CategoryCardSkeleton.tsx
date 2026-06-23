interface CategoryCardSkeletonProps {
  count?: number;
}

export function CategoryCardSkeleton({ count = 6 }: CategoryCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-pulse"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 sm:p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </>
  );
}
