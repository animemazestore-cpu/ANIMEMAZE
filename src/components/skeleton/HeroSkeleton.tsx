import { Skeleton } from './Skeleton';

export function HeroSkeleton() {
  return (
    <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
      {/* Hero Image */}
      <Skeleton className="w-full h-[300px] sm:h-[400px] lg:h-[500px]" />
      
      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          {/* Title */}
          <Skeleton className="h-12 w-64 sm:w-96 mx-auto rounded-lg" />
          
          {/* Subtitle */}
          <Skeleton className="h-6 w-48 sm:w-72 mx-auto rounded" />
          
          {/* CTA Button */}
          <Skeleton className="h-12 w-40 mx-auto rounded-lg" />
        </div>
      </div>
    </div>
  );
}
