const API_BASE = '/api/v1'

let accessToken: string | null = localStorage.getItem('access_token')
let refreshToken: string | null = localStorage.getItem('refresh_token')

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access
  refreshToken = refresh
  if (access) localStorage.setItem('access_token', access)
  else localStorage.removeItem('access_token')
  if (refresh) localStorage.setItem('refresh_token', refresh)
  else localStorage.removeItem('refresh_token')
}

export function isAuthenticated() {
  return Boolean(accessToken)
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false
  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  })
  if (!res.ok) return false
  const data = await res.json()
  setTokens(data.access, refreshToken)
  return true
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    })

  let res = await doFetch()
  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) res = await doFetch()
  }
  return res
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid email or password')
  const data = await res.json()
  setTokens(data.access, data.refresh)
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(JSON.stringify(data))
  }
}

export function logout() {
  setTokens(null, null)
}

export interface Me {
  id: number
  email: string
  first_name: string
  last_name: string
  profile: {
    timezone: string
    unit_system: string
    date_of_birth: string | null
    sex: string | null
  }
}

export async function getMe(): Promise<Me> {
  const res = await apiFetch('/me/')
  if (!res.ok) throw new Error('Failed to load profile')
  return res.json()
}

export type GarminAccountStatus = 'not_connected' | 'connected' | 'needs_mfa' | 'needs_reauth' | 'error'

export interface GarminAccount {
  status: GarminAccountStatus
  garmin_email?: string
  display_name?: string
  last_synced_at?: string | null
  last_error?: string
}

export interface ConnectResult {
  status: 'connected' | 'mfa_required' | 'error'
  pending_login_id?: string
  message?: string
}

export async function getGarminAccount(): Promise<GarminAccount> {
  const res = await apiFetch('/garmin-account/')
  if (!res.ok) throw new Error('Failed to load Garmin account status')
  return res.json()
}

export async function connectGarmin(garmin_email: string, garmin_password: string): Promise<ConnectResult> {
  const res = await apiFetch('/garmin-account/connect/', {
    method: 'POST',
    body: JSON.stringify({ garmin_email, garmin_password }),
  })
  if (!res.ok && res.status !== 504) throw new Error('Failed to connect to Garmin')
  return res.json()
}

export async function verifyMfa(pending_login_id: string, mfa_code: string): Promise<ConnectResult> {
  const res = await apiFetch('/garmin-account/verify-mfa/', {
    method: 'POST',
    body: JSON.stringify({ pending_login_id, mfa_code }),
  })
  if (!res.ok && res.status !== 504) throw new Error('Failed to verify MFA code')
  return res.json()
}

export async function disconnectGarmin(): Promise<void> {
  const res = await apiFetch('/garmin-account/', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to disconnect Garmin account')
}

export async function syncNow(): Promise<void> {
  const res = await apiFetch('/garmin-account/sync/', { method: 'POST' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message ?? 'Failed to start sync')
  }
}

export interface SyncLog {
  id: number
  task_type: string
  started_at: string
  finished_at: string | null
  status: string
  records_imported: number
  error_message: string
}

export async function getSyncLogs(): Promise<SyncLog[]> {
  const res = await apiFetch('/garmin-account/sync-logs/')
  if (!res.ok) throw new Error('Failed to load sync logs')
  const data = await res.json()
  return data.results ?? data
}

export async function getActivityCount(): Promise<number> {
  const res = await apiFetch('/activities/')
  if (!res.ok) throw new Error('Failed to load activities')
  const data = await res.json()
  return data.count ?? (Array.isArray(data) ? data.length : 0)
}

export interface Activity {
  id: number
  garmin_activity_id: number
  activity_type: string
  name: string
  start_time_local: string
  duration_seconds: number | null
  distance_m: number | null
  elevation_gain_m: number | null
  average_hr: number | null
  max_hr: number | null
  calories: number | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getActivities(page = 1): Promise<Paginated<Activity>> {
  const res = await apiFetch(`/activities/?page=${page}`)
  if (!res.ok) throw new Error('Failed to load activities')
  return res.json()
}

export interface GearItem {
  id: number
  name: string
  gear_type: string
  is_retired: boolean
  total_distance_m: number
  total_duration_seconds: number
}

export async function getGear(): Promise<GearItem[]> {
  const res = await apiFetch('/gear/')
  if (!res.ok) throw new Error('Failed to load gear')
  const data = await res.json()
  return data.results ?? data
}

export interface ActivityDetail extends Activity {
  raw_summary: Record<string, unknown>
}

export async function getActivity(id: number): Promise<ActivityDetail> {
  const res = await apiFetch(`/activities/${id}/`)
  if (!res.ok) throw new Error('Failed to load activity')
  return res.json()
}

export async function getGearItem(id: number): Promise<GearItem> {
  const res = await apiFetch(`/gear/${id}/`)
  if (!res.ok) throw new Error('Failed to load gear item')
  return res.json()
}

export interface GearMaintenanceEntry {
  id: number
  description: string
  performed_at: string
  distance_at_service_m: number | null
  notes: string
}

export async function getGearMaintenance(gearId: number): Promise<GearMaintenanceEntry[]> {
  const res = await apiFetch(`/gear/${gearId}/maintenance/`)
  if (!res.ok) throw new Error('Failed to load maintenance history')
  const data = await res.json()
  return data.results ?? data
}

export async function createGearMaintenanceEntry(
  gearId: number,
  entry: { description: string; performed_at: string; distance_at_service_m?: number | null; notes?: string },
): Promise<GearMaintenanceEntry> {
  const res = await apiFetch(`/gear/${gearId}/maintenance/`, {
    method: 'POST',
    body: JSON.stringify(entry),
  })
  if (!res.ok) throw new Error('Failed to add maintenance entry')
  return res.json()
}

// --- Dashboard: layout + computed-stat summary ---

export type WidgetKey =
  | 'eddington_number'
  | 'streaks'
  | 'weekly_stats'
  | 'monthly_stats'
  | 'yearly_stats'
  | 'activity_heatmap'
  | 'training_load'
  | 'gear_totals'

export interface WidgetConfig {
  id: string
  widget: WidgetKey
  width: 33 | 50 | 66 | 100
  enabled: boolean
  config: Record<string, unknown>
}

export async function getDashboardLayout(): Promise<WidgetConfig[]> {
  const res = await apiFetch('/dashboard/layout/')
  if (!res.ok) throw new Error('Failed to load dashboard layout')
  const data = await res.json()
  return data.widgets
}

export async function updateDashboardLayout(widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  const res = await apiFetch('/dashboard/layout/', {
    method: 'PUT',
    body: JSON.stringify({ widgets }),
  })
  if (!res.ok) throw new Error('Failed to save dashboard layout')
  const data = await res.json()
  return data.widgets
}

export interface EddingtonGroup {
  number: number
  unit: string
  activities_counted: number
  curve: { distance_km: number; count_at_least: number }[]
}

export interface StreaksStat {
  current_streak_days: number
  current_streak_start: string | null
  longest_streak_days: number
  longest_streak_start: string | null
  longest_streak_end: string | null
  last_activity_date: string | null
}

export interface PeriodStat {
  period: string
  distance_m: number
  duration_seconds: number
  elevation_gain_m: number
  activity_count: number
  calories: number
}

export interface ActivityHighlight {
  id: number
  name: string
  activity_type: string
  start_time_local: string
  distance_m: number | null
  duration_seconds: number | null
  elevation_gain_m: number | null
}

export interface YearlyStat {
  year: number
  distance_m: number
  duration_seconds: number
  elevation_gain_m: number
  activity_count: number
  calories: number
  active_days: number
  highlights: {
    longest_duration_activity: ActivityHighlight | null
    most_elevation_gain_activity: ActivityHighlight | null
    longest_distance_activity: ActivityHighlight | null
  }
}

export interface HeatmapDay {
  date: string
  count: number
  duration_minutes: number
}

export interface TrainingLoadPoint {
  date: string
  acute_hours: number
  chronic_hours: number
  acwr: number | null
}

export interface DashboardSummary {
  eddington_number?: Record<string, EddingtonGroup>
  streaks?: { all: StreaksStat }
  weekly_stats?: { current: { periods: PeriodStat[] } }
  monthly_stats?: { current: { periods: PeriodStat[] } }
  yearly_stats?: Record<string, YearlyStat>
  activity_heatmap?: { last_365: { start_date: string; end_date: string; days: HeatmapDay[] } }
  training_load?: {
    current: { points: TrainingLoadPoint[]; latest_acwr: number | null; status: string }
  }
  _meta: { computed_at: Record<string, string> }
}

export async function getDashboardSummary(keys: string[]): Promise<DashboardSummary> {
  const res = await apiFetch(`/dashboard/summary/?stats=${keys.join(',')}`)
  if (!res.ok) throw new Error('Failed to load dashboard summary')
  return res.json()
}

export async function recomputeStats(): Promise<void> {
  const res = await apiFetch('/dashboard/recompute/', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to trigger recompute')
}
