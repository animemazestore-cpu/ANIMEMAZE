import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  // Detect mobile device
  useLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload adjacent images with performance optimization
  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const preloadAdjacent = () => {
        const indicesToLoad = [
          currentIndex,
          currentIndex + 1,
          currentIndex - 1,
          currentIndex + 2,
          currentIndex - 2
        ].filter(i => i >= 0 && i < images.length);
        
        indicesToLoad.forEach(index => {
          if (!loadedImages.has(index)) {
            const img = new Image();
            img.src = images[index];
            img.onload = () => {
              setLoadedImages(prev => new Set([...prev, index]));
            };
          }
        });
      };

      preloadAdjacent();
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [currentIndex, images, loadedImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setIsZoomed(false);
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const goToImage = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    // Scroll to the selected thumbnail on mobile
    if (scrollContainerRef.current && isMobile) {
      const thumbnail = scrollContainerRef.current.children[index] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, isTransitioning, isMobile]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setIsZoomed(false);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    document.body.style.overflow = '';
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev - 0.5, 1);
      if (newLevel === 1) setIsZoomed(false);
      return newLevel;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setIsZoomed(false);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Touch handlers for swipe with improved gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchStart(e.touches[0].clientX);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) {
      // Handle pan when zoomed with RAF for 60fps
      e.preventDefault();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        setPan({ x: pan.x + deltaX, y: pan.y + deltaY });
        setDragStart({ x: touch.clientX, y: touch.clientY });
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZoomed) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const velocity = Math.abs(diff) / 50; // Calculate swipe velocity
    
    // Lower threshold for faster swipes, higher for slower swipes
    const threshold = velocity > 1 ? 30 : 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Double tap to zoom
  const lastTapRef = useRef(0);
  const handleDoubleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (isZoomed) {
        resetZoom();
      } else {
        zoomIn();
      }
    }
    lastTapRef.current = now;
  }, [isZoomed, zoomIn, resetZoom]);

  // Pinch to zoom
  const initialPinchDistance = useRef(0);
  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialPinchDistance.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = currentDistance / initialPinchDistance.current;
      setZoomLevel(prev => Math.min(Math.max(prev * scale, 1), 3));
      setIsZoomed(true);
    }
  };

  // Mouse drag for zoom pan with RAF optimization
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan({ x: pan.x + deltaX, y: pan.y + deltaY });
      setDragStart({ x: e.clientX, y: e.clientY });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center">
        <span className="text-gray-400 text-sm">No images available</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="space-y-3">
      {/* Main Image Container */}
      <div
        ref={containerRef}
        className={`relative aspect-square sm:aspect-[4/5] lg:aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group ${
          isFullscreen ? 'fixed inset-0 z-50 bg-black/95 rounded-none' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Image with optimized rendering */}
        <img
          ref={imageRef}
          src={currentImage}
          alt={`${productName} - Image ${currentIndex + 1}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain will-change-transform ${
            isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          } ${!isFullscreen ? 'group-hover:scale-105' : ''}`}
          style={{
            transform: isZoomed ? `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)` : 'scale(1)',
 opacity: loadedImages.has(currentIndex) ? 1 : 0,
            transition: isZoomed ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
            cursor: isZoomed ? 'grab' : isFullscreen ? 'zoom-out' : 'zoom-in',
          }}
          onLoad={() => {
            setLoadedImages(prev => new Set([...prev, currentIndex]));
          }}
          onClick={() => isFullscreen ? (isZoomed ? resetZoom() : zoomIn()) : openFullscreen()}
        />

        {/* Blur placeholder while loading - prevents layout shift */}
        {!loadedImages.has(currentIndex) && (
          <div 
            className="absolute inset-0 bg-gray-200 animate-pulse"
            style={{
              backgroundImage: `linear-gradient(to right, #e5e7eb 8%, #f3f4f6 18%, #e5e7eb 33%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        )}

        {/* Fullscreen Navigation Arrows */}
        {isFullscreen && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Fullscreen Controls */}
        {isFullscreen && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Desktop Hover Overlay */}
        {!isFullscreen && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
        )}
      </div>

      {/* Mobile Image Counter */}
      <div className="lg:hidden flex items-center justify-between px-1">
        <div className="text-sm font-medium text-gray-700">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary w-6' : 'bg-gray-300 w-1.5'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails for Desktop, Thumbnail Strip for Mobile */}
      <div 
        ref={scrollContainerRef}
        className={`flex gap-2 ${
          isMobile 
            ? 'overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 px-1' 
            : 'overflow-x-auto pb-2 scrollbar-hide'
        }`}
      >
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`flex-shrink-0 ${
              isMobile ? 'w-16 h-16 snap-center' : 'w-14 h-14 sm:w-16 sm:h-16'
            } rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              index === currentIndex
                ? 'border-primary ring-2 ring-primary/20 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:scale-105'
            }`}
            aria-label={`View image ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          >
            <img
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
