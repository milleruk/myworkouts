import type { DashboardSummary } from '../../api'
import { PeriodBarChart } from '../../components/dashboard/PeriodBarChart'
import { formatDistance, formatDuration } from '../../format'

function formatWeekLabel(period: string) {
  const d = new Date(period)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function WeeklyStatsWidget({ summary }: { summary: DashboardSummary }) {
  const periods = summary.weekly_stats?.current.periods
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
          <div className="text-xs text-slate-400 dark:text-slate-500">This week</div>
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {formatDuration(latest.duration_seconds)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Duration</div>
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{latest.activity_count}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Activities</div>
        </div>
      </div>
      <PeriodBarChart periods={periods} formatLabel={formatWeekLabel} />
    </div>
  )
}
