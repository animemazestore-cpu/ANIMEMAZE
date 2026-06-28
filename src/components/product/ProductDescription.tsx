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
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const lineClampClass = lines === 2 ? 'line-clamp-2' : 'line-clamp-3';

  useEffect(() => {
    setExpanded(false);
  }, [description]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || !description) {
      setNeedsToggle(false);
      setCollapsedHeight(0);
      return;
    }

    // Measure with line-clamp applied
    content.className = `text-gray-500 ${className} leading-relaxed ${lineClampClass}`;
    const clampedHeight = content.offsetHeight;

    // Measure without line-clamp
    content.className = `text-gray-500 ${className} leading-relaxed`;
    const fullHeight = content.offsetHeight;

    const truncated = fullHeight > clampedHeight + 5;
    setCollapsedHeight(clampedHeight);
    setNeedsToggle(truncated);

    // Reset to collapsed state
    content.className = `text-gray-500 ${className} leading-relaxed ${lineClampClass}`;
  }, [description, lines, className]);

  if (!description) return null;

  return (
    <div ref={containerRef} className="relative mt-2.5 sm:mt-3">
      <div
        ref={contentRef}
        className={`text-gray-500 ${className} leading-relaxed transition-all duration-300 ease-in-out whitespace-pre-wrap ${
          !expanded ? lineClampClass : ''
        }`}
        style={{
          maxHeight: collapsedHeight > 0 && !expanded ? `${collapsedHeight}px` : expanded ? 'none' : undefined,
          overflow: collapsedHeight > 0 && !expanded ? 'hidden' : expanded ? 'visible' : undefined,
        }}
      >
        {description}
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
