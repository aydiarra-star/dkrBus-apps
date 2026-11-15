/**
 * Durées cumulées TER observées gare par gare depuis Dakar.
 *
 * Source : relevés TER INFOS communiqués par l'utilisateur le 15/11/2026.
 * Les plages min/max sont conservées telles quelles. Le tableau des prochains
 * créneaux utilise le milieu de chaque plage comme décalage de projection ;
 * cela ne transforme pas une plage observée en horaire garanti.
 *
 * L'utilisateur a confirmé que les mêmes durées s'appliquent dans les deux
 * sens. Le retour est donc calculé depuis AIBD par différence avec le total.
 */
export interface TravelTimeRange {
  minMinutes: number
  maxMinutes: number
}

export const TER_CUMULATIVE_TRAVEL_TIMES: Readonly<Record<string, TravelTimeRange>> = {
  'ter-dakar': { minMinutes: 0, maxMinutes: 0 },
  'ter-colobane': { minMinutes: 3, maxMinutes: 3 },
  'ter-hann': { minMinutes: 7, maxMinutes: 8 },
  'ter-dalifort': { minMinutes: 10, maxMinutes: 11 },
  'ter-baux-maraichers': { minMinutes: 13, maxMinutes: 14 },
  'ter-pikine': { minMinutes: 15, maxMinutes: 17 },
  'ter-thiaroye': { minMinutes: 19, maxMinutes: 20 },
  'ter-yeumbeul': { minMinutes: 22, maxMinutes: 24 },
  'ter-mbao': { minMinutes: 27, maxMinutes: 28 },
  'ter-pnr': { minMinutes: 31, maxMinutes: 33 },
  'ter-rufisque': { minMinutes: 34, maxMinutes: 35 },
  'ter-bargny': { minMinutes: 39, maxMinutes: 41 },
  'ter-diamniadio': { minMinutes: 44, maxMinutes: 45 },
  'ter-aibd': { minMinutes: 56, maxMinutes: 57 },
}

/** Milieu de la plage observée, utilisé uniquement pour la projection horaire. */
export function terTravelTimeMidpointMinutes(stopId: string): number {
  const range = TER_CUMULATIVE_TRAVEL_TIMES[stopId]
  if (!range) return 0
  return (range.minMinutes + range.maxMinutes) / 2
}
