import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getActivity, type ActivityDetail as ActivityDetailData } from '../api'
import { Card } from '../components/Card'
import { formatDistance, formatDuration } from '../format'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
    </div>
  )
}

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<ActivityDetailData | null>(null)

  useEffect(() => {
    if (id) getActivity(Number(id)).then(setActivity)
  }, [id])

  if (!activity) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }

  const extraFields = Object.entries(activity.raw_summary).filter(
    ([key, value]) =>
      typeof value !== 'object' &&
      !['activityId', 'activityName', 'startTimeLocal', 'startTimeGMT'].includes(key),
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {activity.name || activity.activity_type}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {activity.activity_type} · {new Date(activity.start_time_local).toLocaleString()}
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Distance" value={formatDistance(activity.distance_m)} />
          <Stat label="Duration" value={formatDuration(activity.duration_seconds)} />
          <Stat label="Elevation gain" value={`${Math.round(activity.elevation_gain_m ?? 0)} m`} />
          <Stat label="Calories" value={`${activity.calories ?? '—'}`} />
          <Stat label="Avg HR" value={`${activity.average_hr ?? '—'}`} />
          <Stat label="Max HR" value={`${activity.max_hr ?? '—'}`} />
        </div>
      </Card>

      <Card title="Raw details from Garmin">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {extraFields.slice(0, 24).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="truncate text-slate-400 dark:text-slate-500">{key}</span>
              <span className="text-slate-700 dark:text-slate-300">{String(value)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
