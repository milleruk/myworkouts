import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardSummary } from '../../api'

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  detraining: { label: 'Detraining', color: 'var(--viz-series-1)', icon: '↓' },
  optimal: { label: 'Optimal', color: 'var(--viz-status-good)', icon: '✓' },
  caution: { label: 'Caution', color: 'var(--viz-status-warning)', icon: '!' },
  high_risk: { label: 'High risk', color: 'var(--viz-status-critical)', icon: '⚠' },
  low_data: { label: 'Not enough data', color: 'var(--viz-muted)', icon: '·' },
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100">ACWR {payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export function TrainingLoadWidget({ summary }: { summary: DashboardSummary }) {
  const load = summary.training_load?.current
  if (!load || load.points.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Not enough data yet.</p>
  }

  const meta = STATUS_META[load.status] ?? STATUS_META.low_data
  const data = load.points.map((p) => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    acwr: p.acwr,
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.icon}
        </span>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{meta.label}</span>
        {load.latest_acwr != null && (
          <span className="text-xs text-slate-400 dark:text-slate-500">ACWR {load.latest_acwr.toFixed(2)}</span>
        )}
      </div>
      <div className="viz-root h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--viz-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--viz-baseline)' }}
              tickLine={false}
              interval={14}
            />
            <YAxis
              domain={[0, 'dataMax + 0.2']}
              tick={{ fill: 'var(--viz-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={34}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <ReferenceLine y={0.8} stroke="var(--viz-gridline)" strokeDasharray="3 3" />
            <ReferenceLine y={1.3} stroke="var(--viz-gridline)" strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="acwr"
              stroke="var(--viz-series-1)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
