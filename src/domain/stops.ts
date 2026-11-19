/**
 * Index de recherche unique de l'onglet Trajet : toutes les mobilités
 * suivies et tous les arrêts réellement déclarés dans l'application.
 *
 * Périmètre honnête :
 *  - les quatre réseaux de Dakar (TER, BRT, DDD, AFTU / TATA) sont cherchables
 *    par leur nom, leur sigle et leur autorité (SETER, SunuBRT, CETUD…) ;
 *  - seuls les arrêts réellement connus sont proposés comme point de départ
 *    ou d'arrivée : gares TER, stations BRT, pôles de référence DDD et
 *    AFTU/TATA, ainsi que les arrêts géolocalisés du snapshot publié ;
 *  - les arrêts DDD/AFTU/TATA restent explicitement des pôles de référence
 *    simplifiés : ils ne prétendent pas remplacer les séquences complètes de
 *    chaque ligne ni constituer une position de véhicule en temps réel.
 */

import { AFTU_STOPS, BRT_STOPS, DDD_STOPS, TATA_STOPS, TER_STOPS, type CorridorStop } from './corridors'
import { isValidLatLng } from './http'
import { QUALIFIED_SHEET_LABELS } from './passengerLineSheets'
import { JOURNEY_LANDMARKS } from './journeyLandmarks'
import { NETWORK_SOURCES, type NetworkId } from './network'
import { busMapPoints } from '../routing/busGeography'
import type { Place } from '../routing/model'
import type { PublishedStop } from './published'

export type StopOptionKind = 'network' | 'reference' | 'published' | 'landmark' | 'sheet'

export interface StopOption {
  snapshotId?: string
  /** Valeur opaque échangée avec l'UI : « published:<id> », « ref:<id> », « network:<id> ». */
  value: string
  kind: StopOptionKind
  label: string
  group: string
  /** Précision affichée sous le libellé (réseau, source, coordonnées…). */
  hint: string
  /** Une mobilité sans arrêt déclaré informe, elle ne définit pas de point. */
  selectable: boolean
  networkId: NetworkId | null
  stopId: string | null
  lat: number | null
  lon: number | null
  /** Termes supplémentaires cherchables (sigles, autorités, alias). */
  keywords: readonly string[]
}

export const GROUP_ACCESSES = 'Accès et quais vérifiés'
export const GROUP_LANDMARKS = 'Lieux et repères'
export const GROUP_MOBILITY = 'Mobilités'
export const GROUP_PUBLISHED = 'Arrêts publiés'
export const GROUP_TER = 'TER · SETER'
export const GROUP_BRT = 'BRT · SunuBRT'
export const GROUP_DDD = 'DDD · Dakar Dem Dikk'
export const GROUP_AFTU_TATA = 'AFTU / TATA · minibus'

/** Mots-clés cherchables par réseau : sigles, exploitants et autorités cités. */
const NETWORK_KEYWORDS: Record<NetworkId, readonly string[]> = {
  ter: ['ter', 'senter', 'sen ter', 'seter', 'train', 'train express regional', 'gare'],
  brt: ['brt', 'sunubrt', 'sunu brt', 'bus rapid transit', 'b1', 'dakar mobilite', 'station'],
  ddd: ['ddd', 'dakar dem dikk', 'dem dikk', 'cetud', 'bus urbain'],
  aftu_tata: ['aftu', 'tata', 'cetud', 'minibus', 'ndiaga ndiaye', 'car rapide'],
  other: ['autre'],
}

const NETWORK_SOURCE_LABEL: Record<NetworkId, string> = {
  ter: 'Référence SETER',
  brt: 'Référence SunuBRT / CETUD',
  ddd: 'Référence CETUD',
  aftu_tata: 'Référence CETUD',
  other: 'Source non déclarée',
}

export function normalizeSearchTerm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function networkHint(id: NetworkId, stopCount: number | null): string {
  if (id === 'ter') return `${stopCount ?? 0} gares · ${NETWORK_SOURCE_LABEL.ter}`
  if (id === 'brt') return `${stopCount ?? 0} stations · ${NETWORK_SOURCE_LABEL.brt}`
  const network = NETWORK_SOURCES.find((item) => item.id === id)
  const counts = [
    network?.referenceData?.lineCount ? `${network.referenceData.lineCount} lignes` : null,
    network?.referenceData?.vehicleCount ? `${network.referenceData.vehicleCount.toLocaleString('fr-FR')} bus` : null,
  ].filter((value): value is string => value !== null)
  const detail = counts.length > 0 ? counts.join(' · ') : NETWORK_SOURCE_LABEL[id]
  return `${detail} · ${stopCount ?? 0} pôles de référence`
}

const NETWORK_SHORT_LABEL: Record<NetworkId, string> = {
  ter: 'TER', brt: 'BRT', ddd: 'DDD', aftu_tata: 'AFTU / TATA', other: 'Autre',
}

function corridorOption(stop: CorridorStop, network: NetworkId, group: string): StopOption {
  const operator = network === 'aftu_tata' ? (stop.id.startsWith('tata-') ? 'TATA' : 'AFTU') : NETWORK_SHORT_LABEL[network]
  return {
    value: `ref:${stop.id}`,
    kind: 'reference',
    label: stop.name,
    group,
    hint: network === 'aftu_tata' || network === 'ddd' ? `${operator} · pôle de référence, pas un quai` : `${operator} · ${stop.note ?? NETWORK_SOURCE_LABEL[network]}`,
    selectable: true,
    networkId: network,
    stopId: stop.id,
    lat: stop.lat,
    lon: stop.lon,
    keywords: [...stop.aliases, operator, `${operator} ${stop.name}`],
  }
}

function publishedOption(stop: PublishedStop): StopOption {
  return {
    value: `published:${stop.stopId}`,
    ...(stop.snapshotId && { snapshotId: stop.snapshotId }),
    kind: 'published',
    label: stop.stopName,
    group: GROUP_PUBLISHED,
    hint: `Arrêt publié · ${stop.stopId}`,
    selectable: stop.lat !== null && stop.lon !== null,
    networkId: null,
    stopId: stop.stopId,
    lat: stop.lat,
    lon: stop.lon,
    keywords: [stop.stopId, stop.parentStation ?? ''],
  }
}

export function publishedStopOptions(stops: readonly PublishedStop[]): StopOption[] {
  return stops.filter(s => isValidLatLng(s.lat, s.lon)).map(publishedOption)
}

/** Index complet : mobilités, arrêts publiés, puis réseaux de référence. */
export function buildStopIndex(publishedStops: readonly PublishedStop[], reviewed: Iterable<Place> = [], snapshotId?: string): StopOption[] {
  const networks: StopOption[] = NETWORK_SOURCES.map((network) => {
    const stopCount =
      network.id === 'ter' ? TER_STOPS.length
        : network.id === 'brt' ? BRT_STOPS.length
          : network.id === 'ddd' ? DDD_STOPS.length
            : network.id === 'aftu_tata' ? AFTU_STOPS.length + TATA_STOPS.length : null
    return {
      value: `network:${network.id}`,
      kind: 'network' as const,
      label: network.referenceData?.shortName ?? network.label,
      group: GROUP_MOBILITY,
      hint: networkHint(network.id, stopCount),
      selectable: false,
      networkId: network.id,
      stopId: null,
      lat: null,
      lon: null,
      keywords: [...NETWORK_KEYWORDS[network.id], network.label, network.description],
    }
  })

  const catalogue: StopOption[] = [
    ...networks,
    ...publishedStopOptions(publishedStops),
    ...TER_STOPS.map((stop) => corridorOption(stop, 'ter', GROUP_TER)),
    ...BRT_STOPS.map((stop) => corridorOption(stop, 'brt', GROUP_BRT)),
    ...DDD_STOPS.map((stop) => corridorOption(stop, 'ddd', GROUP_DDD)),
    ...AFTU_STOPS.map((stop) => corridorOption(stop, 'aftu_tata', GROUP_AFTU_TATA)),
    ...TATA_STOPS.map((stop) => corridorOption(stop, 'aftu_tata', GROUP_AFTU_TATA)),
    ...busMapPoints.map(({ marker: p, lines, roadLimit }): StopOption => ({
      value: p.id, kind: 'landmark', label: p.name, group: 'Portions de bus cartographiées', selectable: true,
      networkId: null, stopId: null, lat: p.lat, lon: p.lon, keywords: [...lines],
      hint: `${[...lines].join(' / ')} · ${roadLimit ? 'limite de voirie, pas un quai' : 'quai cartographié'} · sans horaire`,
    })),
    ...JOURNEY_LANDMARKS.map((p): StopOption => ({
      value: p.id, kind: 'landmark', label: p.name, group: GROUP_LANDMARKS,
      hint: `${p.source} · repère, pas un quai`, selectable: true,
      networkId: null, stopId: null, lat: p.lat, lon: p.lon, keywords: [],
    })),
  ]
  for (const sheet of QUALIFIED_SHEET_LABELS) {
    const lines = [...sheet.lines].map(key => key.replace(':', ' ').toUpperCase())
    catalogue.push({ value: sheet.id, kind: 'sheet', label: sheet.name, group: 'Fiches sans coordonnées',
      hint: `Libellé de fiche (${lines.slice(0, 3).join(', ')}) · position du quai à confirmer`,
      selectable: false, networkId: null, stopId: null, lat: null, lon: null, keywords: [] })
  }
  const existing = new Set(catalogue.filter(o => o.kind !== 'published').map(o => o.value))
  const publishedIds = new Set(publishedStops.map(p => p.stopId))
  for (const p of reviewed) {
    if (p.id.startsWith('gtfs:')) {
      const prefix = `gtfs:${snapshotId}:stop:`
      if (!snapshotId || !p.id.startsWith(prefix)) continue
      const stopId = p.id.slice(prefix.length)
      if (!publishedIds.has(stopId)) catalogue.push(publishedOption({ snapshotId, stopId, stopName: p.name, lat: p.lat, lon: p.lon, distanceM: null, locationType: '0', parentStation: null }))
      continue
    }
    const landmark = p.id.startsWith('landmark:'), value = landmark ? p.id : `ref:${p.id}`
    if ((p.kind === 'path' && !landmark) || existing.has(value)) continue
    catalogue.push({ value, kind: landmark ? 'landmark' : 'reference', label: p.name, group: GROUP_ACCESSES,
      hint: p.kind === 'entrance' ? 'Entrée voyageurs vérifiée' : p.kind === 'platform' ? 'Quai vérifié' : p.kind === 'path' ? 'Repère piéton vérifié' : 'Point de desserte vérifié',
      selectable: true, networkId: null, stopId: landmark ? null : p.id, lat: p.lat, lon: p.lon, keywords: [] })
  }
  return catalogue
}

function scoreOption(option: StopOption, needle: string): number | null {
  if (!needle) return 0
  const label = normalizeSearchTerm(option.label)
  if (label === needle) return 0
  if (label.startsWith(needle)) return 1
  if (label.split(' ').some((word) => word.startsWith(needle))) return 2
  for (const keyword of option.keywords) {
    const normalized = normalizeSearchTerm(keyword)
    if (normalized === needle) return 2
    if (normalized.startsWith(needle)) return 3
    if (normalized.includes(needle)) return 4
  }
  if (label.includes(needle)) return 4
  return null
}

const GROUP_ORDER: readonly string[] = [GROUP_MOBILITY, GROUP_LANDMARKS, 'Portions de bus cartographiées', GROUP_ACCESSES, GROUP_PUBLISHED, GROUP_TER, GROUP_BRT, GROUP_DDD, GROUP_AFTU_TATA, 'Fiches sans coordonnées']

/**
 * Recherche tolérante (accents, apostrophes, tirets) sur l'index complet.
 * Aucun résultat n'est extrapolé : seules les correspondances explicites
 * et les mots-clés déclarés remontent.
 */
export function searchStopIndex(
  options: readonly StopOption[],
  query: string,
  limit = 12,
): StopOption[] {
  const needle = normalizeSearchTerm(query)
  if (!needle) return []
  const scored: { option: StopOption; score: number }[] = []
  for (const option of options) {
    const score = scoreOption(option, needle)
    if (score === null) continue
    scored.push({ option, score })
  }
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    const groupDelta = GROUP_ORDER.indexOf(a.option.group) - GROUP_ORDER.indexOf(b.option.group)
    if (groupDelta !== 0) return groupDelta
    return a.option.label.localeCompare(b.option.label, 'fr')
  })
  const seen = new Set<string>()
  return scored
    .filter((entry) => {
      if (seen.has(entry.option.value)) return false
      seen.add(entry.option.value)
      return true
    })
    .slice(0, limit)
    .map((entry) => entry.option)
}

export function findStopOption(options: readonly StopOption[], value: string): StopOption | null {
  return options.find((option) => option.value === value) ?? null
}
