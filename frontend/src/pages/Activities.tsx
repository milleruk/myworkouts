import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivities, type Activity } from '../api'
import { Card } from '../components/Card'
import { formatDistance, formatDuration } from '../format'

export function Activities() {
  const [data, setData] = useState<{ results: Activity[]; count: number } | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getActivities(page)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page])

  const pageSize = 50
  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Activities</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.count.toLocaleString()} activities` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No activities yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Distance</th>
                  <th className="py-2 pr-4 font-medium">Duration</th>
                  <th className="py-2 pr-4 font-medium">Avg HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.results.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(a.start_time_local).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {a.activity_type}
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        to={`/activities/${a.id}`}
                        className="text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {a.name || '—'}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDistance(a.distance_m)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDuration(a.duration_seconds)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {a.average_hr ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
