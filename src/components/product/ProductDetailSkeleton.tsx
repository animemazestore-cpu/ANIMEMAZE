import { Skeleton } from '../skeleton/Skeleton';

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48 rounded" />
      
      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Side: Images */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <Skeleton className="aspect-square sm:aspect-[4/5] lg:aspect-square rounded-xl sm:rounded-2xl" />
          {/* Thumbnails */}
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge */}
          <Skeleton className="h-6 w-32 rounded-full" />
          
          {/* Title */}
          <Skeleton className="h-10 w-3/4 rounded" />
          
          {/* Rating */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          
          {/* Price */}
          <Skeleton className="h-8 w-24 rounded" />
          
          {/* Description */}
          <div className="border-t border-b border-gray-200 py-4 space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
          
          {/* Stock state */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
          
          {/* Size selector */}
          <div className="space-y-3 border-b border-gray-200 pb-4">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-xl" />
              ))}
            </div>
          </div>
          
          {/* Quantity */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-12 flex-grow rounded-lg" />
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
