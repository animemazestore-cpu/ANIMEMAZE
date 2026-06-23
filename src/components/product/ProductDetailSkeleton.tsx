export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-full max-w-xs" />
        </div>
      </div>
    </div>
  );
}
