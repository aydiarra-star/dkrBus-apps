/**
 * Calcul d'un compte à rebours au passage d'un arrêt.
 *
 * Chaque sens doit fournir sa propre liste ordonnée d'arrêts et ses propres
 * minutes cumulées depuis le terminus. Aucune durée n'est déduite du sens
 * opposé. Sans données complètes, la fonction renvoie null (affichage —).
 */
export interface DirectionPassagePlan {
  firstDeparture: string
  lastDeparture: string
  headwayMinutes: number
  /** Minutes depuis le départ du terminus, dans le même ordre que les arrêts. */
  cumulativeMinutesByStop: readonly number[]
}

export function nextStopPassageCountdown(
  plan: DirectionPassagePlan | null | undefined,
  stopIndex: number,
  now: Date = new Date(),
): number | null {
  if (!plan || !Number.isInteger(stopIndex) || stopIndex < 0) return null
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return null
  if (!Array.isArray(plan.cumulativeMinutesByStop) ||
      stopIndex >= plan.cumulativeMinutesByStop.length ||
      plan.cumulativeMinutesByStop.length === 0) return null
  // Une séquence cumulée doit être complète, finie et croissante ou constante.
  // Un trou ou une inversion rendrait les décomptes incohérents sur la ligne.
  let previousOffset = -1
  for (const value of plan.cumulativeMinutesByStop) {
    if (!Number.isFinite(value) || value < 0 || value < previousOffset) return null
    previousOffset = value
  }
  const offset = plan.cumulativeMinutesByStop[stopIndex]
  if (!Number.isInteger(plan.headwayMinutes) || plan.headwayMinutes <= 0) return null

  const parseClock = (value: string): number | null => {
    const match = /^(\d{2}):(\d{2})$/.exec(value)
    if (!match) return null
    const hours = Number(match[1])
    const minutes = Number(match[2])
    return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null
  }
  const first = parseClock(plan.firstDeparture)
  const last = parseClock(plan.lastDeparture)
  if (first === null || last === null || last < first) return null

  // Les horaires DDD/AFTU/TATA sont interprétés à l'heure de Dakar (UTC+0),
  // indépendamment du fuseau horaire du téléphone de l'utilisateur.
  const current = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60
  const firstPassage = first + offset
  const lastPassage = last + offset
  if (current > lastPassage) return null
  const nextIndex = Math.max(0, Math.ceil((current - firstPassage) / plan.headwayMinutes))
  const passage = firstPassage + nextIndex * plan.headwayMinutes
  if (passage > lastPassage) return null
  return Math.max(0, Math.ceil(passage - current))
}
