import type { DashboardSummary } from '../../api'

export function StreaksWidget({ summary }: { summary: DashboardSummary }) {
  const s = summary.streaks?.all
  if (!s) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No activity data yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {s.current_streak_days}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Current streak (days)</div>
      </div>
      <div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {s.longest_streak_days}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Longest streak (days)</div>
      </div>
    </div>
  )
}
