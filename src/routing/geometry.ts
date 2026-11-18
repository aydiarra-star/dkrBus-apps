import { roadDistanceMeters, type RoadPoint } from '../domain/roadNetworkRouting'
import type { Evidence } from './model'

export function reviewed(proof: Evidence | undefined): boolean {
  if (proof?.status !== 'reviewed' || !proof.reference?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(proof.date)) return false
  const date = new Date(`${proof.date}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(proof.date)
}
export function inDakar(p: RoadPoint): boolean {
  return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= 14.4 && p.lat <= 15 && p.lon >= -17.7 && p.lon <= -16.9
}
export function samePoint(a: RoadPoint, b: RoadPoint): boolean { return a.lat === b.lat && a.lon === b.lon }

/** Measure along source vertices. A jump invalidates the WHOLE shape; never
 * discard a bad vertex and draw across the gap. Limits are QA, not evidence. */
export function shapeLength(shape: readonly RoadPoint[], maxStepM: number): number | null {
  if (!Array.isArray(shape) || shape.length < 2 || !shape.every(inDakar)) return null
  let length = 0
  for (let i = 1; i < shape.length; i++) {
    const step = roadDistanceMeters(shape[i - 1], shape[i])
    if (!Number.isFinite(step) || step > maxStepM) return null
    length += step
  }
  return length > 0 ? length : null
}

/** Sections have already been checked for exact continuity at construction. */
export function concatenate(parts: readonly { positions: readonly RoadPoint[] }[]): RoadPoint[] {
  return parts.flatMap((part, i) => i ? part.positions.slice(1) : part.positions)
}
