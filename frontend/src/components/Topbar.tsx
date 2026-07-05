import { ThemeToggle } from './ThemeToggle'
import type { Me } from '../api'

export function Topbar({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-sm text-slate-500 dark:text-slate-400">{me.email}</span>
      <ThemeToggle />
      <button
        type="button"
        onClick={onLogout}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Log out
      </button>
    </header>
  )
}
