'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Info, X } from 'lucide-react';
import type { MarketAlert } from '@/lib/supabase/queries';

interface MarketAlertBannerProps {
  city?: string;
  maxAlerts?: number;
}

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: AlertTriangle,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: TrendingDown,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: Info,
  },
} as const;

export function MarketAlertBanner({ city, maxAlerts = 3 }: MarketAlertBannerProps) {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);

    fetch(`/api/market-alerts?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.alerts) setAlerts(data.alerts.slice(0, maxAlerts));
      })
      .catch(() => {});
  }, [city, maxAlerts]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const severity = (alert.severity as keyof typeof SEVERITY_STYLES) || 'info';
        const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
        const Icon = alert.deviation_pct && alert.deviation_pct > 0 ? TrendingUp : style.icon;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg}`}
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${style.text}`}>{alert.message}</p>
              {alert.zone && (
                <p className="text-xs text-gray-500 mt-0.5">{alert.zone} &middot; {alert.city}</p>
              )}
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="p-0.5 hover:bg-white/50 rounded"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
