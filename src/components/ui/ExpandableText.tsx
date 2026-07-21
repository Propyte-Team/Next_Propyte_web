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
  const [lines, setLines] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Measure line-height from the real rendered text so the clamp height
    // tracks maxHeight regardless of font/leading.
    const sample = (el.querySelector('p, li, span, div') as HTMLElement) || el;
    const cs = window.getComputedStyle(sample);
    let lineHeight = parseFloat(cs.lineHeight);
    if (!lineHeight || Number.isNaN(lineHeight)) {
      lineHeight = parseFloat(cs.fontSize) * 1.5;
    }

    const computedLines = Math.max(2, Math.round(maxHeight / lineHeight));
    setLines(computedLines);
    // Only show the toggle when the content actually overflows the clamp.
    setNeedsToggle(el.scrollHeight > computedLines * lineHeight + 4);
  }, [maxHeight, children]);

  const clampStyle: React.CSSProperties =
    !expanded && lines > 0
      ? {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: lines,
          overflow: 'hidden',
        }
      : {};

  return (
    <div>
      <div ref={contentRef} style={clampStyle} className={className}>
        {children}
      </div>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[#0E7490] hover:underline"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
