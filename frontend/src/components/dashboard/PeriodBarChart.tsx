import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PeriodStat } from '../../api'

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100">
        {payload[0].value.toFixed(1)} km
      </div>
    </div>
  )
}

export function PeriodBarChart({
  periods,
  formatLabel,
}: {
  periods: PeriodStat[]
  formatLabel: (period: string) => string
}) {
  const data = periods.map((p) => ({
    label: formatLabel(p.period),
    km: p.distance_m / 1000,
  }))

  return (
    <div className="viz-root h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--viz-gridline)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--viz-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--viz-baseline)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--viz-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--viz-gridline)' }} />
          <Bar dataKey="km" fill="var(--viz-series-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
