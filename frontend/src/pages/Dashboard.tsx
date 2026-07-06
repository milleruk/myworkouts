import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getActivityCount,
  getGarminAccount,
  type GarminAccount,
  type Me,
} from '../api'
import { Card } from '../components/Card'

export function Dashboard({ me }: { me: Me }) {
  const [account, setAccount] = useState<GarminAccount | null>(null)
  const [activityCount, setActivityCount] = useState<number | null>(null)

  useEffect(() => {
    getGarminAccount()
      .then(setAccount)
      .catch(() => setAccount({ status: 'not_connected' }))
    getActivityCount()
      .then(setActivityCount)
      .catch(() => setActivityCount(null))
  }, [])

  const connected = account && account.status !== 'not_connected'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Welcome back{me.first_name ? `, ${me.first_name}` : ''}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here's what's happening with your data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Garmin account">
          {connected ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Connected as <span className="font-medium text-slate-900 dark:text-slate-100">{account.garmin_email}</span>
              {' '}
              <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                ({account.status.replace('_', ' ')})
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Not connected yet.{' '}
              <Link to="/garmin-account" className="text-blue-600 hover:underline dark:text-blue-400">
                Connect your account
              </Link>{' '}
              to start importing activities and health data.
            </p>
          )}
        </Card>
        <Card title="Activities">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activityCount === null
              ? 'No activities imported yet.'
              : `${activityCount.toLocaleString()} activities imported.`}
          </p>
        </Card>
        <Card title="Last sync">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {account?.last_synced_at
              ? new Date(account.last_synced_at).toLocaleString()
              : 'Never synced.'}
          </p>
        </Card>
      </div>
    </div>
  )
}
