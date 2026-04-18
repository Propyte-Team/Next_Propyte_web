'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  occupancy: number;
  adr: number;
}

interface RevPARChartProps {
  occupancyData: Array<{ date: string; value: number }>;
  adrData: Array<{ date: string; value: number }>;
  title?: string;
  height?: number;
}

export function RevPARChart({
  occupancyData,
  adrData,
  title = 'RevPAR (Ingreso por Noche Disponible)',
  height = 300,
}: RevPARChartProps) {
  // Merge occupancy and ADR by date, compute RevPAR
  const adrMap = new Map(adrData.map((d) => [d.date.slice(0, 7), d.value]));

  const data = occupancyData
    .map((d) => {
      const dateKey = d.date.slice(0, 7);
      const adr = adrMap.get(dateKey);
      if (!adr) return null;
      return {
        date: dateKey,
        revpar: Math.round((d.value / 100) * adr),
        occupancy: d.value,
        adr,
      };
    })
    .filter(Boolean) as Array<{ date: string; revpar: number; occupancy: number; adr: number }>;

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-8">
        No hay datos suficientes para calcular RevPAR
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
            formatter={(v) => [`$${Number(v).toLocaleString()} MXN/noche`, 'RevPAR']}
          />
          <defs>
            <linearGradient id="revparGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="revpar"
            stroke="#0D9488"
            strokeWidth={2}
            fill="url(#revparGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
