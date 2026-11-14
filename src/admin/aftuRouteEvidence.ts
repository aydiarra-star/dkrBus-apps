/**
 * Adaptateur de lecture seule des fiches de parcours AFTU.
 *
 * Les waypoints restent des libellés sources : ils ne sont jamais convertis
 * en identifiants d'arrêts, géolocalisés ou injectés dans le catalogue public.
 * Chaque sens est lu indépendamment ; aucun retour n'est déduit de l'aller.
 */
export interface AftuDirectionEvidence {
  direction: 'outbound' | 'inbound'
  waypoints: readonly string[]
  sourceUrl: string | null
  sourceLabel: string | null
  timetableEntries: number
  hasPerStopTimes: boolean
  scheduleInterval: string | null
  genericStopLabels: number
  repeatedLabels: string[]
  sequenceStatus: 'documented' | 'missing'
}

export interface AftuRouteEvidence {
  network: 'aftu'
  line: string
  outbound: AftuDirectionEvidence
  inbound: AftuDirectionEvidence
  sourceStatus: string | null
  validatedByProjectOwner: boolean
  inboundCorridorStatus: 'confirmed-sequence-unavailable' | null
  inboundCorridorAnchors: string[]
  serviceWindow: {
    start: string
    end: string
    source: 'CETUD-network-default'
  }
}

interface RawDirection {
  waypoints?: unknown
  times?: unknown
}

interface RawSchedule {
  interval?: unknown
  weekday?: { interval?: unknown }
  sourceUrl?: unknown
  sourceLabel?: unknown
}

interface RawAftuRoute {
  network?: unknown
  code?: unknown
  waypoints?: unknown
  inboundWaypoints?: unknown
  directions?: {
    outbound?: RawDirection
    inbound?: RawDirection
  }
  outboundSchedule?: RawSchedule
  inboundSchedule?: RawSchedule
  sourceLabel?: unknown
  sourceStatus?: unknown
  validatedByProjectOwner?: unknown
  returnEvidence?: { status?: unknown; orderedCorridorAnchors?: unknown }
  frequency?: { intervalMinutes?: unknown; display?: unknown; countdownBasis?: unknown }
  detailSourceUrl?: unknown
  inboundDetailSourceUrl?: unknown
}

import aftu66Return from '../data/aftu-66-return.json'
import { AFTU_CETUD_SCHEDULE_SETTINGS } from '../data/aftuScheduleSettings'

const routeModules = import.meta.glob('../data/aftu-*-directions.json', {
  eager: true,
  import: 'default',
}) as Record<string, RawAftuRoute>

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function directionEvidence(
  direction: 'outbound' | 'inbound',
  waypoints: string[],
  timesValue: unknown,
  schedule: RawSchedule | undefined,
  route: RawAftuRoute,
): AftuDirectionEvidence {
  const times = Array.isArray(timesValue) ? timesValue.filter((value) => typeof value === 'string' && value.trim()) : []
  const normalized = waypoints.map((label) => label.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim())
  const repeatedLabels = [...new Set(normalized.filter((label, index) => normalized.indexOf(label) !== index))]
  const genericStopLabels = waypoints.filter((label) =>
    /^arr(?:e|ê)t(?:s)?(?: de bus)?$/i.test(label.trim()),
  ).length

  const directionUrl = direction === 'outbound'
    ? route.detailSourceUrl
    : route.inboundDetailSourceUrl
  return {
    direction,
    waypoints,
    sourceUrl: nonEmptyString(schedule?.sourceUrl) ?? nonEmptyString(directionUrl),
    sourceLabel: nonEmptyString(schedule?.sourceLabel) ?? nonEmptyString(route.sourceLabel),
    timetableEntries: times.length,
    hasPerStopTimes: waypoints.length > 0 && times.length === waypoints.length,
    scheduleInterval: nonEmptyString(schedule?.interval)
      ?? nonEmptyString(schedule?.weekday?.interval)
      ?? nonEmptyString(route.frequency?.display)
      ?? (typeof route.frequency?.intervalMinutes === 'number' ? `${route.frequency.intervalMinutes} min` : null)
      ?? nonEmptyString(route.frequency?.countdownBasis),
    genericStopLabels,
    repeatedLabels,
    sequenceStatus: waypoints.length > 0 ? 'documented' : 'missing',
  }
}

function adaptRoute(route: RawAftuRoute): AftuRouteEvidence | null {
  if (route.network !== 'aftu' || typeof route.code !== 'string') return null
  const outboundWaypoints = stringList(route.directions?.outbound?.waypoints ?? route.waypoints)
  const inboundWaypoints = stringList(route.directions?.inbound?.waypoints ?? route.inboundWaypoints)
  return {
    network: 'aftu',
    line: route.code,
    outbound: directionEvidence(
      'outbound',
      outboundWaypoints,
      route.directions?.outbound?.times,
      route.outboundSchedule,
      route,
    ),
    inbound: directionEvidence(
      'inbound',
      inboundWaypoints,
      route.directions?.inbound?.times,
      route.inboundSchedule,
      route,
    ),
    sourceStatus: nonEmptyString(route.sourceStatus),
    validatedByProjectOwner: route.validatedByProjectOwner === true,
    inboundCorridorStatus: (route.returnEvidence?.status === 'return-corridor-confirmed-sequence-unavailable'
      || route.returnEvidence?.status === 'return-direction-confirmed-partial-corridor-anchors')
      ? 'confirmed-sequence-unavailable'
      : null,
    inboundCorridorAnchors: stringList(route.returnEvidence?.orderedCorridorAnchors),
    serviceWindow: {
      ...AFTU_CETUD_SCHEDULE_SETTINGS.generalServiceWindow,
      source: 'CETUD-network-default',
    },
  }
}

export const AFTU_ROUTE_EVIDENCE: readonly AftuRouteEvidence[] = Object.values(routeModules)
  .concat([aftu66Return as RawAftuRoute])
  .map(adaptRoute)
  .filter((route): route is AftuRouteEvidence => route !== null)
  .sort((a, b) => Number(a.line) - Number(b.line))
  
export function getAftuRouteEvidence(line: string): AftuRouteEvidence | null {
  return AFTU_ROUTE_EVIDENCE.find((route) => route.line === line) ?? null
}
