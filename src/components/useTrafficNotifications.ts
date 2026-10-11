import { useEffect, useRef, useState } from 'react'
import { alertExpiresAt, isActiveTrafficAlert, relevantAlerts, type RankedAlert } from '../domain/trafficAlerts'
import { rankStreetReports, relevantStreetReports, type RankedStreetReport } from '../domain/communityTraffic'
import { reportKindLabel, streetReportExpiresAt } from '../domain/streetReports'

export interface TrafficNotice { key: string; message: string; deadline: number }

export function trafficNotices(official: readonly RankedAlert[], community: readonly RankedStreetReport[],
  location: { lat: number; lng: number } | null, now = Date.now()): TrafficNotice[] {
  const confirmed = relevantAlerts(official.filter(({ alert }) => isActiveTrafficAlert(alert, now)), location)
    .map(({ alert }) => ({ key: `official:${alert.id}:${alert.updatedAt}:${alert.confirmedAt}`,
      message: `Alerte confirmée · ${alert.headlineFr}`, deadline: alertExpiresAt(alert)! }))
  const reported = relevantStreetReports(rankStreetReports(community.map(({ report }) => report), location, now), location)
    .map(({ report }) => ({ key: `community:${report.id}:${report.createdAt}`,
      message: `Direct rue · ${reportKindLabel(report.kind)} · ${report.place} · témoignage non vérifié`,
      deadline: streetReportExpiresAt(report)! }))
  return [...confirmed, ...reported].filter((entry) => entry.deadline > now)
}

/** Hourly source refresh drives notifications; never a second/stale alert store.
 * In-app notice reuses the existing toast. Browser notifications are optional
 * and ONLY used if permission is ALREADY granted: no unsolicited permission box.
 */
export function useTrafficNotifications(official: readonly RankedAlert[], community: readonly RankedStreetReport[],
  location: { lat: number; lng: number } | null, now: number) {
  const [notice, setNotice] = useState<(TrafficNotice & { displayUntil: number }) | null>(null)
  const [tick, setTick] = useState(0)
  const seen = useRef(new Map<string, number>())
  const native = useRef(new Map<string, { notification: Notification; deadline: number }>())
  const active = trafficNotices(official, community, location, Math.max(now, Date.now()))
  const signature = JSON.stringify(active)

  useEffect(() => {
    const at = Date.now()
    const valid = new Map(active.filter((item) => item.deadline > at).map((item) => [item.key, item]))
    for (const [key, item] of native.current) {
      if (!valid.has(key) || item.deadline > valid.get(key)!.deadline || item.deadline <= at) {
        try { item.notification.close() } catch { /* platform refusal */ }
        native.current.delete(key)
      }
    }
    for (const [key, deadline] of seen.current) if (deadline <= at) seen.current.delete(key)
    const fresh = [...valid.values()].filter((item) => !seen.current.has(item.key))
    if (fresh.length) setNotice({ ...fresh[0], displayUntil: Math.min(fresh[0].deadline, at + 3600) })
    for (const [index, item] of fresh.entries()) {
      seen.current.set(item.key, item.deadline)
      if (index < 3 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const notification = new Notification('DakarBus · Alertes', { body: item.message, tag: item.key, silent: true })
          native.current.set(item.key, { notification, deadline: item.deadline })
        } catch { /* mobile/Safari may require a push registration; in-app remains usable */ }
      }
    }
    // Expire even between network reads and even when no other countdown runs.
    const deadlines = [...valid.values()].map((item) => item.deadline)
    if (fresh.length) deadlines.push(Math.min(fresh[0].deadline, at + 3600))
    if (!deadlines.length) return
    const timer = window.setTimeout(() => setTick((value) => value + 1), Math.max(0, Math.min(...deadlines) - at))
    return () => window.clearTimeout(timer)
    // active is fully represented in signature; avoid resetting on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, tick])

  useEffect(() => () => {
    for (const item of native.current.values()) {
      try { item.notification.close() } catch { /* platform refusal */ }
    }
    native.current.clear()
  }, [])

  const current = notice && notice.displayUntil > Date.now() ? active.find((item) => item.key === notice.key && item.deadline > Date.now()) ?? null : null
  return { notice: current, dismiss: () => {
    if (notice) {
      try { native.current.get(notice.key)?.notification.close() } catch { /* platform refusal */ }
      native.current.delete(notice.key)
    }
    setNotice(null)
  } }
}
