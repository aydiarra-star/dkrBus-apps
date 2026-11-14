/**
 * Résultats de rapprochement DDD OSM / ArcGIS conservés pour l'audit interne.
 * Ces indices ne sont pas des arrêts passagers, ne géolocalisent aucune fiche
 * et ne créent jamais de séquence retour.
 */
export type DddEvidenceStatus =
  | 'OSM_ORDER_GEOMETRY_STRONG_ONE_DIRECTION'
  | 'OFFICIAL_TERMINUS_CONFLICT'
  | 'ARCGIS_CORRIDOR_ONLY'
  | 'ARCGIS_POINTS_CANDIDATES_ONLY'
  | 'OFFICIAL_CORRIDOR_TEXT_MATCH'
  | 'OSM_PARTIAL_DIRECTIONS_TERMINUS_MISMATCH'

export interface DddPriorityRouteEvidence {
  line: string
  status: DddEvidenceStatus
  arcgisPointCount: number | null
  maxPointDistanceMeters: number | null
  osmRelations: readonly string[]
  notes: readonly string[]
  passengerStopsImported: false
  reverseSequenceCreated: false
}

const evidence = (
  line: string,
  status: DddEvidenceStatus,
  arcgisPointCount: number | null,
  maxPointDistanceMeters: number | null,
  osmRelations: readonly string[],
  notes: readonly string[],
): DddPriorityRouteEvidence => ({
  line,
  status,
  arcgisPointCount,
  maxPointDistanceMeters,
  osmRelations,
  notes,
  passengerStopsImported: false,
  reverseSequenceCreated: false,
})

export const DDD_PRIORITY_ROUTE_EVIDENCE: readonly DddPriorityRouteEvidence[] = [
  evidence('1', 'OSM_ORDER_GEOMETRY_STRONG_ONE_DIRECTION', 38, 25, ['6951328'], [
    '38 arrêts OSM ordonnés ; 38/38 à 25 m ou moins du tracé ArcGIS.',
    'Corrélation ordre OSM / chaînage ArcGIS : +0,9879.',
    'Un seul sens est établi ; aucun retour distinct n’est créé.',
  ]),
  evidence('6', 'OFFICIAL_TERMINUS_CONFLICT', 60, 11.6, ['7499433'], [
    '60 points ArcGIS à 11,6 m ou moins du tracé.',
    'Les sources DDD divergent entre Cambérène 2–Palais 2 et Guédiawaye–Palais 1 ; le guide CETUD JOJ indique Cambérène–Palais 1.',
    'La relation OSM 7499433 porte un nom de ligne 7, ref=6 et un seul arrêt ordonné : elle n’est pas associée au catalogue ligne 6.',
  ]),
  evidence('12', 'ARCGIS_CORRIDOR_ONLY', 0, null, [], [
    'Tracé ArcGIS de 24,52 km et 11 champs de segments textuels ; aucune couche de points dédiée.',
    'Métadonnée ArcGIS lastEditDate : 6 décembre 2017 ; conservation comme corridor historique seulement.',
    'Les terminus ArcGIS ne concordent pas entièrement avec la fiche DDD actuelle.',
  ]),
  evidence('13', 'ARCGIS_POINTS_CANDIDATES_ONLY', 23, 10.5, [], [
    '23 points nommés à 10,5 m ou moins du tracé ; la fiche DDD publie 24 repères.',
    'Une seconde couche de 22 points Id=0 est dupliquée spatialement et ne doit pas être ajoutée au compte.',
    'Les points restent des candidats documentaires, pas des arrêts passagers importés.',
  ]),
  evidence('16B', 'OFFICIAL_CORRIDOR_TEXT_MATCH', 0, null, [], [
    'Les 12 champs de segments ArcGIS reprennent le corridor Malika–Palais 1 de la fiche DDD.',
    'Aucune couche de points dédiée ; le tracé est daté du 6 décembre 2017.',
    'Aucune direction retour distincte n’est établie par ce rapprochement.',
  ]),
  evidence('121', 'OSM_PARTIAL_DIRECTIONS_TERMINUS_MISMATCH', 31, 10.9, ['6990794', '6999013'], [
    '31 points ArcGIS à 10,9 m ou moins du tracé.',
    'Relation OSM 6990794 : 27 arrêts HLM Grand Yoff–Leclerc ; 6999013 : 7 arrêts Leclerc–HLM Grand Medine, fragment partiel.',
    'Le départ OSM ne correspond pas à Scat Urbam ; aucun retour officiel complet n’est confirmé.',
  ]),
] as const

/** Lignes sans groupe ArcGIS d'arrêts portant le même code, selon l'extraction du 14/11/2026. */
export const DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP = [
  '20', '208', '213', '219', '220', '221', '233', '234',
  '311', '327', 'TO1', '319', '501', '502', '503', 'TAF_TAF', '15',
] as const

export function getDddPriorityRouteEvidence(line: string): DddPriorityRouteEvidence | null {
  return DDD_PRIORITY_ROUTE_EVIDENCE.find((item) => item.line === line) ?? null
}
