import { Link } from 'react-router-dom'
import type { Me } from '../api'
import { Card } from '../components/Card'

export function Dashboard({ me }: { me: Me }) {
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Not connected yet.{' '}
            <Link to="/garmin-account" className="text-blue-600 hover:underline dark:text-blue-400">
              Connect your account
            </Link>{' '}
            to start importing activities and health data.
          </p>
        </Card>
        <Card title="Activities">
          <p className="text-sm text-slate-500 dark:text-slate-400">No activities imported yet.</p>
        </Card>
        <Card title="Last sync">
          <p className="text-sm text-slate-500 dark:text-slate-400">Never synced.</p>
        </Card>
      </div>
    </div>
  )
}
