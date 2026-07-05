import { Outlet } from 'react-router-dom'
import type { Me } from '../api'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar me={me} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
