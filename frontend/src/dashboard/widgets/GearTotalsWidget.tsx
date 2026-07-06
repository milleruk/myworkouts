import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGear, type GearItem } from '../../api'

// Ignores `summary` deliberately: gear totals come straight from Garmin's own
// per-gear stats (already authoritative), not from the ComputedStat cache.
export function GearTotalsWidget(_props: { summary?: unknown }) {
  const [gear, setGear] = useState<GearItem[] | null>(null)

  useEffect(() => {
    getGear()
      .then((items) => setGear(items.filter((g) => !g.is_retired).slice(0, 6)))
      .catch(() => setGear([]))
  }, [])

  if (gear === null) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }
  if (gear.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No gear imported yet.</p>
  }

  const maxDistance = Math.max(...gear.map((g) => g.total_distance_m), 1)

  return (
    <div className="flex flex-col gap-3">
      {gear.map((g) => (
        <Link key={g.id} to={`/gear/${g.id}`} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-900 hover:underline dark:text-slate-100">{g.name}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {(g.total_distance_m / 1000).toFixed(0)} km
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${(g.total_distance_m / maxDistance) * 100}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
