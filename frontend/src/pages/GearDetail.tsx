import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  createGearMaintenanceEntry,
  getGearItem,
  getGearMaintenance,
  type GearItem,
  type GearMaintenanceEntry,
} from '../api'
import { Card } from '../components/Card'

const inputClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

function MaintenanceForm({ gearId, onAdded }: { gearId: number; onAdded: () => void }) {
  const [description, setDescription] = useState('')
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [distanceKm, setDistanceKm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await createGearMaintenanceEntry(gearId, {
        description,
        performed_at: performedAt,
        distance_at_service_m: distanceKm ? Number(distanceKm) * 1000 : null,
      })
      setDescription('')
      setDistanceKm('')
      onAdded()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className={inputClass}
          placeholder="Chain replaced"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Date</label>
        <input
          type="date"
          value={performedAt}
          onChange={(e) => setPerformedAt(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Distance (km)</label>
        <input
          type="number"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          className={`${inputClass} w-28`}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        Add entry
      </button>
    </form>
  )
}

export function GearDetail() {
  const { id } = useParams<{ id: string }>()
  const [gear, setGear] = useState<GearItem | null>(null)
  const [entries, setEntries] = useState<GearMaintenanceEntry[]>([])

  const load = () => {
    if (!id) return
    getGearItem(Number(id)).then(setGear)
    getGearMaintenance(Number(id)).then(setEntries)
  }

  useEffect(load, [id])

  if (!gear) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{gear.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {gear.gear_type} · {(gear.total_distance_m / 1000).toFixed(0)} km total
          {gear.is_retired && ' · Retired'}
        </p>
      </div>

      <Card title="Add maintenance entry">
        <MaintenanceForm gearId={Number(id)} onAdded={load} />
      </Card>

      <Card title="Maintenance history">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No maintenance logged yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-slate-900 dark:text-slate-100">{entry.description}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{entry.performed_at}</div>
                </div>
                {entry.distance_at_service_m != null && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {(entry.distance_at_service_m / 1000).toFixed(0)} km
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
