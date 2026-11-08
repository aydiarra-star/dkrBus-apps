import {
  AFTU_ESTIMATED_LINE_SCHEDULES,
  DDD_ESTIMATED_LINE_SCHEDULES,
  type EstimatedFrequencyWindow,
} from '../domain/estimatedSchedules'
import mobilityLines from '../data/mobility-lines.json'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'
type RouteRecord = { network: string; code: string; origin: string; destination: string }

const routeRecords = mobilityLines as RouteRecord[]
const scheduleLabel = (network: EstimatedScheduleNetwork) => network === 'ddd' ? 'ddd' : 'aftu'

function minuteOfDay(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function nextClock(window: EstimatedFrequencyWindow | null, now: number, offset = 0): string {
  if (!window) return '—'
  const date = new Date(now)
  const current = date.getUTCHours() * 60 + date.getUTCMinutes()
  const start = minuteOfDay(window.start) + offset
  const end = minuteOfDay(window.end)
  const interval = Math.max(1, Number.parseInt(window.interval, 10) || 12)
  if (current > end) return '—'
  const slot = current <= start ? start : start + Math.ceil((current - start) / interval) * interval
  if (slot > end) return '—'
  const hours = Math.floor(slot / 60) % 24
  const minutes = slot % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function windowForDay(
  weekday: EstimatedFrequencyWindow | null,
  saturday: EstimatedFrequencyWindow | null,
  sunday: EstimatedFrequencyWindow | null,
  now: number,
): EstimatedFrequencyWindow | null {
  const day = new Date(now).getUTCDay()
  return day === 0 ? sunday : day === 6 ? saturday : weekday
}

function defaultWindow(network: EstimatedScheduleNetwork): EstimatedFrequencyWindow {
  return network === 'ddd'
    ? { start: '05:30', end: '21:00', interval: '10 min' }
    : { start: '06:00', end: '21:00', interval: '12 min' }
}

export function EstimatedLineScheduleBoard({
  network,
  now,
}: {
  network: EstimatedScheduleNetwork
  now: number
}) {
  const dataNetwork = scheduleLabel(network)
  const routes = routeRecords.filter((route) => route.network === dataNetwork)
  const schedules = network === 'ddd' ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const scheduleByLine = new Map(schedules.map((schedule) => [schedule.line, schedule]))

  return (
    <div className="estimated-line-schedule-board" aria-label={`Lignes ${network.toUpperCase()}`}>
      {routes.map((route) => {
        const schedule = scheduleByLine.get(route.code)
        const indexedWindow = schedule
          ? windowForDay(schedule.weekday, schedule.saturday, schedule.sunday, now)
          : null
        const noServiceToday = Boolean(schedule?.note?.toLowerCase().includes('pas de service') && !indexedWindow)
        const selectedWindow = noServiceToday ? null : indexedWindow ?? defaultWindow(network)
        const returnOffset = selectedWindow
          ? Math.max(1, Math.ceil(Number.parseInt(selectedWindow.interval, 10) / 2))
          : 0
        const outbound = selectedWindow ? nextClock(selectedWindow, now) : '—'
        const inbound = selectedWindow ? nextClock(selectedWindow, now, returnOffset) : '—'
        return (
          <article className="estimated-line-schedule-row" key={`${network}-${route.code}`}>
            <div className="estimated-line-route">
              <strong>Ligne {route.code}</strong>
              <span>{route.origin} → {route.destination}</span>
            </div>
            <div className="estimated-line-directions">
              <div className="estimated-line-direction">
                <span>Aller</span>
                <strong>Créneau <b>{outbound}</b></strong>
              </div>
              <div className="estimated-line-direction">
                <span>Retour</span>
                <strong>Créneau <b>{inbound}</b></strong>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
