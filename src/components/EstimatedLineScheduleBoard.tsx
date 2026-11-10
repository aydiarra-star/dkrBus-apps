import { useEffect, useMemo, useState } from 'react'
import { formatPassageCountdown } from '../domain/headways'
import mobilityLineReferences from '../data/mobility-lines.json'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
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
  AFTU_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
} from '../domain/publicBusLineCatalog'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'
type DirectionId = 'outbound' | 'inbound'
type MobilityRouteReference = { network: EstimatedScheduleNetwork; code: string; waypoints: string[]; detailSourceUrl: string | null; note: string | null }
const routeReferences = mobilityLineReferences as MobilityRouteReference[]
const dddPublishedStopsByLine = new Map(DDD_PUBLISHED_ROUTES.map((route) => [route.line, route.stops] as const))

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

const AFTU_TATA_NETWORK_REFERENCE: EstimatedLineSchedule = {
  line: '*',
  weekday: { start: '06:00', end: '21:00', interval: '11.6 min' },
  saturday: { start: '06:00', end: '21:00', interval: '11.6 min' },
  sunday: { start: '06:00', end: '21:00', interval: '11.6 min' },
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
  if (nextAt >= endAt) return null
  return Math.max(1, Math.ceil((nextAt - now) / MINUTE_MS))
}

export function EstimatedLineScheduleBoard({ network, location = null }: { network: EstimatedScheduleNetwork; location?: UserLocation | null }) {
  const isDdd = network === 'ddd'
  const label = isDdd ? 'DDD' : network === 'tata' ? 'TATA' : 'AFTU'
  const catalogue = isDdd ? DDD_PUBLIC_LINE_CATALOG : network === 'tata' ? TATA_PUBLIC_LINE_CATALOG : AFTU_PUBLIC_LINE_CATALOG
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const schedulesByLine = useMemo(() => new Map(schedules.map((schedule) => [schedule.line, schedule])), [schedules])
  const [now, setNow] = useState(() => Date.now())
  const [openedDirection, setOpenedDirection] = useState<{ line: string; direction: DirectionId } | null>(null)
  const referenceStops = network === 'ddd' ? DDD_STOPS : network === 'tata' ? TATA_STOPS : AFTU_STOPS
  const nearestStop = useMemo(() => {
    if (!location || referenceStops.length === 0) return null
    return referenceStops.reduce((nearest, stop) => {
      const distance = haversineMeters({ lat: location.lat, lon: location.lng }, { lat: stop.lat, lon: stop.lon })
      return !nearest || distance < nearest.distance ? { stop, distance } : nearest
    }, null as { stop: (typeof referenceStops)[number]; distance: number } | null)
  }, [location, referenceStops])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="station-board" aria-label={`Affichage des lignes ${label}`}>
      <header className="station-board-head"><strong>Lignes {label}</strong></header>
      <ul className="station-board-list">
        {catalogue.map((line) => {
          const lineSchedule = schedulesByLine.get(line.line)
          const schedule = lineSchedule ?? (isDdd ? DDD_NETWORK_REFERENCE : AFTU_TATA_NETWORK_REFERENCE)
          const weekday = new Date(now).getUTCDay()
          const declaredWindow = schedule
            ? weekday === 0 ? schedule.sunday : weekday === 6 ? schedule.saturday : schedule.weekday
            : null
          const hasExplicitNoService = Boolean(lineSchedule && !declaredWindow && lineSchedule.note?.toLowerCase().includes('pas de service'))
          const scheduleWindow = declaredWindow ?? (hasExplicitNoService ? null : isDdd ? DDD_NETWORK_REFERENCE.weekday : AFTU_TATA_NETWORK_REFERENCE.weekday)
          const networkReference = NETWORK_REFERENCE_DATA[network]
          const serviceWindow = scheduleWindow ?? (hasExplicitNoService ? null : {
            start: networkReference.serviceStart,
            end: networkReference.serviceEnd,
            interval: '',
          })
          const serviceState = serviceWindow
            ? getServiceDisplayState(now, serviceWindow.start, serviceWindow.end)
            : { status: 'FINISHED' as const, label: 'Pas de service aujourd’hui', showCountdown: false }
          const countdownSchedule = scheduleWindow ? { ...schedule, weekday: scheduleWindow, saturday: scheduleWindow, sunday: scheduleWindow } : null
          const outboundMinutes = countdownSchedule && serviceState.status === 'ACTIVE' ? scheduleCountdownMinutes(countdownSchedule, now) : null
          const inboundMinutes = outboundMinutes
          const route = routeReferences.find((item) => item.network === network && item.code === line.line)
          const directions = [
            { id: 'outbound' as const, label: 'Aller', from: line.origin, to: line.destination, minutes: outboundMinutes },
            { id: 'inbound' as const, label: 'Retour', from: line.destination, to: line.origin, minutes: inboundMinutes },
          ]
          return (
            <li key={line.line} className="station-board-line-group">
              {directions.map((direction) => {
                const selected = openedDirection?.line === line.line && openedDirection.direction === direction.id
                const publishedStops = direction.id === 'outbound'
                  ? (route?.waypoints?.length ? route.waypoints : network === 'ddd' ? [...(dddPublishedStopsByLine.get(line.line) ?? [])] : [])
                  : []
                return (
                  <div key={direction.id} className="station-board-direction-detail">
                    <button type="button" className={`station-board-row station-board-row-static station-board-direction-row station-board-direction-${direction.id} station-board-direction-toggle${selected ? ' is-expanded' : ''}`} aria-expanded={selected} onClick={() => setOpenedDirection(selected ? null : { line: line.line, direction: direction.id })}>
                      <span className="station-board-stop"><strong>{label} {line.line}</strong><small>{direction.label} · {direction.from} → {direction.to}</small></span>
                      <span className="station-board-direction-action">
                        <span className={`network-summary-passage station-board-passage${direction.minutes === null ? ' is-undeclared' : ''}`} role="status"><strong>{serviceState.status === 'UPCOMING' ? serviceState.label : serviceState.status === 'FINISHED' ? (hasExplicitNoService ? 'Pas de service' : 'Fin de service') : direction.minutes === null ? 'En service' : formatPassageCountdown(direction.minutes)}</strong>{serviceState.status !== 'ACTIVE' && <small>{serviceWindow ? `Reprise à ${serviceWindow.start}` : ''}</small>}</span>
                        <span aria-hidden="true">{selected ? '−' : '+'}</span>
                      </span>
                    </button>
                    {selected && (
                      <div className="station-board-itinerary" aria-label={`Itinéraire ${direction.label} ligne ${line.line}`}>
                        {location && nearestStop && <p className="station-board-nearest-stop">Votre position : arrêt de référence le plus proche « {nearestStop.stop.name} », à {nearestStop.distance < 1000 ? `${Math.round(nearestStop.distance)} m` : `${(nearestStop.distance / 1000).toFixed(1)} km`}.</p>}
                        {direction.id === 'outbound' && publishedStops.length > 0 ? (
                          <ol className="station-board-itinerary-list">{publishedStops.map((stop, index) => <li key={`${index}-${stop}`}>{stop}</li>)}</ol>
                        ) : direction.id === 'inbound' ? (
                          <p className="station-board-itinerary-pending">Les arrêts de ce sens ne sont pas encore documentés séparément.</p>
                        ) : (
                          <p className="station-board-itinerary-pending">Le détail des arrêts de cet aller n’est pas encore disponible.</p>
                        )}
                        {route?.detailSourceUrl && <a className="station-board-itinerary-source" href={route.detailSourceUrl} target="_blank" rel="noreferrer">Consulter la fiche de l’itinéraire</a>}
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
