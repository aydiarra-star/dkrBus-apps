import { useEffect, useState } from 'react'
import { formatPassageCountdown } from '../domain/headways'
import {
  AFTU_ESTIMATED_LINE_SCHEDULES,
  DDD_ESTIMATED_LINE_SCHEDULES,
  type EstimatedFrequencyWindow,
  type EstimatedLineSchedule,
} from '../domain/estimatedSchedules'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Une fréquence non numérique ou une plage non précise ne devient jamais un passage. */
function parseInterval(value: string): number | null {
  const match = /^(\d+)\s*min$/i.exec(value.trim())
  if (!match) return null
  const minutes = Number(match[1])
  return Number.isSafeInteger(minutes) && minutes > 0 ? minutes : null
}

/**
 * Décompte théorique du prochain créneau de la fiche, jamais une arrivée réelle.
 * La grille est ancrée au premier départ publié et à l'intervalle de la source.
 * Sans intervalle exploitable (ex. DDD 1), aucun compte à rebours n'est fabriqué.
 */
export function scheduleCountdownMinutes(
  schedule: EstimatedLineSchedule,
  now = Date.now(),
): number | null {
  if (!Number.isFinite(now)) return null

  const weekday = new Date(now).getUTCDay()
  const window: EstimatedFrequencyWindow | null =
    weekday === 0 ? schedule.sunday : weekday === 6 ? schedule.saturday : schedule.weekday
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
  const nextAt = now < startAt
    ? startAt
    : startAt + (Math.floor((now - startAt) / step) + 1) * step
  if (nextAt >= endAt) return null

  return Math.max(1, Math.ceil((nextAt - now) / MINUTE_MS))
}

export function EstimatedLineScheduleBoard({ network }: { network: EstimatedScheduleNetwork }) {
  const isDdd = network === 'ddd'
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const label = isDdd ? 'DDD' : network === 'tata' ? 'TATA' : 'AFTU'
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <details className="estimated-line-schedule-board">
      <summary>{isDdd ? 'Lignes DDD' : network === 'tata' ? 'Lignes TATA' : 'Lignes AFTU'}</summary>
      <div className="estimated-line-schedule-scroll">
        <table className="estimated-line-schedule-table">
          <thead>
            <tr>
              <th scope="col">Ligne</th>
              <th scope="col">Compte à rebours</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => {
              const minutes = scheduleCountdownMinutes(schedule, now)
              return (
                <tr key={schedule.line}>
                  <th scope="row">{label} {schedule.line}</th>
                  <td
                    role="status"
                    aria-label={minutes === null
                      ? `${label} ${schedule.line} : aucun créneau calculable aujourd’hui`
                      : `${label} ${schedule.line} : décompte indicatif de ${minutes} minutes`}
                  >
                    <strong>{formatPassageCountdown(minutes)}</strong>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}
