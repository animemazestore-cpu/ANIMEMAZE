import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ProductDescriptionProps {
  description: string | null;
  className?: string;
  lines?: 2 | 3;
}

export function ProductDescription({
  description,
  className = 'text-xs',
  lines = 3,
}: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [heights, setHeights] = useState({ collapsed: 0, full: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fullMeasureRef = useRef<HTMLParagraphElement>(null);
  const clampedMeasureRef = useRef<HTMLParagraphElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const lineClampClass = lines === 2 ? 'line-clamp-2' : 'line-clamp-3';

  useEffect(() => {
    setExpanded(false);
  }, [description]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const fullMeasure = fullMeasureRef.current;
    const clampedMeasure = clampedMeasureRef.current;
    if (!wrapper || !fullMeasure || !clampedMeasure || !description) {
      setNeedsToggle(false);
      setHeights({ collapsed: 0, full: 0 });
      return;
    }

    const measure = () => {
      const fullHeight = fullMeasure.offsetHeight;
      const collapsedHeight = clampedMeasure.offsetHeight;
      const truncated = fullHeight > collapsedHeight + 1;

      setHeights({ collapsed: collapsedHeight, full: fullHeight });
      setNeedsToggle(truncated);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [description, lines, className]);

  if (!description) return null;

  const maxHeight =
    heights.collapsed > 0
      ? expanded
        ? heights.full
        : heights.collapsed
      : undefined;

  return (
    <div ref={wrapperRef} className="relative mt-2.5 sm:mt-3 hidden sm:block">
      <p
        ref={fullMeasureRef}
        className={`${className} leading-relaxed invisible absolute inset-x-0 top-0 -z-10 pointer-events-none`}
        aria-hidden="true"
      >
        {description}
      </p>
      <p
        ref={clampedMeasureRef}
        className={`${className} leading-relaxed ${lineClampClass} invisible absolute inset-x-0 top-0 -z-10 pointer-events-none`}
        aria-hidden="true"
      >
        {description}
      </p>

      <div
        ref={containerRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={maxHeight !== undefined ? { maxHeight: `${maxHeight}px` } : undefined}
      >
        <p
          className={`text-gray-500 ${className} leading-relaxed ${
            !expanded ? lineClampClass : ''
          }`}
        >
          {description}
        </p>
      </div>

      {needsToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="text-primary hover:text-primary-dark text-[10px] sm:text-xs font-semibold mt-1.5 transition-colors focus:outline-none focus-visible:underline"
          aria-expanded={expanded}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}
