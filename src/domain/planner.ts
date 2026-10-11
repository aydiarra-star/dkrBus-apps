/**
 * Calculateur d'itinéraires multimodal sur le réseau de référence.
 *
 * Ce moteur cherche un enchaînement réel de courses et de marches sur le
 * référentiel Dakar (TER, BRT, DDD, AFTU, TATA) : marche d'accès, attente,
 * montée, arrêts intermédiaires, descente, correspondance marchable, puis
 * marche finale. Les durées sont calculées à partir des distances entre arrêts
 * déclarés et des vitesses commerciales du modèle ; les attentes viennent des
 * fréquences officielles quand elles existent, d'une fréquence de repli sinon.
 *
 * Honnêteté :
 * - une durée reste une ESTIMATION : ni horaire de passage, ni position de
 *   véhicule, ni temps réel ;
 * - quand une ligne ne publie aucune grille de fréquence, le moteur bascule sur
 *   la fréquence de repli du modèle et le signale (`fallbacks`) avec une marge
 *   d'incertitude plus large — il ne présente jamais ce repli comme une
 *   information opérateur ;
 * - aucune correspondance n'est inventée : elles proviennent de
 *   `CORRIDOR_TRANSFERS` (déclarées) ou de `INTERMODAL_TRANSFERS` (estimées à
 *   partir des positions déjà enregistrées), et chacune est annoncée comme telle ;
 * - si aucune chaîne n'existe dans le graphe de référence, la réponse le dit.
 *
 * Espace de recherche : un état = (arrêt, situation) où la situation est « à
 * pied sur l'arrêt » ou « à bord de la ligne X sur l'arrêt ». Cette
 * modélisation est ce qui permet de compter réellement les correspondances, de
 * les pénaliser, et de comparer « plus rapide », « moins de marche » et « moins
 * de correspondances » sur le même graphe.
 */

import {
  BOARDING_WAIT_FRACTION,
  RELIABILITY_PENALTY_MIN,
  TRANSFER_BUFFER_MIN,
  UNCERTAINTY_MIN,
  accessRadiusOf,
  dwellMinutes,
  fallbackHeadwayMinutes,
  type AccessRadiusPreset,
  walkDisplayMinutes,
  walkSpeedOf,
  type WalkSpeedPreset,
} from './assumptions'
import {
  ALL_CORRIDOR_STOPS,
  CORRIDOR_LINES,
  TRANSFER_INDEX,
  getCorridorStop,
  haversineMeters,
  networkOfStopId,
  type CorridorLine,
  type CorridorStop,
} from './corridors'
import type { MobilityId } from './mobilityColors'
import { fareForJourney, type FareClass, type JourneyFare } from './fares'

export { DWELL_MIN, MAX_ACCESS_M } from './assumptions'

export interface PlannerEndpoint {
  label: string
  lat: number
  lon: number
  /** Quand le point est exactement un arrêt de référence. */
  stopId?: string
}

export type PlannerLegKind = 'walk_access' | 'walk_direct' | 'walk_transfer' | 'walk_egress' | 'ride' | 'wait'

export interface PlannerLeg {
  kind: PlannerLegKind
  /** Pour un trajet : ligne empruntée. */
  line?: CorridorLine
  from?: string
  to?: string
  fromId?: string
  toId?: string
  /** Distance en mètres (marche) — arrondie. */
  distanceM?: number
  /** Durée estimée en minutes (arrondie à la minute supérieure). */
  minutes: number
  /** Attente d'embarquement incluse dans `minutes` (trajets uniquement). */
  waitMinutes?: number
  /** Temps de roulement seul, hors attente et arrêts (trajets uniquement). */
  travelMinutes?: number
  /** Arrêts intermédiaires pour un trajet (hors montée/descente). */
  intermediateStops?: string[]
  /** Identifiants des arrêts intermédiaires, pour un affichage cliquable. */
  intermediateStopIds?: string[]
  /** Base de fréquence appliquée à cette course. */
  frequencyBasis?: 'officialReference' | 'estimatedFrequency'
  /** Le trajet est-il continu sur la même ligne (aucun changement à quai) ? */
  note?: string
}

/** Résumé d'une course, utilisé pour le calcul du tarif. */
export interface PlannerRideRef {
  line: CorridorLine
  fromStopId: string
  toStopId: string
}

export interface PlannerResult {
  ok: true
  legs: PlannerLeg[]
  totalMinutes: number
  totalWalkM: number
  transfers: number
  boardedLines: string[]
  limitation: string
  /** Marge d'incertitude affichée à côté de la durée (minutes). */
  uncertaintyMinutes: number
  /** Base de fréquence dominante du trajet. */
  frequencyBasis: 'officialReference' | 'estimatedFrequency' | 'mixed'
  /** Basculements sur une fréquence de repli, énoncés à l'usager. */
  fallbacks: string[]
  /** Réseaux réellement empruntés. */
  networksUsed: MobilityId[]
  /** Courses, pour la tarification. */
  rides: PlannerRideRef[]
  /** Tarif estimé, ou part connue. */
  fare: JourneyFare
  /** Distance totale parcourue (marche + véhicules), en mètres. */
  totalDistanceM: number
}

export interface PlannerFailure {
  ok: false
  reason: 'NO_ACCESSIBLE_STOP' | 'NO_PATH' | 'SAME_POINT'
  message: string
}

export type PlannerOutcome = PlannerResult | PlannerFailure

/** The default keeps the original fastest-route calculation unchanged. Other
 * priorities vary the search cost, never the duration displayed to the user. */
export type PlannerPriority = 'fastest' | 'lessWalking' | 'fewerTransfers' | 'lowestFare'

const WALK_WEIGHT: Record<PlannerPriority, number> = { fastest: 1, lessWalking: 6, fewerTransfers: 1, lowestFare: 1 }
const TRANSFER_PENALTY: Record<PlannerPriority, number> = { fastest: 0, lessWalking: 0, fewerTransfers: 60, lowestFare: 0 }
/** Pénalité de recherche par ticket : elle oriente la recherche, elle ne
 *  modifie jamais la durée affichée (100 F CFA ≈ 1 min de coût de recherche). */
const FARE_WEIGHT: Record<PlannerPriority, number> = { fastest: 0, lessWalking: 0, fewerTransfers: 0, lowestFare: 0.01 }

export interface PlannerOptions {
  priority?: PlannerPriority
  /** Réseaux autorisés (préférence « modes de transport »). Vide = tous. */
  allowedNetworks?: readonly MobilityId[] | null
  /** Vitesse de marche, en m/min (réglage d'accessibilité). */
  walkSpeedMpm?: number
  walkSpeedPreset?: WalkSpeedPreset
  /** Rayon de marche d'accès, en mètres. */
  maxAccessM?: number
  accessRadius?: AccessRadiusPreset
  /** Classe TER retenue pour le tarif. */
  terClass?: FareClass
}

interface GraphEdge {
  to: string
  /** Coût de recherche (minutes pondérées, pénalités incluses). */
  cost: number
  /** Minutes réelles ajoutées, hors pénalités de recherche. */
  elapsed: number
  leg: PlannerLeg
}

interface NodeState {
  cost: number
  /** Unweighted elapsed time: optimization penalties are not travel time. */
  elapsed: number
  previous: string | null
  edge: GraphEdge | null
}

function onFootKey(stopId: string): string {
  return `@${stopId}`
}

function onBoardKey(stopId: string, lineId: string): string {
  return `~${stopId}|${lineId}`
}

function parseKey(key: string): { stopId: string; lineId: string | null } {
  if (key.startsWith('@')) return { stopId: key.slice(1), lineId: null }
  const body = key.slice(1)
  const index = body.lastIndexOf('|')
  return { stopId: body.slice(0, index), lineId: body.slice(index + 1) }
}

/** Intervalle réellement appliqué à une ligne, et sa nature.
 * Une ligne sans grille publiée reçoit la fréquence de repli du modèle :
 * l'écart est signalé, jamais masqué. */
export function headwayForLine(line: CorridorLine): { minutes: number; basis: 'officialReference' | 'estimatedFrequency'; fallback: string | null } {
  if (line.frequencyStatus === 'OFFICIAL_REFERENCE' || line.frequencyStatus === 'SCHEDULED') {
    return { minutes: line.headwayMin, basis: 'officialReference', fallback: null }
  }
  const fallback = fallbackHeadwayMinutes(line.network)
  if (fallback === line.headwayMin) {
    return { minutes: fallback, basis: 'estimatedFrequency', fallback: `${line.shortName} : aucune grille de fréquence publiée ligne par ligne, intervalle de repli de ${fallback} min retenu par le modèle.` }
  }
  return {
    minutes: fallback,
    basis: 'estimatedFrequency',
    fallback: `${line.shortName} : intervalle non publié ligne par ligne ; fréquence de repli de ${fallback} min retenue par le modèle à la place des ${line.headwayMin} min inscrits dans la fiche.`,
  }
}

function rideMinutes(line: CorridorLine, fromOrder: number, toOrder: number): { minutes: number; distanceM: number; intermediate: string[]; intermediateIds: string[] } {
  const start = Math.min(fromOrder, toOrder)
  const end = Math.max(fromOrder, toOrder)
  let distanceM = 0
  for (let index = start; index < end; index += 1) {
    const a = getCorridorStop(line.stopIds[index])
    const b = getCorridorStop(line.stopIds[index + 1])
    if (a && b) distanceM += haversineMeters(a, b)
  }
  const travel = (distanceM / 1000 / line.speedKph) * 60
  const dwell = (end - start - 1) * dwellMinutes(line.network)
  const intermediateIds = line.stopIds.slice(start + 1, end)
  const intermediate = intermediateIds.map((id) => getCorridorStop(id)?.name ?? id)
  return { minutes: travel + dwell, distanceM, intermediate, intermediateIds }
}

function walkLeg(kind: PlannerLegKind, from: string, to: string, meters: number, speedMpm: number): PlannerLeg {
  return {
    kind,
    from,
    to,
    distanceM: Math.round(meters),
    minutes: walkDisplayMinutes(meters, speedMpm),
  }
}

function linesAt(stopId: string, allowed: readonly MobilityId[] | null): CorridorLine[] {
  return CORRIDOR_LINES.filter((line) => line.stopIds.includes(stopId) && (!allowed || allowed.includes(line.network)))
}

/**
 * Calcule le meilleur enchaînement multimodal entre deux points.
 * Les points peuvent être des coordonnées libres (clic carte, GPS) ou des
 * arrêts de référence choisis dans la liste.
 */
export function planReferenceJourney(
  origin: PlannerEndpoint,
  destination: PlannerEndpoint,
  priority: PlannerPriority = 'fastest',
  options: PlannerOptions = {},
): PlannerOutcome {
  return planWith(origin, destination, {
    priority,
    allowedNetworks: options.allowedNetworks && options.allowedNetworks.length > 0 ? [...options.allowedNetworks] : null,
    terClass: options.terClass ?? 'second',
    walkSpeedMpm: options.walkSpeedMpm ?? walkSpeedOf(options.walkSpeedPreset),
    maxAccessM: options.maxAccessM ?? accessRadiusOf(options.accessRadius),
  })
}

interface ResolvedOptions {
  priority: PlannerPriority
  allowedNetworks: MobilityId[] | null
  terClass: FareClass
  walkSpeedMpm: number
  maxAccessM: number
}

function planWith(
  origin: PlannerEndpoint,
  destination: PlannerEndpoint,
  options: ResolvedOptions,
): PlannerOutcome {
  const priority = options.priority
  const walkWeight = WALK_WEIGHT[priority]
  const transferPenalty = TRANSFER_PENALTY[priority]
  const fareWeight = FARE_WEIGHT[priority]
  const walkSpeed = options.walkSpeedMpm
  const allowed = options.allowedNetworks
  const maxAccessM = Math.max(1, options.maxAccessM)
  if (Math.abs(origin.lat - destination.lat) < 1e-9 && Math.abs(origin.lon - destination.lon) < 1e-9) {
    return { ok: false, reason: 'SAME_POINT', message: 'Le départ et la destination sont identiques : aucun trajet à calculer.' }
  }

  const accessible = (point: PlannerEndpoint) =>
    ALL_CORRIDOR_STOPS.map((stop) => ({
      stop,
      meters: point.stopId === stop.id ? 0 : haversineMeters(point, stop),
    }))
      .filter((entry) => entry.meters <= maxAccessM)
      .sort((a, b) => a.meters - b.meters)

  // Arrêts accessibles à pied depuis le départ / vers la destination.
  const access = accessible(origin)
  const egress = accessible(destination)
  const networkHint = allowed && allowed.length > 0 ? ` Réseaux autorisés : ${allowed.join(', ')}.` : ''

  if (access.length === 0 || egress.length === 0) {
    const side = access.length === 0 ? 'votre départ' : 'votre destination'
    return {
      ok: false,
      reason: 'NO_ACCESSIBLE_STOP',
      message: allowed
        ? `Aucun arrêt des réseaux autorisés à moins de ${formatMeters(maxAccessM)} de ${side}. Élargissez le rayon de marche ou réactivez un réseau dans Paramètres → Préférences de mobilité.`
        : `Aucun arrêt du réseau de référence à moins de ${formatMeters(maxAccessM)} de ${side}.${networkHint}`,
    }
  }

  const states = new Map<string, NodeState>()
  const queue: string[] = []

  for (const entry of access) {
    const minutes = entry.meters / walkSpeed
    const key = onFootKey(entry.stop.id)
    const state: NodeState = {
      cost: minutes * walkWeight,
      elapsed: minutes,
      previous: null,
      edge: entry.meters > 0
        ? { to: key, cost: 0, elapsed: minutes, leg: walkLeg('walk_access', origin.label, entry.stop.name, entry.meters, walkSpeed) }
        : null,
    }
    const existing = states.get(key)
    if (!existing || state.cost < existing.cost - 1e-9) {
      states.set(key, state)
      if (!queue.includes(key)) queue.push(key)
    }
  }

  const relax = (fromKey: string, edge: GraphEdge) => {
    const current = states.get(fromKey)
    if (!current) return
    const nextCost = current.cost + edge.cost
    const existing = states.get(edge.to)
    if (!existing || nextCost < existing.cost - 1e-9) {
      states.set(edge.to, { cost: nextCost, elapsed: current.elapsed + edge.elapsed, previous: fromKey, edge })
      if (!queue.includes(edge.to)) queue.push(edge.to)
    }
  }

  let expanded = 0
  while (queue.length > 0 && expanded < 60_000) {
    // File de priorité simple : extrait le coût minimal.
    let bestIndex = 0
    for (let index = 1; index < queue.length; index += 1) {
      const candidate = states.get(queue[index])?.cost ?? Number.POSITIVE_INFINITY
      const best = states.get(queue[bestIndex])?.cost ?? Number.POSITIVE_INFINITY
      if (candidate < best) bestIndex = index
    }
    const currentKey = queue.splice(bestIndex, 1)[0]
    const current = states.get(currentKey)
    expanded += 1
    if (!current) continue
    const { stopId: currentStopId, lineId: ridingLineId } = parseKey(currentKey)
    const currentStop = getCorridorStop(currentStopId)
    if (!currentStop) continue

    if (ridingLineId === null) {
      // 1) Embarquer : l'attente dépend de la fréquence publiée, ou du repli.
      for (const line of linesAt(currentStopId, allowed)) {
        const headway = headwayForLine(line)
        const wait = headway.minutes * BOARDING_WAIT_FRACTION
        // Une ligne sans grille publiée reçoit une pénalité de classement : elle
        // reste proposée (son estimation est affichée), mais elle ne détrône pas
        // un réseau à fréquence publiée à durée égale.
        const reliabilityPenalty = headway.basis === 'officialReference' ? 0 : RELIABILITY_PENALTY_MIN
        relax(currentKey, {
          to: onBoardKey(currentStopId, line.id),
          cost: wait + reliabilityPenalty,
          elapsed: wait,
          leg: {
            kind: 'wait',
            line,
            from: currentStop.name,
            to: currentStop.name,
            toId: currentStopId,
            minutes: Math.max(1, Math.round(wait)),
            frequencyBasis: headway.basis,
            note: headway.fallback ?? undefined,
          },
        })
      }

      // 2) Correspondances marchables (déclarées ou estimées au même pôle).
      for (const transfer of TRANSFER_INDEX.get(currentStopId) ?? []) {
        const otherId = transfer.fromStopId === currentStopId ? transfer.toStopId : transfer.fromStopId
        const otherStop = getCorridorStop(otherId)
        if (!otherStop) continue
        if (allowed && !allowed.includes(networkOfStopId(otherId) as MobilityId)) continue
        // Le battement de correspondance fait partie de la durée subie : il est
        // ajouté aux minutes de la jambe, pas seulement au coût de recherche.
        const walkMinutes = transfer.walkM / walkSpeed
        const minutes = walkMinutes + TRANSFER_BUFFER_MIN
        const displayed = walkDisplayMinutes(transfer.walkM, walkSpeed) + TRANSFER_BUFFER_MIN
        relax(currentKey, {
          to: onFootKey(otherId),
          cost: minutes * walkWeight + transferPenalty,
          elapsed: minutes,
          leg: {
            ...walkLeg('walk_transfer', currentStop.name, otherStop.name, transfer.walkM, walkSpeed),
            minutes: displayed,
            fromId: currentStopId,
            toId: otherId,
            note: `${transfer.label} · battement de ${TRANSFER_BUFFER_MIN} min ajouté`,
          },
        })
      }
      continue
    }

    // 3) À bord : avancer d'un arrêt, ou descendre ici.
    const line = CORRIDOR_LINES.find((candidate) => candidate.id === ridingLineId)
    if (!line) continue
    const fromOrder = line.stopIds.indexOf(currentStopId)
    if (fromOrder < 0) continue
    const neighbours = [fromOrder - 1, fromOrder + 1]
    for (const toOrder of neighbours) {
      if (toOrder < 0 || toOrder >= line.stopIds.length) continue
      const targetId = line.stopIds[toOrder]
      const target = getCorridorStop(targetId)
      if (!target) continue
      const segment = rideMinutes(line, fromOrder, toOrder)
      const dwell = dwellMinutes(line.network)
      const minutes = segment.minutes + dwell
      const fare = fareForJourney([{ line, fromStopId: currentStopId, toStopId: targetId }], { terClass: options.terClass })
      relax(currentKey, {
        to: onBoardKey(targetId, line.id),
        cost: minutes + (fare.totalCfa ?? fare.knownSubtotalCfa ?? 0) * fareWeight,
        elapsed: minutes,
        leg: {
          kind: 'ride',
          line,
          from: currentStop.name,
          to: target.name,
          fromId: currentStopId,
          toId: targetId,
          distanceM: Math.round(segment.distanceM),
          minutes: Math.max(1, Math.round(minutes)),
          travelMinutes: Math.max(1, Math.round(segment.minutes)),
          intermediateStops: segment.intermediate,
          intermediateStopIds: segment.intermediateIds,
          frequencyBasis: headwayForLine(line).basis,
        },
      })
    }
    // Descendre à l'arrêt courant : coût nul, mais un état « à pied » existe déjà
    // ou est créé ici pour permettre la poursuite à pied / en correspondance.
    relax(currentKey, {
      to: onFootKey(currentStopId),
      cost: 0,
      elapsed: 0,
      leg: { kind: 'wait', minutes: 0, note: `Descente à ${currentStop.name}.` },
    })
  }

  // Meilleure arrivée : arrêt accessible à la destination, marche finale incluse.
  let best: { stopId: string; meters: number; cost: number; elapsed: number } | null = null
  for (const entry of egress) {
    const state = states.get(onFootKey(entry.stop.id))
    if (!state) continue
    const cost = state.cost + (entry.meters / walkSpeed) * walkWeight
    if (!best || cost < best.cost - 1e-9) {
      best = { stopId: entry.stop.id, meters: entry.meters, cost, elapsed: state.elapsed + entry.meters / walkSpeed }
    }
  }
  if (!best) {
    return {
      ok: false,
      reason: 'NO_PATH',
      message: allowed
        ? `Aucun enchaînement calculable entre ces deux points avec les réseaux autorisés (${allowed.join(', ')}).`
        : 'Aucun enchaînement calculable entre ces deux points sur le réseau de référence.',
    }
  }

  // Reconstruction du chemin.
  const rawLegs: PlannerLeg[] = []
  let cursor: string | null = onFootKey(best.stopId)
  const visited = new Set<string>()
  while (cursor) {
    if (visited.has(cursor)) break
    visited.add(cursor)
    const state = states.get(cursor)
    if (!state) break
    if (state.edge && state.edge.leg.minutes > 0) rawLegs.unshift(state.edge.leg)
    cursor = state.previous
  }
  if (best.meters > 0) {
    const stop = getCorridorStop(best.stopId)
    rawLegs.push(walkLeg('walk_egress', stop?.name ?? 'Arrêt', destination.label, best.meters, walkSpeed))
  }

  const legs = mergeLegs(rawLegs)
  const rides = collectRides(legs)
  const fare = fareForJourney(rides, { terClass: options.terClass })
  const boardedLines = [...new Set(legs.filter((leg) => leg.kind === 'ride' && leg.line).map((leg) => leg.line!.shortName))]
  const walkOnlyLegs = legs.filter((leg) => leg.kind !== 'ride')
  const totalWalkM = walkOnlyLegs.reduce((total, leg) => total + (leg.distanceM ?? 0), 0)
  const transfers = legs.filter((leg) => leg.kind === 'walk_transfer').length

  // Aucun véhicule emprunté : la chaîne « marche vers un arrêt puis marche vers
  // la destination » n'est qu'un détour. La marche directe entre les deux points
  // est toujours au moins aussi courte (inégalité triangulaire) : c'est elle qui
  // est rendue, plutôt qu'un itinéraire plus long sans aucun transport dedans.
  if (boardedLines.length === 0) {
    const meters = haversineMeters(origin, destination)
    const directLeg = { ...walkLeg('walk_direct', origin.label, destination.label, meters, walkSpeed), fromId: origin.stopId, toId: destination.stopId }
    return {
      ok: true,
      legs: [directLeg],
      totalMinutes: directLeg.minutes,
      totalWalkM: directLeg.distanceM ?? 0,
      totalDistanceM: directLeg.distanceM ?? 0,
      transfers: 0,
      boardedLines: [],
      rides: [],
      fare: fareForJourney([]),
      networksUsed: [],
      frequencyBasis: 'officialReference',
      uncertaintyMinutes: 0,
      fallbacks: [],
      limitation: 'Trajet à pied : aucun trajet du réseau de référence ne raccourcit ce déplacement.',
    }
  }

  const bases = legs.filter((leg) => leg.kind === 'ride').map((leg) => leg.frequencyBasis ?? 'officialReference')
  const basis = bases.every((value) => value === 'officialReference')
    ? 'officialReference'
    : bases.every((value) => value === 'estimatedFrequency') ? 'estimatedFrequency' : 'mixed'
  const uncertainty = uncertaintyOf(bases, transfers)
  const fallbacks = [...new Set(legs.filter((leg) => leg.kind === 'wait' && leg.note && leg.note.includes('repli')).map((leg) => leg.note!))]
  const networksUsed = [...new Set(legs.filter((leg) => leg.kind === 'ride' && leg.line).map((leg) => leg.line!.network))] as MobilityId[]
  const totalDistanceM = legs.reduce((total, leg) => total + (leg.distanceM ?? 0), 0)

  return {
    ok: true,
    legs,
    totalMinutes: Math.max(1, Math.round(best.elapsed)),
    totalWalkM,
    totalDistanceM,
    transfers,
    boardedLines,
    rides,
    fare,
    networksUsed,
    frequencyBasis: basis,
    uncertaintyMinutes: uncertainty,
    fallbacks,
    limitation:
      basis === 'officialReference'
        ? 'Estimation du réseau de référence sur les fréquences officielles publiées (le TER retient son headway maximal, faute d’heure choisie). Ce n’est ni un horaire, ni du temps réel.'
        : 'Estimation du réseau de référence : au moins une ligne empruntée ne publie pas de grille de fréquence, le moteur a basculé sur une fréquence estimée. Ce n’est ni un horaire, ni du temps réel.',
  }
}

/** Fusionne les parcours arrêt à arrêt en jambes lisibles : une même ligne
 *  consécutive devient une seule jambe, l'attente reste une étape à part
 *  (elle dit à l'usager combien de temps il attend, et sur quelle ligne). */
function mergeLegs(rawLegs: readonly PlannerLeg[]): PlannerLeg[] {
  const legs: PlannerLeg[] = []
  for (const leg of rawLegs) {
    if (leg.minutes <= 0) continue
    const last = legs[legs.length - 1]
    if (leg.kind === 'ride' && last?.kind === 'ride' && last.line?.id === leg.line?.id) {
      last.to = leg.to
      last.toId = leg.toId
      last.minutes += leg.minutes
      last.travelMinutes = (last.travelMinutes ?? 0) + (leg.travelMinutes ?? 0)
      last.distanceM = (last.distanceM ?? 0) + (leg.distanceM ?? 0)
      last.intermediateStops = [...(last.intermediateStops ?? []), ...(leg.intermediateStops ?? []), ...(leg.from ? [leg.from] : [])]
      last.intermediateStopIds = [...(last.intermediateStopIds ?? []), ...(leg.intermediateStopIds ?? []), ...(leg.fromId ? [leg.fromId] : [])]
      continue
    }
    if (leg.kind === 'ride') {
      const wait = last?.kind === 'wait' && leg.line && last.line?.id === leg.line.id ? last.minutes : undefined
      legs.push({
        ...leg,
        waitMinutes: wait,
        intermediateStops: [...(leg.intermediateStops ?? [])],
        intermediateStopIds: [...(leg.intermediateStopIds ?? [])],
      })
      continue
    }
    legs.push(leg)
  }
  return legs
}

function collectRides(legs: readonly PlannerLeg[]): PlannerRideRef[] {
  const rides: PlannerRideRef[] = []
  for (const leg of legs) {
    if (leg.kind !== 'ride' || !leg.line || !leg.fromId || !leg.toId) continue
    rides.push({ line: leg.line, fromStopId: leg.fromId, toStopId: leg.toId })
  }
  return rides
}

/** Marge d'incertitude : la base de fréquence la plus fragile impose l'écart,
 *  chaque correspondance ajoute sa part d'attente non mesurée. Ces valeurs sont
 *  des hypothèses du modèle (`UNCERTAINTY_MIN`), pas des écarts constatés. */
export function uncertaintyOf(bases: readonly ('officialReference' | 'estimatedFrequency')[], transfers = 0): number {
  const worst = bases.includes('estimatedFrequency') ? UNCERTAINTY_MIN.estimatedFrequency : UNCERTAINTY_MIN.officialReference
  return worst + transfers * 2
}

/** Résumé lisible d'une jambe pour l'interface et l'assistant. */
export function describeLeg(leg: PlannerLeg): string {
  switch (leg.kind) {
    case 'walk_access':
      return `Marcher ${formatMeters(leg.distanceM)} jusqu’à ${leg.to} (~${leg.minutes} min)`
    case 'walk_direct':
      return `Trajet à pied ${formatMeters(leg.distanceM)} : ${leg.from} → ${leg.to} (~${leg.minutes} min)`
    case 'walk_egress':
      return `Marcher ${formatMeters(leg.distanceM)} jusqu’à ${leg.to} (~${leg.minutes} min)`
    case 'walk_transfer':
      return `Correspondance à pied ${formatMeters(leg.distanceM)} : ${leg.from} → ${leg.to} (~${leg.minutes} min)`
    case 'ride': {
      const via = leg.intermediateStops && leg.intermediateStops.length > 0 ? ` via ${leg.intermediateStops.join(', ')}` : ''
      return `${leg.line?.shortName ?? 'Ligne'} : ${leg.from} → ${leg.to}${via} (~${leg.minutes} min)`
    }
    case 'wait':
      return `Attendre ${leg.line?.shortName ?? 'le véhicule'}${leg.from ? ` à ${leg.from}` : ''} (~${leg.minutes} min)${leg.note ? ` — ${leg.note}` : ''}`
    default:
      return leg.from ?? ''
  }
}

export function formatMeters(meters: number | undefined): string {
  if (meters === undefined) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

/** Arrêts desservis par une ligne entre deux arrêts donnés, dans l'ordre de parcours. */
export function stopsServedBetween(line: CorridorLine, fromStopId: string, toStopId: string): CorridorStop[] {
  const from = line.stopIds.indexOf(fromStopId)
  const to = line.stopIds.indexOf(toStopId)
  if (from < 0 || to < 0) return []
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  const ordered = line.stopIds.slice(start, end + 1).map((id) => getCorridorStop(id)).filter((stop): stop is CorridorStop => Boolean(stop))
  return from <= to ? ordered : ordered.reverse()
}

/** Libellés affichés pour chaque critère de recherche. */
export const PRIORITY_LABELS: Record<PlannerPriority, string> = {
  fastest: 'Le plus rapide',
  fewerTransfers: 'Le moins de correspondances',
  lessWalking: 'Le moins de marche',
  lowestFare: 'Le moins cher',
}

export const PRIORITY_HINTS: Record<PlannerPriority, string> = {
  fastest: 'Privilégie les réseaux les plus fréquents et les plus rapides du référentiel.',
  fewerTransfers: 'Limite les changements de véhicule, même si le parcours est un peu plus long.',
  lessWalking: 'Réduit la distance marchée, quitte à attendre plus longtemps.',
  lowestFare: 'Additionne les tickets publiés ; proposé seulement quand tous les tarifs sont déclarés.',
}
