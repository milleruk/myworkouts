import type { DashboardSummary } from '../../api'
import { PeriodBarChart } from '../../components/dashboard/PeriodBarChart'
import { formatDistance } from '../../format'

function formatMonthLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}

export function MonthlyStatsWidget({ summary }: { summary: DashboardSummary }) {
  const periods = summary.monthly_stats?.current.periods
  if (!periods || periods.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No activity data yet.</p>
  }
  const latest = periods[periods.length - 1]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-6 text-sm">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {formatDistance(latest.distance_m)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">This month</div>
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{latest.activity_count}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Activities</div>
        </div>
      </div>
      <PeriodBarChart periods={periods} formatLabel={formatMonthLabel} />
    </div>
  )
}
