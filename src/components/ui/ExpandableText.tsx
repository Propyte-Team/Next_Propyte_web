'use client';

import { useState, useRef, useLayoutEffect } from 'react';

interface ExpandableTextProps {
  children: React.ReactNode;
  maxHeight?: number;
  moreLabel?: string;
  lessLabel?: string;
  className?: string;
}

export default function ExpandableText({
  children,
  maxHeight = 120,
  moreLabel = 'Leer más',
  lessLabel = 'Leer menos',
  className = '',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setNeedsToggle(contentRef.current.scrollHeight > maxHeight + 4);
    }
  }, [maxHeight, children]);

  return (
    <div>
      <div
        ref={contentRef}
        style={!expanded ? { maxHeight: `${maxHeight}px`, overflow: 'hidden' } : undefined}
        className={className}
      >
        {children}
      </div>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[#0F766E] hover:underline"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
