import { useEffect, useMemo, useState } from 'react'
import { formatPassageCountdown } from '../domain/headways'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
import aftu84Directions from '../data/aftu-84-directions.json'
import aftu85Directions from '../data/aftu-85-directions.json'
import aftu83Directions from '../data/aftu-83-directions.json'
import { AFTU_STOPS, DDD_STOPS, TATA_STOPS, haversineMeters } from '../domain/corridors'
import type { UserLocation } from './TransitMap'
import { getServiceDisplayState } from '../domain/serviceStatus'
import { NETWORK_REFERENCE_DATA } from '../domain/frequencies'
import {
  AFTU_ESTIMATED_LINE_SCHEDULES,
  DDD_ESTIMATED_LINE_SCHEDULES,
  type EstimatedFrequencyWindow,
  type EstimatedLineSchedule,
} from '../domain/estimatedSchedules'
import {
  AFTU_TATA_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  detailedRouteKey,
} from '../domain/publicBusLineCatalog'

type EstimatedScheduleNetwork = 'ddd' | 'aftu_tata'
type RouteSourceNetwork = 'ddd' | 'aftu' | 'tata'
type DirectionId = 'outbound' | 'inbound'
type MobilityRouteReference = { network: RouteSourceNetwork; code: string; origin?: string; destination?: string; waypoints: string[]; outboundSchedule?: EstimatedLineSchedule | null; inboundWaypoints?: string[]; inboundSchedule?: EstimatedLineSchedule | null; frequency?: { intervalMinutes: number; display: string }; detailSourceUrl: string | null; inboundDetailSourceUrl?: string | null; note: string | null }
const dddPublishedStopsByLine = new Map(DDD_PUBLISHED_ROUTES.map((route) => [route.line, route.stops] as const))

function routeCompleteness(route: MobilityRouteReference): number {
  return route.waypoints.length + (route.inboundWaypoints?.length ?? 0)
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

const AFTU_TATA_NETWORK_REFERENCE: EstimatedLineSchedule = {
  line: '*',
  weekday: { start: '06:00', end: '22:50', interval: '11.6 min' },
  saturday: { start: '06:00', end: '22:50', interval: '11.6 min' },
  sunday: { start: '06:00', end: '22:50', interval: '11.6 min' },
  sourceUrl: 'https://www.iieta.org/journals/ijtdi/paper/10.18280/ijtdi.090108',
  sourceLabel: 'AFTU/TATA · intervalle moyen de référence',
}

const DDD_NETWORK_REFERENCE: EstimatedLineSchedule = {
  line: '*',
  weekday: { start: '05:30', end: '21:00', interval: '10 min' },
  saturday: { start: '05:30', end: '21:00', interval: '10 min' },
  sunday: { start: '06:00', end: '21:00', interval: '12 min' },
  sourceUrl: 'https://demdikk.sn/reseau-urbain-dakar/',
  sourceLabel: 'Dakar Dem Dikk · amplitude générale et intervalle de référence',
}

function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function capAftuTataServiceWindow(window: EstimatedFrequencyWindow | null, network: EstimatedScheduleNetwork): EstimatedFrequencyWindow | null {
  if (!window || network === 'ddd') return window
  const endMinute = parseClock(window.end)
  const maximumEndMinute = 22 * 60 + 50
  // Une fin de ligne connue avant 22:50 est conservée ; aucune ligne AFTU/TATA
  // ne peut afficher un compte à rebours au-delà de la borne générale.
  return endMinute !== null && endMinute > maximumEndMinute
    ? { ...window, end: '22:50' }
    : window
}

function parseInterval(value: string): number | null {
  const match = /^(\d+(?:[.,]\d+)?)\s*min$/i.exec(value.trim())
  if (!match) return null
  const minutes = Number(match[1].replace(',', '.'))
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
}

export function scheduleCountdownMinutes(schedule: EstimatedLineSchedule, now = Date.now()): number | null {
  if (!Number.isFinite(now)) return null
  const weekday = new Date(now).getUTCDay()
  const window: EstimatedFrequencyWindow | null = weekday === 0 ? schedule.sunday : weekday === 6 ? schedule.saturday : schedule.weekday
  if (!window) return null
  const startMinute = parseClock(window.start)
  const endMinute = parseClock(window.end)
  const interval = parseInterval(window.interval)
  if (startMinute === null || endMinute === null || interval === null) return null
  const dayStart = Math.floor(now / DAY_MS) * DAY_MS
  const startAt = dayStart + startMinute * MINUTE_MS
  let endAt = dayStart + endMinute * MINUTE_MS
  if (endAt <= startAt) endAt += DAY_MS
  if (now >= endAt) return null
  const step = interval * MINUTE_MS
  const nextAt = now < startAt ? startAt : startAt + (Math.floor((now - startAt) / step) + 1) * step
  if (nextAt > endAt) return null
  return Math.max(1, Math.ceil((nextAt - now) / MINUTE_MS))
}

export function EstimatedLineScheduleBoard({ network, location = null }: { network: EstimatedScheduleNetwork; location?: UserLocation | null }) {
  const isDdd = network === 'ddd'
  const label = isDdd ? 'DDD' : 'AFTU / TATA'
  const catalogue = isDdd ? DDD_PUBLIC_LINE_CATALOG : AFTU_TATA_PUBLIC_LINE_CATALOG
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const schedulesByLine = useMemo(() => new Map(schedules.map((schedule) => [schedule.line, schedule])), [schedules])
  const [now, setNow] = useState(() => Date.now())
  const [routeReferences, setRouteReferences] = useState<MobilityRouteReference[]>([])
  const [openedDirection, setOpenedDirection] = useState<{ line: string; direction: DirectionId } | null>(null)
  const referenceStops = network === 'ddd' ? DDD_STOPS : [...AFTU_STOPS, ...TATA_STOPS]
  const nearestStop = useMemo(() => {
    if (!location || referenceStops.length === 0) return null
    return referenceStops.reduce((nearest, stop) => {
      const distance = haversineMeters({ lat: location.lat, lon: location.lng }, { lat: stop.lat, lon: stop.lon })
      return !nearest || distance < nearest.distance ? { stop, distance } : nearest
    }, null as { stop: (typeof referenceStops)[number]; distance: number } | null)
  }, [location, referenceStops])

  useEffect(() => {
    let active = true
    Promise.all([
      import('../data/mobility-lines.json'),
      import('../data/tata-lines.json'),
      import('../data/aftu-66-return.json'),
      import('../data/aftu-57-directions.json'),
      import('../data/aftu-30-directions.json'),
      import('../data/aftu-58-directions.json'),
      import('../data/aftu-67-directions.json'),
      import('../data/aftu-62-directions.json'),
      import('../data/aftu-64-directions.json'),
      import('../data/aftu-65-directions.json'),
      import('../data/aftu-75-directions.json'),
      import('../data/aftu-74-directions.json'),
      import('../data/aftu-79-directions.json'),
      import('../data/aftu-80-directions.json'),
      import('../data/aftu-81-directions.json'),
      import('../data/aftu-72-directions.json'),
      import('../data/aftu-73-directions.json'),
      import('../data/aftu-70-directions.json'),
      import('../data/aftu-71-directions.json'),
    ]).then(([mobility, tata, aftu66, aftu57, aftu30, aftu58, aftu67, aftu62, aftu64, aftu65, aftu75, aftu74, aftu79, aftu80, aftu81, aftu72, aftu73, aftu70, aftu71]) => {
      const overrides: Record<string, Partial<MobilityRouteReference>> = {
        '66': aftu66.default as Partial<MobilityRouteReference>,
        '57': aftu57.default as Partial<MobilityRouteReference>,
        '30': aftu30.default as Partial<MobilityRouteReference>,
        '58': aftu58.default as Partial<MobilityRouteReference>,
        '67': aftu67.default as Partial<MobilityRouteReference>,
        '62': aftu62.default as Partial<MobilityRouteReference>,
        '64': aftu64.default as Partial<MobilityRouteReference>,
        '65': aftu65.default as Partial<MobilityRouteReference>,
        '75': aftu75.default as Partial<MobilityRouteReference>,
        '72': aftu72.default as Partial<MobilityRouteReference>,
        '73': aftu73.default as Partial<MobilityRouteReference>,
        '74': aftu74.default as Partial<MobilityRouteReference>,
        '79': aftu79.default as Partial<MobilityRouteReference>,
        '80': aftu80.default as Partial<MobilityRouteReference>,
        '81': aftu81.default as Partial<MobilityRouteReference>,
        '70': aftu70.default as Partial<MobilityRouteReference>,
        '71': aftu71.default as Partial<MobilityRouteReference>,
        '83': aftu83Directions as Partial<MobilityRouteReference>,
        '84': aftu84Directions as Partial<MobilityRouteReference>,
        '85': aftu85Directions as Partial<MobilityRouteReference>,
      }
      if (active) setRouteReferences([
        ...(mobility.default as MobilityRouteReference[]).map((item) => {
          const details = item.network === 'aftu' ? overrides[item.code] : undefined
          return details ? { ...item, ...details } : item
        }),
        ...(tata.default as MobilityRouteReference[]),
      ])
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="station-board" aria-label={`Affichage des lignes ${label}`}>
      <header className="station-board-head"><strong>Lignes {label}</strong></header>
      <ul className="station-board-list">
        {catalogue.map((line) => {
          const lineRouteKey = detailedRouteKey({ code: line.line, origin: line.origin, destination: line.destination })
          const routeCandidates = routeReferences.filter((item) => {
            if (item.code !== line.line) return false
            if (!item.origin || !item.destination) return item.network === line.network
            return detailedRouteKey({ code: item.code, origin: item.origin, destination: item.destination }) === lineRouteKey
          })
          const route = [...routeCandidates].sort((a, b) => routeCompleteness(b) - routeCompleteness(a))[0]
          // Une fréquence AFTU n'est réutilisée que si la fiche détaillée AFTU
          // décrit exactement les mêmes terminus ; un simple numéro commun ne suffit pas.
          const hasMatchingAftuRoute = routeCandidates.some((item) => item.network === 'aftu')
          const lineSchedule = (hasMatchingAftuRoute ? schedulesByLine.get(line.line) : undefined) ?? route?.outboundSchedule
          const schedule = lineSchedule ?? (isDdd ? DDD_NETWORK_REFERENCE : AFTU_TATA_NETWORK_REFERENCE)
          const weekday = new Date(now).getUTCDay()
          const declaredWindow = schedule
            ? weekday === 0 ? schedule.sunday : weekday === 6 ? schedule.saturday : schedule.weekday
            : null
          const hasExplicitNoService = Boolean(lineSchedule && !declaredWindow && lineSchedule.note?.toLowerCase().includes('pas de service'))
          const rawScheduleWindow = declaredWindow ?? (hasExplicitNoService ? null : isDdd ? DDD_NETWORK_REFERENCE.weekday : AFTU_TATA_NETWORK_REFERENCE.weekday)
          const scheduleWindow = capAftuTataServiceWindow(rawScheduleWindow, network)
          const networkReference = NETWORK_REFERENCE_DATA[network]
          const serviceWindow = scheduleWindow ?? (hasExplicitNoService ? null : {
            start: networkReference.serviceStart,
            end: network === 'aftu_tata' ? '22:50' : networkReference.serviceEnd,
            interval: '',
          })
          const serviceState = serviceWindow
            ? getServiceDisplayState(now, serviceWindow.start, serviceWindow.end)
            : { status: 'FINISHED' as const, label: 'Pas de service aujourd’hui', showCountdown: false }
          const lineInterval = route?.frequency?.intervalMinutes ? `${route.frequency.intervalMinutes} min` : route?.frequency?.display
          const countdownWindow = scheduleWindow && lineInterval ? { ...scheduleWindow, interval: lineInterval } : scheduleWindow
          const countdownSchedule = countdownWindow && schedule ? { ...schedule, weekday: countdownWindow, saturday: countdownWindow, sunday: countdownWindow } : null
          const outboundMinutes = countdownSchedule && serviceState.status === 'ACTIVE' ? scheduleCountdownMinutes(countdownSchedule, now) : null
          const inboundSchedule = route?.inboundSchedule ?? null
          const inboundDayWindow = inboundSchedule
            ? weekday === 0 ? inboundSchedule.sunday : weekday === 6 ? inboundSchedule.saturday : inboundSchedule.weekday
            : scheduleWindow
          const inboundHasExplicitNoService = Boolean(inboundSchedule && !inboundDayWindow)
          const inboundServiceWindow = inboundSchedule
            ? inboundDayWindow
            : serviceWindow
          const inboundServiceState = inboundServiceWindow
            ? getServiceDisplayState(now, inboundServiceWindow.start, inboundServiceWindow.end)
            : { status: 'FINISHED' as const, label: 'Pas de service aujourd’hui', showCountdown: false }
          // When a route has a separately documented return stop sequence but no
          // independent return timetable, reuse the line's published frequency
          // window for the return board. This is a frequency-based countdown,
          // not a vehicle-position prediction or a stop-by-stop arrival time.
          const inboundMinutes = inboundServiceState.status === 'ACTIVE'
            ? inboundSchedule
              ? scheduleCountdownMinutes(inboundSchedule, now)
              : (line.network === 'tata' || route?.inboundWaypoints?.length) && countdownSchedule
                ? scheduleCountdownMinutes(countdownSchedule, now)
                : null
            : null
          const directions = [
            { id: 'outbound' as const, label: 'Aller', from: line.origin, to: line.destination, minutes: outboundMinutes, serviceState, serviceWindow, hasExplicitNoService },
            { id: 'inbound' as const, label: 'Retour', from: line.destination, to: line.origin, minutes: inboundMinutes, serviceState: inboundServiceState, serviceWindow: inboundServiceWindow, hasExplicitNoService: inboundHasExplicitNoService },
          ]
          const routeKey = `${line.network}:${line.line}:${line.origin}:${line.destination}`
          return (
            <li key={routeKey} className="station-board-line-group">
              {directions.map((direction) => {
                const selected = openedDirection?.line === routeKey && openedDirection.direction === direction.id
                const publishedStops = direction.id === 'outbound'
                  ? (route?.waypoints?.length ? route.waypoints : network === 'ddd' ? [...(dddPublishedStopsByLine.get(line.line) ?? [])] : [])
                  : (route?.inboundWaypoints?.length ? route.inboundWaypoints : [])
                return (
                  <div key={direction.id} className="station-board-direction-detail">
                    <button type="button" className={`station-board-row station-board-row-static station-board-direction-row station-board-direction-${direction.id} station-board-direction-toggle${selected ? ' is-expanded' : ''}`} aria-expanded={selected} onClick={() => setOpenedDirection(selected ? null : { line: routeKey, direction: direction.id })}>
                      <span className="station-board-stop"><strong>{label} {line.line}</strong><small>{direction.label} · {direction.from} → {direction.to}</small></span>
                      <span className="station-board-direction-action">
                        <span className={`network-summary-passage station-board-passage${direction.minutes === null ? ' is-undeclared' : ''}`} role="status"><strong>{direction.minutes !== null && direction.serviceState.status === 'ACTIVE' && <svg className="station-board-double-apostrophe" viewBox="0 0 16 10" aria-hidden="true" focusable="false"><path d="M4 8 C4.5 6.5 5.5 4.5 7 2" /><path d="M9 8 C9.5 6.5 10.5 4.5 12 2" /></svg>}{direction.serviceState.status === 'UPCOMING' ? direction.serviceState.label : direction.serviceState.status === 'FINISHED' ? (direction.hasExplicitNoService ? 'Pas de service' : network === 'ddd' ? 'Fin de service' : "Service terminé pour aujourd'hui") : direction.minutes === null ? 'En service' : formatPassageCountdown(direction.minutes)}</strong>{direction.serviceState.status !== 'ACTIVE' && <small>{direction.serviceWindow ? `Reprise à ${direction.serviceWindow.start}` : ''}</small>}</span>
                        <span aria-hidden="true">{selected ? '−' : '+'}</span>
                      </span>
                    </button>
                    {selected && (
                      <div className="station-board-itinerary" aria-label={`Itinéraire ${direction.label} ligne ${line.line}`}>
                        {location && nearestStop && <p className="station-board-nearest-stop">Votre position : arrêt de référence le plus proche « {nearestStop.stop.name} », à {nearestStop.distance < 1000 ? `${Math.round(nearestStop.distance)} m` : `${(nearestStop.distance / 1000).toFixed(1)} km`}.</p>}
                        {publishedStops.length > 0 ? (
                          <ol className="station-board-itinerary-list">{publishedStops.map((stop, index) => <li key={`${index}-${stop}`}>{stop}</li>)}</ol>
                        ) : direction.id === 'inbound' ? (
                          <p className="station-board-itinerary-pending">Les arrêts de ce sens ne sont pas encore documentés séparément.</p>
                        ) : (
                          <p className="station-board-itinerary-pending">Le détail des arrêts de cet aller n’est pas encore disponible.</p>
                        )}
                        {(direction.id === 'inbound' ? route?.inboundDetailSourceUrl ?? route?.detailSourceUrl : route?.detailSourceUrl) && <a className="station-board-itinerary-source" href={(direction.id === 'inbound' ? route?.inboundDetailSourceUrl ?? route?.detailSourceUrl : route?.detailSourceUrl)!} target="_blank" rel="noreferrer">Consulter la fiche de l’itinéraire</a>}
                      </div>
                    )}
                  </div>
                )
              })}
            </li>
          )
        })}
      </ul>
      {(() => {
        const linesWithoutAnyStops = catalogue.filter((line) => {
          const route = routeReferences.find((item) => item.network === network && item.code === line.line)
          const hasOutbound = Boolean(route?.waypoints?.length)
            || (network === 'ddd' && Boolean(dddPublishedStopsByLine.get(line.line)?.length))
          return !hasOutbound
        })
        return linesWithoutAnyStops.length > 0 ? (
          <div className="station-board-itinerary-pending station-board-pending-group">
            <strong>Arrêts Aller et Retour à compléter</strong>
            <p>{linesWithoutAnyStops.map((line) => line.line).join(' · ')}</p>
          </div>
        ) : null
      })()}
    </section>
  )
}
