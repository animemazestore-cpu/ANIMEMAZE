import { Skeleton } from './Skeleton';

export function CartItemSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      {/* Product Image */}
      <Skeleton className="w-20 h-24 rounded-lg flex-shrink-0" />

      {/* Info */}
      <div className="flex-grow text-center sm:text-left space-y-2">
        <Skeleton className="h-5 w-3/4 rounded mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-1/2 rounded mx-auto sm:mx-0" />
      </div>

      {/* Quantity Controls */}
      <Skeleton className="h-10 w-24 rounded-lg" />

      {/* Subtotal & Delete */}
      <div className="flex sm:flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}
