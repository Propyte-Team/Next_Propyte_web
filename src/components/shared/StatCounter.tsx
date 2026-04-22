'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useLocale } from 'next-intl';

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
  const locale = useLocale();
  // Initialize with final value so SSR/initial render never shows "0+"
  const [value, setValue] = useState(to);
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

  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';
  const formatted = format === 'number' ? value.toLocaleString(intlLocale) : value.toString();

  return (
    <span ref={elementRef} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
