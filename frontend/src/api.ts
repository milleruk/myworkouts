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
