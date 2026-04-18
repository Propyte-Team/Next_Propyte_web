'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SeasonalIndex {
  month: number;
  seasonal_factor: number;
}

interface SeasonalPatternProps {
  indices: SeasonalIndex[];
  title?: string;
  height?: number;
  metricLabel?: string;
}

const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function SeasonalPattern({
  indices,
  title = 'Patrón Estacional',
  height = 250,
  metricLabel = 'Factor',
}: SeasonalPatternProps) {
  const data = MONTH_LABELS.map((label, i) => {
    const entry = indices.find((idx) => idx.month === i + 1);
    const factor = entry?.seasonal_factor ?? 1.0;
    return {
      month: label,
      factor: Math.round(factor * 100) / 100,
      pct: Math.round((factor - 1) * 100),
      isHigh: factor > 1.0,
    };
  });

  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            tickFormatter={(v: number) => `${v}x`}
          />
          <ReferenceLine y={1} stroke="#999" strokeDasharray="3 3" />
          <Tooltip
            formatter={(v) => {
              const n = Number(v);
              return [`${n}x (${n > 1 ? '+' : ''}${Math.round((n - 1) * 100)}%)`, metricLabel];
            }}
          />
          <Bar
            dataKey="factor"
            radius={[4, 4, 0, 0]}
            fill="#0D9488"
            fillOpacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
        <span>Temporada baja</span>
        <span>Temporada alta</span>
      </div>
    </div>
  );
}
