'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/formatters';

interface TrendChartProps {
  title: string;
  data: { label: string; value: number }[];
  format: 'pct' | 'mxn';
}

export default function TrendChart({ title, data, format }: TrendChartProps) {
  const fmt = (v: number) => (format === 'pct' ? `${v}%` : formatPrice(v));
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-bold text-gray-900">{title}</div>
        <span className="text-2xs text-[#0E7490] bg-propyte-cyan-100 px-2 py-0.5 rounded-full font-bold">dato real</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5CE0D2" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#5CE0D2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F4F6F8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmt} domain={format === 'pct' ? [0, 100] : ['auto', 'auto']} />
            <Tooltip formatter={(v) => [fmt(v as number), title]} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#0E7490" strokeWidth={2.5} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
