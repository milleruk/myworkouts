import { Link } from 'react-router-dom'
import type { DashboardSummary } from '../../api'
import { formatDistance, formatDuration } from '../../format'

export function YearlyStatsWidget({ summary }: { summary: DashboardSummary }) {
  const yearly = summary.yearly_stats
  if (!yearly || Object.keys(yearly).length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No activity data yet.</p>
  }

  const years = Object.values(yearly).sort((a, b) => b.year - a.year)

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {years.map((y) => (
        <div key={y.year} className="flex items-center justify-between py-2 text-sm">
          <Link
            to={`/rewind?year=${y.year}`}
            className="font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            {y.year}
          </Link>
          <div className="flex gap-4 text-slate-500 dark:text-slate-400">
            <span>{formatDistance(y.distance_m)}</span>
            <span>{formatDuration(y.duration_seconds)}</span>
            <span>{y.activity_count} activities</span>
          </div>
        </div>
      ))}
    </div>
  )
}
