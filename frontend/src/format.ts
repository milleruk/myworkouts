export function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatDistance(meters: number | null) {
  if (!meters) return '—'
  return `${(meters / 1000).toFixed(2)} km`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
