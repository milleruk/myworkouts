import { useState, type FormEvent } from 'react'
import { login, register } from '../api'
import { ThemeToggle } from './ThemeToggle'

export function AuthForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email, password)
      }
      await login(email, password)
      onAuthenticated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white">
            G
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Garmin Stats</h1>
        </div>
        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
