import { useEffect, useState, type FormEvent } from 'react'
import {
  connectGarmin,
  disconnectGarmin,
  getGarminAccount,
  getSyncLogs,
  syncNow,
  verifyMfa,
  type GarminAccount as GarminAccountData,
  type SyncLog,
} from '../api'
import { Card } from '../components/Card'

const inputClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
const primaryButtonClass =
  'rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60'
const secondaryButtonClass =
  'rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'

function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingLoginId, setPendingLoginId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submitCredentials = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await connectGarmin(email, password)
      if (result.status === 'connected') {
        onConnected()
      } else if (result.status === 'mfa_required' && result.pending_login_id) {
        setPendingLoginId(result.pending_login_id)
      } else {
        setError(result.message ?? 'Failed to connect to Garmin.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const submitMfa = async (e: FormEvent) => {
    e.preventDefault()
    if (!pendingLoginId) return
    setError(null)
    setBusy(true)
    try {
      const result = await verifyMfa(pendingLoginId, mfaCode)
      if (result.status === 'connected') {
        onConnected()
      } else {
        setError(result.message ?? 'Failed to verify MFA code.')
        setPendingLoginId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (pendingLoginId) {
    return (
      <form onSubmit={submitMfa} className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Garmin sent a verification code to your account. Enter it below to finish connecting.
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mfa" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Verification code
          </label>
          <input
            id="mfa"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className={inputClass}
            autoFocus
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            Verify
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setPendingLoginId(null)
              setMfaCode('')
              setError(null)
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submitCredentials} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="garmin-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Garmin Connect email
        </label>
        <input
          id="garmin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="garmin-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Garmin Connect password
        </label>
        <input
          id="garmin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Your password is encrypted at rest and only used to talk to Garmin Connect on your behalf.
      </p>
      <button type="submit" disabled={busy} className={`${primaryButtonClass} self-start`}>
        {busy ? 'Connecting…' : 'Connect account'}
      </button>
    </form>
  )
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    connected: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400',
    needs_reauth: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function ConnectedPanel({
  account,
  onDisconnected,
}: {
  account: GarminAccountData
  onDisconnected: () => void
}) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadLogs = () => {
    getSyncLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
  }

  useEffect(loadLogs, [])

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      await syncNow()
      setMessage('Sync started — check back in a moment.')
      setTimeout(loadLogs, 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to start sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnectGarmin()
    onDisconnected()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Garmin account">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">{account.garmin_email}</span>
            {statusBadge(account.status)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Last synced:{' '}
            {account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : 'Never'}
          </div>
          {account.status === 'needs_reauth' && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Garmin requires you to reconnect (this can happen after a password change or long
              period of inactivity).
            </p>
          )}
          {message && <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || account.status !== 'connected'}
              className={primaryButtonClass}
            >
              {syncing ? 'Starting…' : 'Sync now'}
            </button>
            <button type="button" onClick={handleDisconnect} className={secondaryButtonClass}>
              Disconnect
            </button>
          </div>
        </div>
      </Card>

      <Card title="Recent syncs">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No syncs yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {log.task_type}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(log.started_at).toLocaleString()} · {log.records_imported} imported
                  </div>
                </div>
                {statusBadge(log.status)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export function GarminAccount() {
  const [account, setAccount] = useState<GarminAccountData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getGarminAccount()
      .then(setAccount)
      .catch(() => setAccount({ status: 'not_connected' }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Garmin Account</h1>
      {loading ? null : account && account.status !== 'not_connected' && account.status !== 'error' ? (
        <ConnectedPanel account={account} onDisconnected={load} />
      ) : (
        <Card title="Connect your Garmin account">
          {account?.status === 'error' && account.last_error && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{account.last_error}</p>
          )}
          <ConnectForm onConnected={load} />
        </Card>
      )}
    </div>
  )
}
