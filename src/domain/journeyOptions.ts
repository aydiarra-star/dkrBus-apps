/**
 * Jeu d'options de trajet — ce que l'écran Trajet affiche réellement.
 *
 * Le moteur calcule plusieurs itinéraires sur le même graphe de référence en
 * changeant uniquement la fonction de coût de la recherche :
 *   1. le plus rapide (durée minimale ; TER et BRT avantagent naturellement ce
 *      critère, ce sont les réseaux les plus fréquents et les plus rapides du
 *      référentiel) ;
 *   2. le moins de correspondances (forte pénalité par changement) ;
 *   3. la marche minimale (la marche pèse lourd dans le coût) ;
 *   4. le moins cher, UNIQUEMENT quand les courses en présence ont toutes une
 *      grille tarifaire publiée (TER, BRT). Dès qu'un réseau sans tarif déclaré
 *      (DDD, AFTU, TATA) entre dans la comparaison, cette option n'est pas
 *      produite et la raison est affichée : aucun prix n'est inventé.
 *
 * Les options sont dédupliquées sur les étapes réellement obtenues : deux pesées
 * qui aboutissent au même parcours ne font pas deux « choix ». Quand moins de
 * trois options sont calculables, le module le dit au lieu d'en fabriquer.
 *
 * Plan A / Plan B : `planRoundTrip` calcule l'aller et le retour séparément, et
 * `alternativeOf` désigne le repli réellement calculé (l'option suivante).
 * Aucune perturbation n'étant connectée à l'application, le repli est une autre
 * combinaison calculable, jamais une promesse de service.
 */

import {
  PRIORITY_HINTS,
  PRIORITY_LABELS,
  formatMeters,
  planReferenceJourney,
  type PlannerEndpoint,
  type PlannerFailure,
  type PlannerPriority,
  type PlannerResult,
} from './planner'
import { fareStatusLabel, type FareClass } from './fares'
import type { MobilityId } from './mobilityColors'
import type { AccessRadiusPreset, WalkSpeedPreset } from './assumptions'

export interface JourneyPlanPreferences {
  /** Réseaux autorisés par l'usager (Paramètres → Préférences de mobilité). */
  allowedNetworks?: readonly MobilityId[] | null
  walkSpeed?: WalkSpeedPreset
  accessRadius?: AccessRadiusPreset
  terClass?: FareClass
  /** Battement ajouté à chaque correspondance (min), réglage de confort. */
  transferBufferMin?: number
}

export interface JourneyOption {
  key: string
  priority: PlannerPriority
  label: string
  tagline: string
  result: PlannerResult
  metrics: {
    minutes: number
    /** Durée présentée avec le battement choisi par l'usager. */
    displayMinutes: number
    uncertaintyMinutes: number
    walkMeters: number
    transfers: number
    distanceMeters: number
    waitMinutes: number
    rideMinutes: number
    fareCfa: number | null
    fareLabel: string
    fareStatus: 'KNOWN' | 'PARTIAL' | 'UNKNOWN'
    fareNote: string
  }
  best: { duration: boolean; walking: boolean; transfers: boolean; fare: boolean }
  /** Réseaux réellement empruntés, dans l'ordre de parcours. */
  networks: MobilityId[]
}

export interface JourneyPlan {
  ok: true
  direction: 'outbound' | 'return'
  originLabel: string
  destinationLabel: string
  options: JourneyOption[]
  /** Écart de durée entre la meilleure et la moins bonne option (minutes). */
  spreadMinutes: number
  /** Ce que l'usager doit savoir, énoncé une seule fois sous la liste. */
  notes: string[]
  limitation: string
  frequencyBasis: 'officialReference' | 'estimatedFrequency' | 'mixed'
  fallbacks: string[]
}

export type JourneyPlanOutcome = JourneyPlan | (PlannerFailure & { ok: false })

export type EngineOptions = {
  allowedNetworks: MobilityId[] | null
  walkSpeedPreset?: WalkSpeedPreset
  accessRadius?: AccessRadiusPreset
  terClass?: FareClass
}

export function resolvePlanOptions(preferences: JourneyPlanPreferences = {}): EngineOptions {
  return {
    allowedNetworks: preferences.allowedNetworks && preferences.allowedNetworks.length > 0 ? [...preferences.allowedNetworks] : null,
    walkSpeedPreset: preferences.walkSpeed,
    accessRadius: preferences.accessRadius,
    terClass: preferences.terClass,
  }
}

const PRIORITY_ORDER: readonly PlannerPriority[] = ['fastest', 'fewerTransfers', 'lessWalking']

function routeFingerprint(result: PlannerResult): string {
  return result.legs
    .map((leg) => [leg.kind, leg.line?.id ?? '', leg.fromId ?? leg.from ?? '', leg.toId ?? leg.to ?? ''].join(':'))
    .join('|')
}

function indexOfMin(values: readonly number[]): number {
  return values.reduce((best, value, index) => (value < values[best] ? index : best), 0)
}

function indexOfMinPrice(values: readonly (number | null)[]): number | null {
  let best: number | null = null
  values.forEach((value, index) => {
    if (value === null) return
    if (best === null || value < (values[best] ?? Number.POSITIVE_INFINITY)) best = index
  })
  return best
}

function toOption(
  entry: { priority: PlannerPriority; result: PlannerResult },
  direction: 'outbound' | 'return',
  best: JourneyOption['best'],
  bufferMinutes: number,
): JourneyOption {
  const result = entry.result
  const waitMinutes = result.legs.filter((leg) => leg.kind === 'wait').reduce((total, leg) => total + leg.minutes, 0)
  const rideMinutes = result.legs.filter((leg) => leg.kind === 'ride').reduce((total, leg) => total + leg.minutes, 0)
  return {
    key: `${direction}-${entry.priority}`,
    priority: entry.priority,
    label: PRIORITY_LABELS[entry.priority],
    tagline: PRIORITY_HINTS[entry.priority],
    result,
    metrics: {
      minutes: result.totalMinutes,
      displayMinutes: result.totalMinutes + bufferMinutes * result.transfers,
      uncertaintyMinutes: result.uncertaintyMinutes,
      walkMeters: result.totalWalkM,
      transfers: result.transfers,
      distanceMeters: result.totalDistanceM,
      waitMinutes,
      rideMinutes,
      fareCfa: result.fare.totalCfa,
      fareLabel: fareStatusLabel(result.fare),
      fareStatus: result.fare.status,
      fareNote: result.fare.note,
    },
    best,
    networks: result.networksUsed,
  }
}

/** Construit le jeu d'options pour un sens donné. */
export function planJourneyOptions(
  origin: PlannerEndpoint,
  destination: PlannerEndpoint,
  preferences: JourneyPlanPreferences = {},
  direction: 'outbound' | 'return' = 'outbound',
): JourneyPlanOutcome {
  const engine = resolvePlanOptions(preferences)
  const results: { priority: PlannerPriority; result: PlannerResult }[] = []
  const seen = new Set<string>()
  for (const priority of PRIORITY_ORDER) {
    const outcome = planReferenceJourney(origin, destination, priority, engine)
    if (!outcome.ok) {
      if (results.length === 0) return outcome
      continue
    }
    const fingerprint = routeFingerprint(outcome)
    if (seen.has(fingerprint)) continue
    seen.add(fingerprint)
    results.push({ priority, result: outcome })
  }
  if (results.length === 0) {
    const fallback = planReferenceJourney(origin, destination, 'fastest', engine)
    if (!fallback.ok) return fallback
    results.push({ priority: 'fastest', result: fallback })
  }

  // « Le moins cher » : ajouté seulement s'il désigne un parcours réellement
  // distinct, et seulement si les tarifs en présence sont publiés de part et
  // d'autre de la comparaison.
  const priceable = results.filter((entry) => entry.result.fare.status === 'KNOWN')
  let fareNote: string | null = null
  if (priceable.length >= 2) {
    const priced = planReferenceJourney(origin, destination, 'lowestFare', engine)
    if (priced.ok && !seen.has(routeFingerprint(priced))) {
      seen.add(routeFingerprint(priced))
      results.push({ priority: 'lowestFare', result: priced })
    }
  } else if (results.some((entry) => entry.result.fare.status !== 'KNOWN')) {
    const missing = [...new Set(results.flatMap((entry) => entry.result.fare.legs.filter((leg) => leg.amountCfa === null).map((leg) => leg.shortName)))]
    fareNote = missing.length > 0
      ? `Le moins cher ne peut pas être désigné : aucun tarif publié pour ${missing.join(', ')}. La part connue reste affichée sur chaque option.`
      : 'Le moins cher ne peut pas être désigné : les grilles publiées ne couvrent pas ce parcours.'
  }

  const minutes = results.map((entry) => entry.result.totalMinutes)
  const walks = results.map((entry) => entry.result.totalWalkM)
  const transfers = results.map((entry) => entry.result.transfers)
  const fares = results.map((entry) => entry.result.fare.totalCfa)
  const bestDuration = indexOfMin(minutes)
  const bestWalk = indexOfMin(walks)
  const bestTransfer = indexOfMin(transfers)
  const bestFare = fares.length > 1 ? indexOfMinPrice(fares) : null

  const buffer = Math.max(0, Math.min(5, Math.round(preferences.transferBufferMin ?? 0)))
  let options = results.map((entry, index) =>
    toOption(
      entry,
      direction,
      { duration: index === bestDuration, walking: index === bestWalk, transfers: index === bestTransfer, fare: bestFare !== null && index === bestFare && fares[index] !== null },
      buffer,
    ),
  )
  // L'ordre de lecture : le plus rapide d'abord, puis les variantes comparables.
  options = [...options].sort((a, b) => a.metrics.displayMinutes - b.metrics.displayMinutes || a.metrics.transfers - b.metrics.transfers)

  const notes: string[] = []
  if (options.length < 3) {
    notes.push(options.length === 1
      ? 'Un seul itinéraire est calculable sur le réseau de référence entre ces deux points : aucune variante comparable n’existe, rien n’est ajouté pour remplir la liste.'
      : 'Deux itinéraires seulement sont distinctement calculables ici : le troisième critère aboutit au même parcours et n’est pas dupliqué.')
  }
  if (fareNote) notes.push(fareNote)
  const fallbacks = [...new Set(options.flatMap((option) => option.result.fallbacks))]
  if (fallbacks.length > 0) {
    notes.push('Le moteur a basculé sur une fréquence estimée pour certaines lignes : la durée annoncée porte une marge plus large que pour le TER et le BRT, dont les grilles sont publiées.')
  }
  if (buffer > 0) notes.push(`${buffer} min de battement ajoutées à chaque correspondance, selon votre réglage de mobilité.`)

  const basis = options.every((option) => option.result.frequencyBasis === 'officialReference')
    ? 'officialReference'
    : options.every((option) => option.result.frequencyBasis === 'estimatedFrequency') ? 'estimatedFrequency' : 'mixed'

  return {
    ok: true,
    direction,
    originLabel: origin.label,
    destinationLabel: destination.label,
    options,
    spreadMinutes: Math.max(0, Math.max(...minutes) - Math.min(...minutes)),
    notes,
    limitation: options[0]?.result.limitation ?? 'Aucune limite particulière signalée par le moteur.',
    frequencyBasis: basis,
    fallbacks,
  }
}

/** Aller et retour calculés séparément : le retour est recalculé dans l'autre
 *  sens sur le même référentiel, il n'est pas un aller recopié. */
export function planRoundTrip(
  origin: PlannerEndpoint,
  destination: PlannerEndpoint,
  preferences: JourneyPlanPreferences = {},
): { ok: true; outbound: JourneyPlan; return: JourneyPlan | (PlannerFailure & { ok: false }) } | { ok: false; failure: PlannerFailure } {
  const outbound = planJourneyOptions(origin, destination, preferences, 'outbound')
  if (!outbound.ok) return { ok: false, failure: outbound }
  const returned = planJourneyOptions(destination, origin, preferences, 'return')
  return { ok: true, outbound, return: returned }
}

/** Repli réellement calculé : la prochaine option distincte du même plan. */
export function alternativeOf(plan: JourneyPlan, key: string): JourneyOption | null {
  const index = plan.options.findIndex((option) => option.key === key)
  if (index < 0 || plan.options.length < 2) return null
  return plan.options[(index + 1) % plan.options.length] ?? null
}

export function optionByIndex(plan: JourneyPlan, index: number): JourneyOption {
  return plan.options[Math.max(0, Math.min(plan.options.length - 1, index))]
}

export function describeOption(option: JourneyOption): string {
  const uncertainty = option.metrics.uncertaintyMinutes > 0 ? ` ±${option.metrics.uncertaintyMinutes} min` : ''
  return `≈ ${option.metrics.displayMinutes} min${uncertainty} · ${formatMeters(option.metrics.walkMeters)} de marche · ${option.metrics.transfers} correspondance${option.metrics.transfers > 1 ? 's' : ''} · ${option.metrics.fareLabel}`
}

/** Une ligne par option — ce que lit l'assistant comme ce que voit l'écran. */
export function optionSummaryLine(option: JourneyOption): string {
  const lines = option.result.boardedLines.length > 0 ? option.result.boardedLines.join(' + ') : 'à pied'
  return `${lines} · ≈ ${option.metrics.displayMinutes} min (marge ±${option.metrics.uncertaintyMinutes} min) · ${formatMeters(option.metrics.walkMeters)} de marche · ${option.metrics.transfers} correspondance${option.metrics.transfers > 1 ? 's' : ''} · ${option.metrics.fareLabel}`
}

export function optionSummaryText(plan: JourneyPlan): string {
  const lines = plan.options.map((option, index) => `${index + 1}. ${option.label} — ${optionSummaryLine(option)}`).join('\n')
  return `${plan.originLabel} → ${plan.destinationLabel} :\n${lines}\n${plan.limitation}`
}

/** Étapes numérotées d'une option, en français lisible. */
export function optionSteps(plan: JourneyPlan, key: string): string[] {
  const option = plan.options.find((entry) => entry.key === key) ?? plan.options[0]
  if (!option) return []
  return option.result.legs.map((leg, index) => `${index + 1}. ${legDescription(leg)}`)
}

function legDescription(leg: PlannerResult['legs'][number]): string {
  if (leg.kind === 'wait') return `Attendre ${leg.line?.shortName ?? 'le véhicule'} à ${leg.from ?? ''} (~${leg.minutes} min)${leg.note ? ` — ${leg.note}` : ''}`
  if (leg.kind === 'ride') {
    const via = leg.intermediateStops && leg.intermediateStops.length > 0 ? ` · arrêts intermédiaires : ${leg.intermediateStops.join(', ')}` : ' · direct'
    return `Prendre ${leg.line?.shortName ?? 'la ligne'} de ${leg.from} à ${leg.to} (~${leg.minutes} min, ${leg.intermediateStops?.length ?? 0} arrêt${(leg.intermediateStops?.length ?? 0) > 1 ? 's' : ''} intermédiaire${(leg.intermediateStops?.length ?? 0) > 1 ? 's' : ''})${via}`
  }
  if (leg.kind === 'walk_transfer') return `Correspondance à pied ${formatMeters(leg.distanceM)} : ${leg.from} → ${leg.to} (~${leg.minutes} min)${leg.note ? ` · ${leg.note}` : ''}`
  if (leg.kind === 'walk_direct') return `Trajet à pied ${formatMeters(leg.distanceM)} : ${leg.from} → ${leg.to} (~${leg.minutes} min)`
  return `Marcher ${formatMeters(leg.distanceM)} : ${leg.from} → ${leg.to} (~${leg.minutes} min)`
}

export type PriceRanking =
  | {
      status: 'ranked'
      lines: string[]
      /** Montants comparés, dans l'ordre croissant. */
      ranked: { label: string; totalCfa: number; minutes: number; boardedLines: string[] }[]
      note: string
    }
  | { status: 'unavailable'; missingNetworks: string[]; reason: string }

/**
 * Classement par prix, à partir des seules grilles publiées.
 *
 * Le classement n'existe que si chaque course des options comparées a un tarif
 * déclaré (TER et BRT publient une grille par zones). Dès qu'une ligne DDD,
 * AFTU ou TATA entre dans la chaîne, le total n'est pas comparable : le module
 * le dit et nomme ce qui manque, au lieu d'estimer un prix au passage.
 */
export function priceRanking(
  origin: PlannerEndpoint,
  destination: PlannerEndpoint,
  preferences: JourneyPlanPreferences = {},
): PriceRanking {
  const plan = planJourneyOptions(origin, destination, { ...preferences, terClass: preferences.terClass })
  if (!plan.ok) return { status: 'unavailable', missingNetworks: [], reason: plan.message }
  const priced = plan.options.filter((option) => option.metrics.fareStatus === 'KNOWN' && option.metrics.fareCfa !== null)
  if (priced.length < 2) {
    const missing = [...new Set(plan.options.flatMap((option) => option.result.fare.legs.filter((leg) => leg.amountCfa === null).map((leg) => `${leg.shortName}`)))]
    return {
      status: 'unavailable',
      missingNetworks: missing,
      reason: missing.length > 0
        ? `Aucun tarif publié pour ${missing.join(', ')} dans la mémoire consultée : le prix total de ces itinéraires n’est pas comparable. La part connue (TER et BRT) reste affichée sur chaque option.`
        : 'Les grilles tarifaires publiées ne couvrent qu’une seule option calculable : aucun classement par prix n’est possible.',
    }
  }
  const ranked = priced
    .map((option) => ({
      label: option.label,
      totalCfa: option.metrics.fareCfa as number,
      minutes: option.metrics.displayMinutes,
      boardedLines: option.result.boardedLines,
    }))
    .sort((a, b) => a.totalCfa - b.totalCfa || a.minutes - b.minutes)
  return {
    status: 'ranked',
    ranked,
    lines: ranked.map((entry, index) => `${index + 1}. ${entry.boardedLines.join(' + ')} — ${entry.totalCfa.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} F CFA · ≈ ${entry.minutes} min (${entry.label})`),
    note: 'Somme des tickets de référence (grilles TER et SunuBRT consultées le 2026-10-10). Aucun billet combiné ni tarif préférentiel : le prix au guichet peut différer, à confirmer auprès de l’exploitant.',
  }
}
