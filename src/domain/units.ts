/**
 * Formatage des valeurs selon les unités choisies dans Paramètres.
 *
 * Seules les grandeurs effectivement converties le sont : les distances
 * (mètres/kilomètres contre miles) et la façon d'écrire une durée
 * (minutes seules ou heures + minutes). Les durées ne sont jamais converties en
 * une autre unité de temps, et les prix restent en francs CFA — c'est la seule
 * devise publiée par les exploitants dakarois.
 */

import type { DistanceUnits, DurationFormat } from './preferences'

const FEET_PER_METER = 3.28084
const METERS_PER_MILE = 1609.344

function decimal(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', ',')
}

/** Distance de marche ou de parcours, dans l'unité choisie. */
export function formatDistance(meters: number | undefined, units: DistanceUnits = 'metric'): string {
  if (meters === undefined || !Number.isFinite(meters)) return ''
  if (units === 'imperial') {
    const miles = meters / METERS_PER_MILE
    if (miles < 0.1) return `${Math.round(meters * FEET_PER_METER)} pi`
    return `${decimal(miles, miles < 1 ? 2 : 1)} mi`
  }
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${decimal(meters / 1000, 1)} km`
}

/** Durée de trajet : minutes seules, ou heures et minutes au-delà d'une heure. */
export function formatDuration(minutes: number, format: DurationFormat = 'minutes'): string {
  const rounded = Math.max(0, Math.round(minutes))
  if (format === 'hours' && rounded >= 60) {
    const hours = Math.floor(rounded / 60)
    const rest = rounded % 60
    return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
  }
  return `${rounded} min`
}

/** Durée estimée, avec sa marge — le chiffre seul serait lu comme une garantie. */
export function formatEstimatedDuration(minutes: number, uncertaintyMinutes: number, format: DurationFormat = 'minutes'): string {
  const value = formatDuration(minutes, format)
  if (uncertaintyMinutes <= 0) return value
  return `${value} ±${uncertaintyMinutes} min`
}

export function formatWalkLabel(meters: number, units: DistanceUnits = 'metric'): string {
  const distance = formatDistance(meters, units)
  return distance ? `${distance} de marche` : 'sans marche'
}

export function transferLabel(count: number): string {
  if (count === 0) return 'sans correspondance'
  return `${count} correspondance${count > 1 ? 's' : ''}`
}

export const DISTANCE_UNIT_LABELS: Record<DistanceUnits, string> = {
  metric: 'Métrique (m, km)',
  imperial: 'Impériale (pi, mi)',
}

export const DURATION_FORMAT_LABELS: Record<DurationFormat, string> = {
  minutes: 'Minutes (42 min)',
  hours: 'Heures et minutes (1 h 12)',
}
