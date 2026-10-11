import { useCallback, useEffect, useRef, useState } from 'react'
import { haversineMeters } from '../domain/corridors'
import {
  expireTrafficSnapshot, fetchTrafficSnapshot, nextTrafficExpiry, trafficSummaryContext,
  type TrafficRequestStatus, type TrafficSnapshot,
} from '../domain/trafficFeed'
import { TRAFFIC_REFRESH_INTERVAL_MS } from '../domain/trafficFreshness'

const MIN_GPS_REFRESH_MS = 30_000
const GPS_MOVEMENT_M = 80

interface TrafficState {
  snapshot: TrafficSnapshot | null
  requestStatus: TrafficRequestStatus
  now: number
}

/**
 * Une seule horloge, indépendante de l'onglet et des horaires de transport.
 * Téléchargement au démarrage puis toutes les heures, ainsi qu'au retour de
 * veille/réseau et après déplacement GPS. Les dates des incidents ne sont
 * jamais rajeunies. Une réponse tardive ne remplace pas une réponse récente.
 */
export function useTrafficAlerts(
  location: { lat: number; lng: number } | null,
  onRefreshGps?: () => void,
) {
  const [state, setState] = useState<TrafficState>(() => ({ snapshot: null, requestStatus: 'loading', now: Date.now() }))
  const mounted = useRef(false)
  const requestId = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const locationRef = useRef(location)
  const gpsRef = useRef(onRefreshGps)
  const lastRequestAt = useRef(-Infinity)
  const lastRequestedLocation = useRef(location)
  locationRef.current = location
  gpsRef.current = onRefreshGps

  const refresh = useCallback(async (refreshGps = false) => {
    if (!mounted.current) return
    if (refreshGps) gpsRef.current?.()
    const id = ++requestId.current
    controller.current?.abort()
    const aborter = new AbortController()
    controller.current = aborter
    const point = locationRef.current
    lastRequestedLocation.current = point
    lastRequestAt.current = Date.now()
    setState((current) => ({ snapshot: expireTrafficSnapshot(current.snapshot), requestStatus: 'loading', now: Date.now() }))
    try {
      const snapshot = await fetchTrafficSnapshot(point, { signal: aborter.signal })
      if (!mounted.current || id !== requestId.current || aborter.signal.aborted) return
      setState({ snapshot, requestStatus: 'ready', now: Date.now() })
    } catch {
      if (!mounted.current || id !== requestId.current) return
      // Aucune réponse "dernière connue" en cas d'échec : elle n'est plus
      // une vérification des conditions actuelles.
      setState({ snapshot: null, requestStatus: 'unavailable', now: Date.now() })
    } finally {
      if (id === requestId.current) controller.current = null
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void refresh()
    const hourly = window.setInterval(() => { void refresh(true) }, TRAFFIC_REFRESH_INTERVAL_MS)
    const resume = () => {
      const now = Date.now()
      setState((current) => ({ ...current, snapshot: expireTrafficSnapshot(current.snapshot, now), now }))
      // visibilitychange/pageshow/focus peuvent décrire le même réveil.
      if (document.visibilityState !== 'hidden' && now - lastRequestAt.current >= 1000) void refresh(true)
    }
    const offline = () => {
      requestId.current += 1
      controller.current?.abort()
      controller.current = null
      lastRequestAt.current = -Infinity
      setState({ snapshot: null, requestStatus: 'unavailable', now: Date.now() })
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pageshow', resume)
    window.addEventListener('focus', resume)
    window.addEventListener('online', resume)
    window.addEventListener('offline', offline)
    return () => {
      mounted.current = false
      requestId.current += 1
      controller.current?.abort()
      controller.current = null
      window.clearInterval(hourly)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pageshow', resume)
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('offline', offline)
    }
  }, [refresh])

  useEffect(() => {
    const previous = lastRequestedLocation.current
    if (!location && !previous) return
    if (location && previous && haversineMeters(
      { lat: location.lat, lon: location.lng }, { lat: previous.lat, lon: previous.lng },
    ) < GPS_MOVEMENT_M) return
    if (!location || !previous || Date.now() - lastRequestAt.current >= MIN_GPS_REFRESH_MS) {
      void refresh()
      return
    }
    // Regroupe les positions fréquentes, sans perdre la dernière position.
    const timer = window.setTimeout(() => { void refresh() }, MIN_GPS_REFRESH_MS - (Date.now() - lastRequestAt.current))
    return () => window.clearTimeout(timer)
  }, [location?.lat, location?.lng, refresh])

  useEffect(() => {
    const deadline = nextTrafficExpiry(state.snapshot, state.now)
    if (deadline === null) return
    const timer = window.setTimeout(() => {
      const now = Date.now()
      setState((current) => ({ ...current, snapshot: expireTrafficSnapshot(current.snapshot, now), now }))
    }, Math.max(0, deadline - Date.now()))
    return () => window.clearTimeout(timer)
  }, [state.snapshot, state.now])

  // Filtre aussi au rendu : après suspension d'un onglet, aucun ancien incident
  // ne doit réapparaître avant l'exécution de l'effet de reprise.
  const now = Math.max(state.now, Date.now())
  const snapshot = expireTrafficSnapshot(state.snapshot, now)
  return { snapshot, now, summaryContext: trafficSummaryContext(snapshot, state.requestStatus, now), refresh }
}
