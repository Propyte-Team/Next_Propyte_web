'use client';

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface ForecastPoint {
  forecast_date: string;
  predicted_value: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
}

interface ADRTrendProps {
  historical: DataPoint[];
  forecasts?: ForecastPoint[];
  title?: string;
  height?: number;
  currency?: string;
}

export function ADRTrend({
  historical,
  forecasts = [],
  title = 'Tarifa Promedio Diaria (ADR)',
  height = 300,
  currency = 'MXN',
}: ADRTrendProps) {
  const data = [
    ...historical.map((d) => ({
      date: d.date.slice(0, 7),
      actual: d.value,
      forecast: null as number | null,
      ciLower: null as number | null,
      ciUpper: null as number | null,
    })),
    ...forecasts.map((f) => ({
      date: f.forecast_date.slice(0, 7),
      actual: null as number | null,
      forecast: f.predicted_value ? Math.round(f.predicted_value) : null,
      ciLower: f.ci_lower ? Math.round(f.ci_lower) : null,
      ciUpper: f.ci_upper ? Math.round(f.ci_upper) : null,
    })),
  ];

  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => {
              const [y, m] = v.split('-');
              const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            formatter={(v, name) => [
              `$${Number(v)?.toLocaleString()} ${currency}`,
              name === 'actual' ? 'Real' : 'Pronóstico',
            ]}
          />
          {forecasts.length > 0 && (
            <Area dataKey="ciUpper" stroke="none" fill="#99FF99" fillOpacity={0.2} />
          )}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          {forecasts.length > 0 && (
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3, strokeDasharray: '' }}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
