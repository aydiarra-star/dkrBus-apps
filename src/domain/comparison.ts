/**
 * Comparaison des options calculables sur le réseau de référence.
 *
 * Vue allégée conservée pour la carte « comparer » : les trois critères
 * historiques (durée, correspondances, marche), dédupliqués sur les étapes
 * réellement obtenues. Le classement s'appuie sur les valeurs affichées à
 * l'usager, jamais sur les coûts pondérés de la recherche.
 *
 * Le module complet, qui ajoute le tarif et l'aller-retour, vit dans
 * `journeyOptions.ts`.
 */

import { planReferenceJourney, type PlannerEndpoint, type PlannerFailure, type PlannerPriority, type PlannerResult } from './planner'

export { PRIORITY_LABELS } from './planner'

export interface ComparedRoute {
  priority: ComparisonCriterion
  result: PlannerResult
}

/** Critères proposés par la carte de comparaison simple. */
export type ComparisonCriterion = Extract<PlannerPriority, 'fastest' | 'lessWalking' | 'fewerTransfers'>

export type Comparison =
  | { ok: true; options: ComparedRoute[]; bestBy: Record<ComparisonCriterion, ComparisonCriterion> }
  | PlannerFailure

const PRIORITIES: readonly ComparisonCriterion[] = ['fastest', 'fewerTransfers', 'lessWalking']

function routeKey(result: PlannerResult): string {
  // Stops, ride lines and walking connections identify a route; differences in
  // optimization weights alone must never create a fake alternative.
  return result.legs.map((leg) => [leg.kind, leg.line?.id ?? '', leg.from ?? '', leg.to ?? ''].join(':')).join('|')
}

export function compareReferenceJourneys(origin: PlannerEndpoint, destination: PlannerEndpoint): Comparison {
  const options: ComparedRoute[] = []
  const seen = new Set<string>()
  for (const priority of PRIORITIES) {
    const result = planReferenceJourney(origin, destination, priority)
    if (!result.ok) {
      // Only a total failure (no accessible stop, identical points) stops the
      // comparison; a single criterion coming up empty just drops that option.
      if (options.length === 0) return result
      continue
    }
    const key = routeKey(result)
    if (seen.has(key)) continue
    seen.add(key)
    options.push({ priority, result })
  }
  if (options.length === 0) return { ok: false, reason: 'NO_PATH', message: 'Aucun itinéraire distinct n’est calculable sur le réseau de référence pour ces deux points.' }
  // Actual displayed metrics, not weighted search costs, determine the labels.
  const byMetric = (metric: (route: PlannerResult) => number): ComparisonCriterion =>
    [...options].sort((a, b) => metric(a.result) - metric(b.result))[0].priority
  return {
    ok: true,
    options,
    bestBy: {
      fastest: byMetric((route) => route.totalMinutes),
      lessWalking: byMetric((route) => route.totalWalkM),
      fewerTransfers: byMetric((route) => route.transfers),
    },
  }
}
