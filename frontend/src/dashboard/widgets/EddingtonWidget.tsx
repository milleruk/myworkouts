import type { DashboardSummary } from '../../api'

const GROUP_LABELS: Record<string, string> = {
  overall: 'Overall',
  running: 'Running',
  cycling: 'Cycling',
  walking_hiking: 'Walking / Hiking',
  swimming: 'Swimming',
}

export function EddingtonWidget({ summary }: { summary: DashboardSummary }) {
  const data = summary.eddington_number
  if (!data || !data.overall) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Not enough distance data yet.</p>
  }

  const others = Object.keys(data).filter((k) => k !== 'overall')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {data.overall.number}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Overall Eddington number ({data.overall.activities_counted} activities)
        </div>
      </div>
      {others.length > 0 && (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {others.map((key) => (
            <div key={key} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{GROUP_LABELS[key] ?? key}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{data[key].number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
