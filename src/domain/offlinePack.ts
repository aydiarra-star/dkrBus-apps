/**
 * Paquet hors ligne du référentiel Dakar.
 *
 * À Dakar la couverture réseau est inégale : une fiche d'arrêt, une ligne ou un
 * tarif doit rester consultable sans connexion. Ce module écrit sur l'appareil
 * une copie vérifiable du référentiel embarqué (arrêts, lignes, correspondances,
 * fréquences, grilles tarifaires) et rend trois choses réellement testables :
 *
 * 1. l'état : rien n'est installé, ou le paquet est présent avec sa date, sa
 *    taille et ses décomptes ;
 * 2. l'intégrité : une empreinte calculée sur le contenu est comparée à celle du
 *    référentiel de l'application — un paquet modifié ou plus ancien est signalé,
 *    jamais présenté comme à jour ;
 * 3. la consultation hors ligne : les arrêts, lignes et tarifs sont relus depuis
 *    le paquet, et un itinéraire peut être calculé avec, sans serveur.
 *
 * Ce paquet n'est pas un téléchargement de fonds cartographiques : les
 * tuiles de carte nécessitent un réseau. Le module le dit au lieu de promettre
 * une carte hors ligne qui n'existe pas.
 */

import {
  ALL_CORRIDOR_STOPS,
  CORRIDOR_LINES,
  INTERMODAL_TRANSFERS,
  networkOfStopId,
} from './corridors'
import { FARE_GRIDS, TER_FARE_ROWS, BRT_FARE_ROWS, FARE_CONSULTED_AT } from './fares'
import { MOBILITY_IDS, type MobilityId } from './mobilityColors'
import type { CorridorLine, CorridorStop } from './corridors'

export const OFFLINE_PACK_KEY = 'dakar-bus:offline-pack:v1'
export const OFFLINE_PACK_VERSION = 1

export interface OfflineStopRecord {
  id: string
  name: string
  lat: number
  lon: number
  network: MobilityId | null
  aliases: string[]
  note?: string
}

export interface OfflineLineRecord {
  id: string
  network: MobilityId
  shortName: string
  longName: string
  stopIds: string[]
  headwayMin: number
  frequencyStatus: string
  serviceWindow: string
  speedKph: number
}

export interface OfflineTransferRecord {
  fromStopId: string
  toStopId: string
  walkM: number
  label: string
  declared: boolean
}

export interface OfflineFareRecord {
  network: MobilityId
  label: string
  basis: string
  rows: { label: string; amountCfa: number | null }[]
  note: string
}

export interface OfflinePackPayload {
  version: number
  savedAt: string
  fingerprint: string
  stops: OfflineStopRecord[]
  lines: OfflineLineRecord[]
  transfers: OfflineTransferRecord[]
  fares: OfflineFareRecord[]
  sourceNote: string
}

export interface OfflinePackSummary {
  savedAt: string
  version: number
  bytes: number
  stops: number
  lines: number
  transfers: number
  declaredTransfers: number
  fareNetworks: MobilityId[]
  fingerprint: string
}

export type OfflinePackIntegrity = 'intact' | 'stale' | 'modified' | 'absent'

export interface OfflinePackState {
  available: boolean
  integrity: OfflinePackIntegrity
  summary: OfflinePackSummary | null
  error: string | null
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Empreinte FNV-1a sur la chaîne canonique : suffisante pour détecter un
 *  contenu modifié ou ancien, sans prétendre à une signature cryptographique. */
export function fingerprint(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36)
}

function stopRecord(stop: CorridorStop): OfflineStopRecord {
  return {
    id: stop.id,
    name: stop.name,
    lat: Number(stop.lat.toFixed(6)),
    lon: Number(stop.lon.toFixed(6)),
    network: networkOfStopId(stop.id),
    aliases: [...stop.aliases],
    ...(stop.note ? { note: stop.note } : {}),
  }
}

function lineRecord(line: CorridorLine): OfflineLineRecord {
  return {
    id: line.id,
    network: line.network,
    shortName: line.shortName,
    longName: line.longName,
    stopIds: [...line.stopIds],
    headwayMin: line.headwayMin,
    frequencyStatus: line.frequencyStatus,
    serviceWindow: line.serviceWindow,
    speedKph: line.speedKph,
  }
}

/** Contenu canonique du référentiel embarqué. Le tri est fixe : deux paquets
 *  issus des mêmes données produisent la même empreinte. */
export function canonicalReferential(): string {
  const stops = [...ALL_CORRIDOR_STOPS].map(stopRecord).sort((a, b) => a.id.localeCompare(b.id))
  const lines = [...CORRIDOR_LINES].map(lineRecord).sort((a, b) => a.id.localeCompare(b.id))
  const transfers = INTERMODAL_TRANSFERS.map((transfer) => ({
    fromStopId: transfer.fromStopId,
    toStopId: transfer.toStopId,
    walkM: transfer.walkM,
    declared: transfer.declared === true,
  })).sort((a, b) => `${a.fromStopId}|${a.toStopId}`.localeCompare(`${b.fromStopId}|${b.toStopId}`))
  const fares = MOBILITY_IDS.map((id) => ({
    network: id,
    basis: FARE_GRIDS[id].basis,
    rows: FARE_GRIDS[id].rows.map((row) => `${row.label}:${row.amountCfa ?? 'x'}`),
  }))
  return JSON.stringify({ stops, lines, transfers, fares, consultedAt: FARE_CONSULTED_AT })
}

export function currentFingerprint(): string {
  return fingerprint(canonicalReferential())
}

export function buildOfflinePack(now = new Date()): OfflinePackPayload {
  const stops = [...ALL_CORRIDOR_STOPS].map(stopRecord).sort((a, b) => a.id.localeCompare(b.id))
  const lines = [...CORRIDOR_LINES].map(lineRecord).sort((a, b) => a.id.localeCompare(b.id))
  const transfers = INTERMODAL_TRANSFERS.map((transfer) => ({
    fromStopId: transfer.fromStopId,
    toStopId: transfer.toStopId,
    walkM: transfer.walkM,
    label: transfer.label,
    declared: transfer.declared === true,
  })).sort((a, b) => `${a.fromStopId}|${a.toStopId}`.localeCompare(`${b.fromStopId}|${b.toStopId}`))
  const fares: OfflineFareRecord[] = MOBILITY_IDS.map((id) => ({
    network: id,
    label: FARE_GRIDS[id].label,
    basis: FARE_GRIDS[id].basis,
    rows: FARE_GRIDS[id].rows.map((row) => ({ label: row.label, amountCfa: row.amountCfa })),
    note: FARE_GRIDS[id].note,
  }))
  return {
    version: OFFLINE_PACK_VERSION,
    savedAt: now.toISOString(),
    fingerprint: currentFingerprint(),
    stops,
    lines,
    transfers,
    fares,
    sourceNote: `Copie du référentiel embarqué (TER, BRT, DDD, AFTU, TATA) établie sur l’appareil. Tarifs de référence consultés le ${FARE_CONSULTED_AT}. Fond cartographique : non inclus, les tuiles demandent un réseau.`,
  }
}

export function summarize(payload: OfflinePackPayload, serialized = JSON.stringify(payload)): OfflinePackSummary {
  return {
    savedAt: payload.savedAt,
    version: payload.version,
    bytes: serialized.length,
    stops: payload.stops.length,
    lines: payload.lines.length,
    transfers: payload.transfers.length,
    declaredTransfers: payload.transfers.filter((transfer) => transfer.declared).length,
    fareNetworks: payload.fares.filter((fare) => fare.basis === 'OFFICIAL_ZONE_TABLE').map((fare) => fare.network),
    fingerprint: payload.fingerprint,
  }
}

export function saveOfflinePack(now = new Date()): { ok: true; summary: OfflinePackSummary } | { ok: false; error: string } {
  const store = storage()
  if (!store) return { ok: false, error: 'Le stockage local de cet appareil est indisponible (navigation privée ?) : rien ne peut être préparé hors ligne.' }
  const payload = buildOfflinePack(now)
  const serialized = JSON.stringify(payload)
  try {
    store.setItem(OFFLINE_PACK_KEY, serialized)
  } catch {
    return { ok: false, error: 'Le stockage local est saturé : libérez de l’espace puis relancez la préparation.' }
  }
  return { ok: true, summary: summarize(payload, serialized) }
}

export function readOfflinePack(): { payload: OfflinePackPayload; summary: OfflinePackSummary } | null {
  const store = storage()
  if (!store) return null
  let raw: string | null = null
  try {
    raw = store.getItem(OFFLINE_PACK_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as OfflinePackPayload
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.stops) || !Array.isArray(parsed.lines)) return null
    return { payload: parsed, summary: summarize(parsed, raw) }
  } catch {
    return null
  }
}

export function clearOfflinePack(): void {
  try {
    storage()?.removeItem(OFFLINE_PACK_KEY)
  } catch {
    // Rien à purger si le stockage est inaccessible.
  }
}

/** État complet affiché dans Paramètres → Mode hors ligne. */
export function offlinePackState(): OfflinePackState {
  const stored = readOfflinePack()
  if (!stored) return { available: false, integrity: 'absent', summary: null, error: null }
  if (stored.payload.version !== OFFLINE_PACK_VERSION) {
    return { available: true, integrity: 'stale', summary: stored.summary, error: 'Ce paquet provient d’une version antérieure du référentiel : téléchargez-le de nouveau.' }
  }
  if (stored.summary.fingerprint !== currentFingerprint()) {
    return { available: true, integrity: 'modified', summary: stored.summary, error: 'Le paquet enregistré ne correspond plus au référentiel de l’application : il a été modifié ou est plus ancien.' }
  }
  return { available: true, integrity: 'intact', summary: stored.summary, error: null }
}

export const INTEGRITY_LABELS: Record<OfflinePackIntegrity, string> = {
  intact: 'Paquet vérifié, conforme au référentiel de l’application.',
  stale: 'Paquet obsolète : une nouvelle version du référentiel est disponible.',
  modified: 'Paquet non conforme : son contenu ne correspond plus au référentiel.',
  absent: 'Aucun paquet hors ligne sur cet appareil.',
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} kilo-octets`
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} méga-octets`
}

export function formatPackDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'date illisible'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' (heure de Dakar)'
}

/** Arrêts du paquet, pour une consultation sans réseau (recherche locale). */
export function offlineStopsMatching(query: string, payload?: OfflinePackPayload | null): OfflineStopRecord[] {
  const pack = payload ?? readOfflinePack()?.payload ?? null
  if (!pack) return []
  const needle = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (!needle) return pack.stops.slice(0, 8)
  return pack.stops
    .filter((stop) => [stop.name, ...stop.aliases].some((value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(needle)))
    .slice(0, 8)
}

export function offlineFareText(payload?: OfflinePackPayload | null): string {
  const pack = payload ?? readOfflinePack()?.payload ?? null
  if (!pack) return 'Aucun paquet hors ligne : les tarifs ne sont consultables que dans l’application en ligne.'
  const lines = pack.fares.map((fare) => {
    const rows = fare.rows.map((row) => `  – ${row.label} : ${row.amountCfa === null ? 'non déclaré' : `${row.amountCfa.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} F CFA`}`).join('\n')
    return `• ${fare.label}\n${rows}`
  })
  return `Tarifs enregistrés sur votre appareil :\n${lines.join('\n')}\nGrille de référence consultée le ${FARE_CONSULTED_AT} (TER : ${TER_FARE_ROWS.length} lignes de tarifs, BRT : ${BRT_FARE_ROWS.length}).`
}

/** Ce que l'application sait répondre hors ligne — et ce qu'elle ne peut pas. */
export function offlineCapabilityText(state: OfflinePackState): string {
  const pack = state.available && (state.integrity === 'intact' || state.integrity === 'stale')
  return [
    pack ? '• Consultation hors ligne : arrêts, lignes, correspondances et tarifs publiés.' : '• Aucun paquet : la consultation hors ligne n’est pas encore préparée.',
    '• Calcul d’itinéraire sur le référentiel embarqué : oui, sans serveur, avec les mêmes marges d’estimation.',
    '• Fond de carte : non — les tuiles OpenStreetMap exigent une connexion.',
    '• Horaires à l’arrêt, positions de véhicule et perturbations : non, aucune source temps réel n’est intégrée.',
  ].join('\n')
}
