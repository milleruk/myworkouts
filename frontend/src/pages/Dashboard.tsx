import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardLayout,
  getDashboardSummary,
  getGarminAccount,
  recomputeStats,
  updateDashboardLayout,
  type DashboardSummary,
  type GarminAccount,
  type Me,
  type WidgetConfig,
} from '../api'
import { Card } from '../components/Card'
import { LayoutEditor } from '../components/dashboard/LayoutEditor'
import { WidgetContainer } from '../components/dashboard/WidgetContainer'
import { WIDGET_REGISTRY } from '../dashboard/widgetRegistry'

export function Dashboard({ me }: { me: Me }) {
  const [account, setAccount] = useState<GarminAccount | null>(null)
  const [widgets, setWidgets] = useState<WidgetConfig[] | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({ _meta: { computed_at: {} } })
  const [editing, setEditing] = useState(false)
  const [recomputing, setRecomputing] = useState(false)

  const loadDashboard = () => {
    getDashboardLayout().then(async (loadedWidgets) => {
      setWidgets(loadedWidgets)
      const statKeys = loadedWidgets
        .filter((w) => w.enabled && w.widget !== 'gear_totals')
        .map((w) => w.widget)
      if (statKeys.length > 0) {
        setSummary(await getDashboardSummary(statKeys))
      }
    })
  }

  useEffect(() => {
    getGarminAccount()
      .then(setAccount)
      .catch(() => setAccount({ status: 'not_connected' }))
    loadDashboard()
  }, [])

  const handleSaveLayout = async (updated: WidgetConfig[]) => {
    const saved = await updateDashboardLayout(updated)
    setWidgets(saved)
    setEditing(false)
    const statKeys = saved.filter((w) => w.enabled && w.widget !== 'gear_totals').map((w) => w.widget)
    if (statKeys.length > 0) setSummary(await getDashboardSummary(statKeys))
  }

  const handleRecompute = async () => {
    setRecomputing(true)
    try {
      await recomputeStats()
      setTimeout(loadDashboard, 3000)
    } finally {
      setRecomputing(false)
    }
  }

  const connected = account && account.status !== 'not_connected'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Welcome back{me.first_name ? `, ${me.first_name}` : ''}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Here's what's happening with your data.
          </p>
        </div>
        {connected && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRecompute}
              disabled={recomputing}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-60 dark:border-slate-800 dark:text-slate-300"
            >
              {recomputing ? 'Recomputing…' : 'Recompute stats'}
            </button>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              {editing ? 'Done' : 'Edit layout'}
            </button>
          </div>
        )}
      </div>

      {!connected && (
        <Card title="Garmin account">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Not connected yet.{' '}
            <Link to="/garmin-account" className="text-blue-600 hover:underline dark:text-blue-400">
              Connect your account
            </Link>{' '}
            to start importing activities and health data.
          </p>
        </Card>
      )}

      {connected && editing && widgets && (
        <LayoutEditor
          initialWidgets={widgets}
          onSave={handleSaveLayout}
          onCancel={() => setEditing(false)}
        />
      )}

      {connected && !editing && widgets && (
        <div className="flex flex-wrap gap-4">
          {widgets
            .filter((w) => w.enabled)
            .map((w) => {
              const { label, component: Widget } = WIDGET_REGISTRY[w.widget]
              return (
                <WidgetContainer key={w.id} title={label} width={w.width}>
                  <Widget summary={summary} />
                </WidgetContainer>
              )
            })}
        </div>
      )}
    </div>
  )
}
