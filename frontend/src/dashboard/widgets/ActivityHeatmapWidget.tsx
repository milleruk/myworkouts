import type { DashboardSummary, HeatmapDay } from '../../api'

function levelColor(minutes: number): string {
  if (minutes <= 0) return 'var(--viz-gridline)'
  if (minutes < 30) return 'var(--viz-seq-250)'
  if (minutes < 60) return 'var(--viz-seq-350)'
  if (minutes < 120) return 'var(--viz-seq-450)'
  return 'var(--viz-seq-650)'
}

function mondayIndex(dateStr: string): number {
  const day = new Date(dateStr).getDay() // 0=Sun..6=Sat
  return (day + 6) % 7 // 0=Mon..6=Sun
}

export function ActivityHeatmapWidget({ summary }: { summary: DashboardSummary }) {
  const heatmap = summary.activity_heatmap?.last_365
  if (!heatmap || heatmap.days.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No activity data yet.</p>
  }

  const days = heatmap.days
  const leadingBlanks = mondayIndex(days[0].date)
  const cells: (HeatmapDay | null)[] = [...Array(leadingBlanks).fill(null), ...days]

  const totalActiveDays = days.filter((d) => d.count > 0).length

  return (
    <div className="viz-root flex flex-col gap-2">
      <div
        className="grid gap-[3px] overflow-x-auto pb-1"
        style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gridAutoColumns: '11px' }}
      >
        {cells.map((day, i) =>
          day ? (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}, ${day.duration_minutes} min`}
              className="rounded-[2px]"
              style={{ backgroundColor: levelColor(day.duration_minutes) }}
            />
          ) : (
            <div key={`blank-${i}`} />
          ),
        )}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {totalActiveDays} active days in the last year
      </div>
    </div>
  )
}
