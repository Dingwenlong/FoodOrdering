export function envBool(key: string, defaultValue: boolean): boolean {
  const raw = (import.meta.env as Record<string, unknown>)[key]
  if (raw === undefined || raw === null) return defaultValue
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase()
    if (v === 'true' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === '0' || v === 'no') return false
  }
  return defaultValue
}
