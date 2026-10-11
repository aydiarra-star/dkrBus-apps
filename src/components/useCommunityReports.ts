import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchCommunitySnapshot, publishCommunityReport, removeCommunityReport, readCommunityOwnership,
  pruneCommunityOwnership, writeCommunityOwnership, type CommunityOwnership, type CommunitySnapshot,
} from '../domain/communityFeed'
import { isFreshTrafficInstant, TRAFFIC_REFRESH_INTERVAL_MS, trafficInstant, TRAFFIC_ALERT_TTL_MS } from '../domain/trafficFreshness'
import { isReportExpired, type StreetReportDraft } from '../domain/streetReports'
import { nextCommunityExpiry } from '../domain/communityTraffic'

function localStorageOrNull(): Storage | null {
  try { return window.localStorage } catch { return null }
}

/** Real shared reports when the API is reachable; no silent cached-peer fallback. */
export function useCommunityReports() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const [ownership, setOwnership] = useState<CommunityOwnership>(() => readCommunityOwnership(localStorageOrNull()))
  const ownerRef = useRef(ownership)
  const mounted = useRef(false)
  const sequence = useRef(0)
  const revision = useRef(0)
  const lastRequestAt = useRef(-Infinity)
  const controller = useRef<AbortController | null>(null)
  const mutations = useRef(new Set<AbortController>())
  ownerRef.current = ownership

  const refresh = useCallback(async () => {
    if (!mounted.current) return
    const id = ++sequence.current, version = revision.current
    controller.current?.abort()
    const aborter = new AbortController()
    controller.current = aborter
    lastRequestAt.current = Date.now()
    setClock(Date.now())
    // A still-fresh snapshot may stay visible DURING the read, not after failure.
    setSnapshot((current) => current && isFreshTrafficInstant(current.generatedAt) ? current : null)
    try {
      const result = await fetchCommunitySnapshot({ signal: aborter.signal })
      if (mounted.current && id === sequence.current && version === revision.current && !aborter.signal.aborted) {
        setSnapshot(result)
        setClock(Date.now())
      }
    } catch {
      if (mounted.current && id === sequence.current && version === revision.current) setSnapshot(null)
    } finally {
      if (id === sequence.current) controller.current = null
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void refresh()
    const hourly = window.setInterval(() => { void refresh() }, TRAFFIC_REFRESH_INTERVAL_MS)
    const resume = () => {
      const now = Date.now()
      setClock(now)
      setSnapshot((current) => current && isFreshTrafficInstant(current.generatedAt, now) ? current : null)
      if (document.visibilityState !== 'hidden' && now - lastRequestAt.current >= 1000) void refresh()
    }
    const offline = () => {
      ++sequence.current
      controller.current?.abort()
      controller.current = null
      lastRequestAt.current = -Infinity
      setSnapshot(null)
      setClock(Date.now())
    }
    window.addEventListener('offline', offline)
    for (const event of ['online', 'pageshow', 'focus']) window.addEventListener(event, resume)
    document.addEventListener('visibilitychange', resume)
    return () => {
      mounted.current = false
      ++sequence.current
      controller.current?.abort()
      for (const mutation of mutations.current) mutation.abort()
      mutations.current.clear()
      window.clearInterval(hourly)
      window.removeEventListener('offline', offline)
      for (const event of ['online', 'pageshow', 'focus']) window.removeEventListener(event, resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [refresh])

  const now = Math.max(clock, Date.now())
  const current = snapshot && isFreshTrafficInstant(snapshot.generatedAt, now) ? snapshot : null
  const liveOwnership = pruneCommunityOwnership(ownership, now)
  const reports = current?.reports.filter((report) => !isReportExpired(report, now))
    .map((report) => ({ ...report, canRemove: Boolean(liveOwnership[report.id]) })) ?? []

  useEffect(() => {
    const sourceExpiry = snapshot ? trafficInstant(snapshot.generatedAt)! + TRAFFIC_ALERT_TTL_MS : null
    const reportExpiry = nextCommunityExpiry(snapshot?.reports ?? [], now)
    const ownerExpiry = Object.values(ownership).map((entry) => trafficInstant(entry.expiresAt)).filter((at): at is number => at !== null && at > now)
    const values = [sourceExpiry, reportExpiry, ...ownerExpiry].filter((at): at is number => at !== null && at > now)
    if (!values.length) return
    const timer = window.setTimeout(() => {
      setClock(Date.now())
      setOwnership((value) => pruneCommunityOwnership(value))
    }, Math.max(0, Math.min(...values) - Date.now()))
    return () => window.clearTimeout(timer)
  }, [snapshot, ownership, now])

  useEffect(() => { writeCommunityOwnership(localStorageOrNull(), ownership) }, [ownership])
  useEffect(() => {
    const sync = () => setOwnership(readCommunityOwnership(localStorageOrNull()))
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const publish = useCallback(async (draft: StreetReportDraft, stillWanted: () => boolean = () => true) => {
    const aborter = new AbortController()
    mutations.current.add(aborter)
    ++revision.current // An in-flight GET must not overwrite this mutation.
    try {
      const result = await publishCommunityReport(draft, { signal: aborter.signal })
      if (!mounted.current || aborter.signal.aborted) throw new Error('Publication interrompue.')
      ++revision.current
      const owners = { ...pruneCommunityOwnership(ownerRef.current),
        [result.report.id]: { deleteKey: result.deleteKey, expiresAt: result.report.expiresAt } }
      ownerRef.current = owners
      setOwnership(owners)
      writeCommunityOwnership(localStorageOrNull(), owners)
      if (!stillWanted()) {
        // A local withdrawal while POST was pending must not resurrect the
        // report when its late response arrives. Keep the owner receipt if
        // withdrawal cannot be confirmed, so it can be retried later.
        await removeCommunityReport(result.report.id, result.deleteKey, { signal: aborter.signal })
        if (!mounted.current || aborter.signal.aborted) return null
        const kept = { ...ownerRef.current }
        delete kept[result.report.id]
        ownerRef.current = kept
        setOwnership(kept)
        writeCommunityOwnership(localStorageOrNull(), kept)
        ++revision.current
        setSnapshot((previous) => previous && ({ ...previous, reports: previous.reports.filter((report) => report.id !== result.report.id) }))
        void refresh()
        return null
      }
      setSnapshot((previous) => ({ generatedAt: previous && isFreshTrafficInstant(previous.generatedAt) ? previous.generatedAt : result.report.createdAt,
        reports: [result.report, ...(previous && isFreshTrafficInstant(previous.generatedAt) ? previous.reports.filter((report) => report.id !== result.report.id) : [])] }))
      setClock(Date.now())
      // The response contains fresh server-assigned dates for this report;
      // a subsequent GET validates the rest of the shared pool.
      void refresh()
      return result.report
    } finally {
      mutations.current.delete(aborter)
    }
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const own = pruneCommunityOwnership(ownerRef.current)[id]
    if (!own) throw new Error('Seul l’auteur peut retirer ce signalement.')
    const aborter = new AbortController()
    mutations.current.add(aborter)
    ++revision.current
    try {
      await removeCommunityReport(id, own.deleteKey, { signal: aborter.signal })
      if (!mounted.current || aborter.signal.aborted) return
      ++revision.current
      const owners = { ...ownerRef.current }
      delete owners[id]
      ownerRef.current = owners
      setOwnership(owners)
      setSnapshot((previous) => previous && ({ ...previous, reports: previous.reports.filter((report) => report.id !== id) }))
      setClock(Date.now())
    } finally {
      mutations.current.delete(aborter)
    }
  }, [])

  return { reports, sharingAvailable: current !== null, now, refresh, publish, remove }
}
