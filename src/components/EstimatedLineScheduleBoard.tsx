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

/**
 * Référence empirique CETUD/étude 2023–2024 : moyenne AFTU 11,58 min,
 * arrondie à 11,6 min pour le modèle de grille. Les TATA étant les minibus
 * AFTU, cette même référence s'applique à leur catalogue. Ancre de grille
 * et amplitude générale publiées par le CETUD : 06:00–21:00.
 * Les fiches propres à une ligne restent prioritaires lorsqu'elles existent.
 */
const AFTU_TATA_NETWORK_REFERENCE: EstimatedLineSchedule = {
  line: '*',
  weekday: { start: '06:00', end: '21:00', interval: '11.6 min' },
  saturday: { start: '06:00', end: '21:00', interval: '11.6 min' },
  sunday: { start: '06:00', end: '21:00', interval: '11.6 min' },
  sourceUrl: 'https://www.iieta.org/journals/ijtdi/paper/10.18280/ijtdi.090108',
  sourceLabel: 'Mesures AFTU 2023–2024 · CETUD',
}

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
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
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
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
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
          const lineSchedule = schedulesByLine.get(line.line)
          const schedule = isDdd ? lineSchedule : lineSchedule ?? AFTU_TATA_NETWORK_REFERENCE
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
