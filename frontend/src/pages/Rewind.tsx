import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getDashboardSummary, type ActivityHighlight, type YearlyStat } from '../api'
import { Card } from '../components/Card'
import { formatDistance, formatDuration } from '../format'

function HighlightCard({ title, activity }: { title: string; activity: ActivityHighlight | null }) {
  if (!activity) return null
  return (
    <Card title={title}>
      <Link to={`/activities/${activity.id}`} className="flex flex-col gap-1">
        <span className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          {activity.name || activity.activity_type}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {formatDistance(activity.distance_m)} · {formatDuration(activity.duration_seconds)}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(activity.start_time_local).toLocaleDateString()}
        </span>
      </Link>
    </Card>
  )
}

export function Rewind() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [years, setYears] = useState<Record<string, YearlyStat> | null>(null)

  useEffect(() => {
    getDashboardSummary(['yearly_stats']).then((summary) => {
      const yearly = summary.yearly_stats ?? {}
      setYears(yearly)
      if (!searchParams.get('year')) {
        const latest = Object.values(yearly).sort((a, b) => b.year - a.year)[0]
        if (latest) setSearchParams({ year: String(latest.year) }, { replace: true })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!years) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }

  const sortedYears = Object.values(years).sort((a, b) => b.year - a.year)
  const selectedYear = searchParams.get('year') ?? String(sortedYears[0]?.year ?? '')
  const stat = years[selectedYear]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Rewind</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSearchParams({ year: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {sortedYears.map((y) => (
            <option key={y.year} value={y.year}>
              {y.year}
            </option>
          ))}
        </select>
      </div>

      {!stat ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No data for this year.</p>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatDistance(stat.distance_m)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Distance</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatDuration(stat.duration_seconds)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Duration</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {stat.activity_count}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Activities</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {stat.active_days}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Active days</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <HighlightCard title="Longest distance" activity={stat.highlights.longest_distance_activity} />
            <HighlightCard title="Longest duration" activity={stat.highlights.longest_duration_activity} />
            <HighlightCard
              title="Most elevation gain"
              activity={stat.highlights.most_elevation_gain_activity}
            />
          </div>
        </>
      )}
    </div>
  )
}
