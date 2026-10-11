/** Une donnée trafic ne survit jamais plus d'une heure sans nouvelle preuve. */
export const TRAFFIC_REFRESH_INTERVAL_MS = 60 * 60_000
export const TRAFFIC_ALERT_TTL_MS = TRAFFIC_REFRESH_INTERVAL_MS

/** Horodatage explicite, avec fuseau : aucune date locale ambiguë. */
export function trafficInstant(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!parts) return null
  const [, year, month, day, hour, minute, second] = parts.map(Number)
  const calendar = new Date(0)
  calendar.setUTCFullYear(year, month - 1, day)
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null
  if (hour > 23 || minute > 59 || second > 59) return null
  const instant = Date.parse(value)
  return Number.isFinite(instant) ? instant : null
}

/** À exactement une heure, la donnée est déjà périmée. Le futur est refusé. */
export function isFreshTrafficInstant(value: unknown, now = Date.now()): boolean {
  const instant = trafficInstant(value)
  return instant !== null && Number.isFinite(now) && instant <= now && now - instant < TRAFFIC_ALERT_TTL_MS
}
