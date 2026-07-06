import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavItemProps {
  to: string
  label: string
  icon: ReactNode
}

function NavItem({ to, label, icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`
      }
    >
      <span className="size-5 shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  activities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l4-6 4 3 4-8 4 5" />
      <circle cx="4" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="20" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 8.5l-8-5-8 5v7l8 5 8-5v-7z" />
      <circle cx="12.5" cy="12" r="3" />
    </svg>
  ),
  garmin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M4 11h16M6 7h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
    </svg>
  ),
  rewind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M20 19l-7-7 7-7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  ),
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          G
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Garmin Stats</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        <NavItem to="/" label="Dashboard" icon={icons.dashboard} />
        <NavItem to="/activities" label="Activities" icon={icons.activities} />
        <NavItem to="/gear" label="Gear" icon={icons.gear} />
        <NavItem to="/rewind" label="Rewind" icon={icons.rewind} />
        <NavItem to="/garmin-account" label="Garmin Account" icon={icons.garmin} />
        <NavItem to="/settings" label="Settings" icon={icons.settings} />
      </nav>
    </aside>
  )
}
