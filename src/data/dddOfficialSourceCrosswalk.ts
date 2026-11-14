/**
 * Lecture croisée en lecture seule des pages officielles DDD et du guide CETUD JOJ.
 * Ce registre conserve les divergences de libellés/corridors sans réécrire
 * les séquences publiées ni créer des directions ou des arrêts voyageurs.
 */
export type DddOfficialSourceCrosswalkKind =
  | 'source_corridor_conflict'
  | 'source_identifier_granularity'
  | 'published_title_sequence_conflict'
  | 'distinct_service_identifiers'

export interface DddOfficialSourceClaim {
  source: 'ddd_route_page' | 'ddd_info_voyageurs' | 'cetud_joj_guide'
  corridor: string
}

export interface DddOfficialSourceCrosswalkEntry {
  line: string
  kind: DddOfficialSourceCrosswalkKind
  claims: readonly DddOfficialSourceClaim[]
  decision: string
  passengerCatalogueChanged: false
  reverseSequenceCreated: false
}

const entry = (
  line: string,
  kind: DddOfficialSourceCrosswalkKind,
  claims: readonly DddOfficialSourceClaim[],
  decision: string,
): DddOfficialSourceCrosswalkEntry => ({
  line,
  kind,
  claims,
  decision,
  passengerCatalogueChanged: false,
  reverseSequenceCreated: false,
})

export const DDD_OFFICIAL_SOURCE_CROSSWALK_CHECKED_ON = '2026-11-14' as const
export const DDD_OFFICIAL_SOURCE_CROSSWALK_URLS = {
  routePage: 'https://demdikk.sn/reseau-urbain-dakar/',
  infoPage: 'https://demdikk.sn/info-voyageurs/',
  cetudGuide: 'https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf',
} as const

export const DDD_OFFICIAL_SOURCE_CROSSWALK: readonly DddOfficialSourceCrosswalkEntry[] = [
  entry('6', 'source_corridor_conflict', [
    { source: 'ddd_route_page', corridor: 'Guédiawaye → Palais 1' },
    { source: 'ddd_info_voyageurs', corridor: 'Cambérène 2 → Palais 2' },
    { source: 'cetud_joj_guide', corridor: 'Cambérène → Palais 1' },
  ], 'Conserver les trois déclarations comme conflit de sources ; ne pas choisir un terminus ni réécrire la séquence.'),
  entry('7', 'source_corridor_conflict', [
    { source: 'ddd_route_page', corridor: 'Ouakam → Palais 2' },
    { source: 'ddd_info_voyageurs', corridor: 'Ouakam → Palais 2' },
    { source: 'cetud_joj_guide', corridor: 'Ouakam → Palais 1' },
  ], 'Deux pages DDD concordent sur Palais 2 ; le guide CETUD JOJ indique Palais 1. Conserver le conflit documentaire.'),
  entry('13', 'source_corridor_conflict', [
    { source: 'ddd_route_page', corridor: 'Liberté 5 → Palais 2' },
    { source: 'ddd_info_voyageurs', corridor: 'Liberté 5 → Palais 2' },
    { source: 'cetud_joj_guide', corridor: 'Dieuppeul → Palais 1' },
  ], 'Conserver les terminus selon chaque source ; le guide JOJ ne remplace pas la fiche détaillée DDD.'),
  entry('15', 'source_identifier_granularity', [
    { source: 'ddd_route_page', corridor: 'Ligne 15 : Rufisque → Palais 1' },
    { source: 'ddd_info_voyageurs', corridor: 'Lignes 15A et 15B : Rufisque → Palais 1' },
  ], 'Ne pas fusionner 15, 15A et 15B ; demander une correspondance opérateur avant toute répartition.'),
  entry('233', 'published_title_sequence_conflict', [
    { source: 'ddd_route_page', corridor: 'En-tête Baux Maraichers → Palais 1 ; derniers repères publiés : Yoff → Aéroport LSS' },
    { source: 'ddd_info_voyageurs', corridor: 'Baux Maraichers → Palais 1' },
  ], 'L’en-tête est corroboré, mais la séquence détaillée finit à Aéroport LSS ; conserver le conflit sans corriger les arrêts.'),
  entry('501', 'source_corridor_conflict', [
    { source: 'ddd_route_page', corridor: 'Palais 2 → Leclerc' },
    { source: 'ddd_info_voyageurs', corridor: 'Gare de Dakar → Palais 2' },
  ], 'Les deux fiches officielles attribuent des corridors différents au code 501 ; ne pas fusionner ni remplacer la séquence.'),
  entry('502', 'source_identifier_granularity', [
    { source: 'ddd_route_page', corridor: 'Ligne 502 circulaire : Gare Colobane → Gare Colobane' },
    { source: 'ddd_info_voyageurs', corridor: 'Lignes 502A : Colobane → UCAD ; 502B : Colobane → Abass Ndao' },
  ], 'Conserver la boucle 502 et les variantes 502A/502B comme publications distinctes jusqu’à clarification de la nomenclature.'),
  entry('503', 'source_identifier_granularity', [
    { source: 'ddd_route_page', corridor: 'Ligne 503 circulaire : Gare de Colobane → Gare de Colobane' },
    { source: 'ddd_info_voyageurs', corridor: 'Lignes 503A : Colobane → Môle 8 ; 503B : Colobane → Hydrocarbure' },
  ], 'Conserver la boucle 503 et les variantes 503A/503B comme publications distinctes jusqu’à clarification de la nomenclature.'),
  entry('TAF_TAF / TO1', 'distinct_service_identifiers', [
    { source: 'ddd_route_page', corridor: 'TAF TAF OUAKAM (TO1) : Ouakam → Palais 2' },
    { source: 'ddd_route_page', corridor: 'TAF TAF : Ouakam → AIBD' },
    { source: 'ddd_info_voyageurs', corridor: 'TAF TAF : itinéraire Ouakam → AIBD / Sphère ministérielle' },
  ], 'Garder TO1 et TAF_TAF distincts ; ne pas emprunter les arrêts ni les terminus de l’un pour compléter l’autre.'),
] as const

export const getDddOfficialSourceCrosswalk = (line: string) =>
  DDD_OFFICIAL_SOURCE_CROSSWALK.find((item) => item.line === line) ?? null
