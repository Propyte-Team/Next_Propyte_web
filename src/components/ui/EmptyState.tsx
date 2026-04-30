import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  tone?: 'light' | 'dark';
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  tone = 'light',
  className = '',
}: EmptyStateProps) {
  const isDark = tone === 'dark';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 md:py-20 ${className}`}
      role="status"
    >
      <div
        className={`flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
          isDark ? 'bg-[#5CE0D2]/10 ring-1 ring-[#5CE0D2]/20' : 'bg-[#5CE0D2]/15'
        }`}
        aria-hidden="true"
      >
        <Icon
          size={32}
          strokeWidth={1.75}
          className={isDark ? 'text-[#5CE0D2]' : 'text-[#0D9488]'}
        />
      </div>
      <h3
        className={`text-xl md:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1A2F3F]'}`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`max-w-md text-sm md:text-base leading-relaxed ${
            isDark ? 'text-white/70' : 'text-gray-500'
          }`}
        >
          {description}
        </p>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actions.map((action) => {
            const isPrimary = action.variant !== 'secondary';
            const baseCls =
              'inline-flex items-center justify-center h-11 px-5 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]';
            const primaryCls = isDark
              ? 'bg-[#5CE0D2] text-[#0F1923] hover:bg-[#4BCEC0]'
              : 'bg-[#1A2F3F] text-white hover:bg-[#0F1923]';
            const secondaryCls = isDark
              ? 'border border-white/30 text-white hover:bg-white/10'
              : 'border border-gray-200 text-[#1A2F3F] hover:bg-gray-50';
            const cls = `${baseCls} ${isPrimary ? primaryCls : secondaryCls}`;

            if (action.external) {
              return (
                <a
                  key={action.href + action.label}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {action.label}
                </a>
              );
            }
            return (
              <Link key={action.href + action.label} href={action.href} className={cls}>
                {action.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
