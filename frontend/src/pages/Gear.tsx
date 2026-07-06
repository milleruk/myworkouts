import { useEffect, useState } from 'react'
import { getGear, type GearItem } from '../api'
import { Card } from '../components/Card'

export function Gear() {
  const [gear, setGear] = useState<GearItem[] | null>(null)

  useEffect(() => {
    getGear()
      .then(setGear)
      .catch(() => setGear([]))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Gear</h1>

      {gear === null ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : gear.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No gear imported yet. Connect and sync your Garmin account to import it.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gear.map((g) => (
            <Card key={g.id}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{g.name}</span>
                  {g.is_retired && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Retired
                    </span>
                  )}
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {g.gear_type}
                </span>
                <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {(g.total_distance_m / 1000).toFixed(0)} km total
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
