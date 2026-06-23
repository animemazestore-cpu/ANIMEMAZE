import { memo, useState } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  sizes?: string;
}

export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  wrapperClassName = 'relative w-full h-full',
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw',
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={wrapperClassName}>
      {!loaded && !error && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          Image unavailable
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${className} transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
});
