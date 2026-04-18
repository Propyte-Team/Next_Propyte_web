'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface StatCounterProps {
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
  format?: 'number' | 'plain';
}

export default function StatCounter({
  to,
  duration = 1200,
  suffix = '',
  className = '',
  format = 'number',
}: StatCounterProps) {
  const [value, setValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !elementRef.current) {
      setValue(to);
      return;
    }

    const el = elementRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const start = performance.now();

          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(to * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration, reduce]);

  const formatted = format === 'number' ? value.toLocaleString('es-MX') : value.toString();

  return (
    <span ref={elementRef} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
