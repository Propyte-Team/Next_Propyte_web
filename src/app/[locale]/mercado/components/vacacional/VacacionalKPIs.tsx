'use client';

import { BarChart3, TrendingUp, Home, MapPin } from 'lucide-react';

interface VacacionalKPIsProps {
  zones: number;
  avgIndex: number;
  avgOccupancy: number;
  totalListings: number;
  locale: string;
}

export function VacacionalKPIs({ zones, avgIndex, avgOccupancy, totalListings, locale }: VacacionalKPIsProps) {
  const isEn = locale === 'en';

  const kpis = [
    {
      icon: MapPin,
      value: zones.toString(),
      label: isEn ? 'Zones' : 'Zonas',
      color: 'text-gray-900',
    },
    {
      icon: BarChart3,
      value: `${avgIndex}/100`,
      label: isEn ? 'Avg Index' : 'Índice Promedio',
      color: 'text-teal-700',
    },
    {
      icon: TrendingUp,
      value: `${avgOccupancy}%`,
      label: isEn ? 'Avg Occupancy' : 'Ocupación Prom.',
      color: 'text-gray-900',
    },
    {
      icon: Home,
      value: totalListings.toLocaleString(),
      label: isEn ? 'Active Properties' : 'Propiedades Activas',
      color: 'text-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map(({ icon: Icon, value, label, color }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-lg p-4 text-center"
        >
          <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
