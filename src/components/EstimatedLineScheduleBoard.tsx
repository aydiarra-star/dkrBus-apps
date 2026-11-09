import { useEffect, useMemo, useState } from 'react'
import { formatPassageCountdown } from '../domain/headways'
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

/** Décompte théorique fondé sur la plage et la fréquence de la fiche source. */
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
  const label = isDdd ? 'DDD' : network === 'tata' ? 'TATA' : 'AFTU'
  const catalogue = isDdd
    ? DDD_PUBLIC_LINE_CATALOG
    : network === 'tata'
      ? TATA_PUBLIC_LINE_CATALOG
      : AFTU_PUBLIC_LINE_CATALOG
  // AFTU et TATA désignent ici le même réseau de minibus : faute de grille TATA
  // distincte, on réutilise strictement les références AFTU, sans les présenter
  // comme des mesures séparées. Le catalogue de lignes affiché reste celui du réseau choisi.
  const schedules = isDdd
    ? DDD_ESTIMATED_LINE_SCHEDULES
    : network === 'aftu' || network === 'tata'
      ? AFTU_ESTIMATED_LINE_SCHEDULES
      : []
  const schedulesByLine = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.line, schedule])),
    [schedules],
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="station-board" aria-label={`Affichage des lignes ${label}`}>
      <header className="station-board-head">
        <strong>Lignes {label}</strong>
      </header>
      <ul className="station-board-list">
        {catalogue.map((line) => {
          // Seule une fiche horaire portant exactement le même identifiant est utilisable.
          // Une ligne absente du jeu horaire reste visible, avec le tiret de disponibilité.
          const schedule = schedulesByLine.get(line.line)
          const minutes = schedule ? scheduleCountdownMinutes(schedule, now) : null
          return (
            <li key={line.line}>
              <div className="station-board-row station-board-row-static">
                <span className="station-board-stop">{label} {line.line}</span>
                <span
                  className={`network-summary-passage station-board-passage${minutes === null ? ' is-undeclared' : ''}`}
                  role="status"
                  aria-label={minutes === null
                    ? `${label} ${line.line} : horaire non disponible`
                    : `${label} ${line.line} : compte à rebours de ${minutes} minutes`}
                >
                  <strong>{formatPassageCountdown(minutes)}</strong>
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
