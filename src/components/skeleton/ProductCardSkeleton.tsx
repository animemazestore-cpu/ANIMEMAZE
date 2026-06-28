import { Skeleton } from './Skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full aspect-square" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 rounded" />
        
        {/* Price */}
        <Skeleton className="h-6 w-1/3 rounded" />
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
