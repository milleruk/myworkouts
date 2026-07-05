import type { Me } from '../api'
import { Card } from '../components/Card'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  )
}

export function Settings({ me }: { me: Me }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
      <Card title="Profile">
        <Row label="Email" value={me.email} />
        <Row label="Timezone" value={me.profile.timezone} />
        <Row label="Unit system" value={me.profile.unit_system} />
      </Card>
    </div>
  )
}
