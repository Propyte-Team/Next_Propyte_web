'use client';

// Vendored from Magic UI (magicui.design/r/meteors.json).
// Requiere @keyframes meteor + .animate-meteor en globals.css.
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

export const Meteors = ({
  number = 18,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

  useEffect(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const styles = [...new Array(number)].map(() => ({
      '--angle': -angle + 'deg',
      top: '-5%',
      left: `calc(0% + ${Math.floor(rand() * window.innerWidth)}px)`,
      animationDelay: rand() * (maxDelay - minDelay) + minDelay + 's',
      animationDuration: Math.floor(rand() * (maxDuration - minDuration) + minDuration) + 's',
    }));
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            'animate-meteor pointer-events-none absolute size-0.5 rotate-(--angle) rounded-full bg-amber-200/70 shadow-[0_0_0_1px_#ffffff10]',
            className,
          )}
        >
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-amber-200/70 to-transparent" />
        </span>
      ))}
    </>
  );
};
