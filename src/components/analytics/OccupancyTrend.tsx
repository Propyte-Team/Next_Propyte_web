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

interface OccupancyTrendProps {
  historical: DataPoint[];
  forecasts?: ForecastPoint[];
  title?: string;
  height?: number;
}

export function OccupancyTrend({
  historical,
  forecasts = [],
  title = 'Ocupación',
  height = 300,
}: OccupancyTrendProps) {
  // Combine historical + forecast data
  const data = [
    ...historical.map((d) => ({
      date: d.date.slice(0, 7), // YYYY-MM
      actual: d.value,
      forecast: null as number | null,
      ciLower: null as number | null,
      ciUpper: null as number | null,
    })),
    ...forecasts.map((f) => ({
      date: f.forecast_date.slice(0, 7),
      actual: null as number | null,
      forecast: f.predicted_value,
      ciLower: f.ci_lower,
      ciUpper: f.ci_upper,
    })),
  ];

  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            formatter={(v, name) => [
              `${Number(v)?.toFixed(1)}%`,
              name === 'actual' ? 'Real' : 'Pronóstico',
            ]}
            labelFormatter={(label) => {
              const s = String(label);
              const [y, m] = s.split('-');
              const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
              return `${months[parseInt(m) - 1]} ${y}`;
            }}
          />
          {/* Confidence interval area */}
          {forecasts.length > 0 && (
            <Area
              dataKey="ciUpper"
              stroke="none"
              fill="#5CE0D2"
              fillOpacity={0.2}
            />
          )}
          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0D9488"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          {/* Forecast line */}
          {forecasts.length > 0 && (
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#0D9488"
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
