/**
 * Hypothèses du moteur d'estimation — pas des faits publiés.
 *
 * Spec : docs/spec-estimation-progressive-ddd-aftu.md §4 (niveau C).
 * Les fréquences officielles TER/BRT restent dans `frequencies.ts`.
 * Aucune fréquence DDD/AFTU n'est inscrite ici : une hypothèse absente
 * reste absente, elle n'est pas remplacée par un chiffre présenté comme un fait.
 *
 * Les valeurs numériques ci-dessous sont celles que le calculateur et le
 * tableau par station utilisaient déjà. Les regrouper ne change pas les
 * durées TER/BRT ; cela donne un seul endroit à tester et à remplacer.
 */

/** Vitesse de marche retenue : 80 m/min ≈ 4,8 km/h. */
export const WALK_SPEED_MPM = 80

/** Marge ajoutée à chaque correspondance marchable (min). */
export const TRANSFER_BUFFER_MIN = 3

/** Rayon maximal de marche d'accès ou de sortie (m). */
export const MAX_ACCESS_M = 1200

/**
 * Temps d'arrêt par station intermédiaire (min). Hypothèse de modèle.
 * Le repli `DEFAULT_DWELL_MIN` conserve l'ancien `?? 0.5` pour un réseau
 * encore sans hypothèse nommée — ce n'est pas une fréquence DDD/AFTU.
 */
export const DWELL_MIN: Record<string, number> = { ter: 1, brt: 0.5 }

export const DEFAULT_DWELL_MIN = 0.5

/**
 * Vitesse commerciale retenue pour estimer un parcours de référence (km/h).
 * Hypothèse, pas une vitesse officielle publiée.
 * DDD/AFTU/TATA : vitesses plus basses en milieu urbain dense.
 */
export const REFERENCE_COMMERCIAL_SPEED_KPH = { ter: 55, brt: 25, ddd: 18, aftu: 16, tata: 15 } as const

/**
 * Part de l'intervalle officiel retenue comme attente d'embarquement
 * lorsqu'une fréquence est publiée et qu'aucune heure de départ n'est demandée.
 * 0,5 = demi-headway, l'attente moyenne théorique d'une arrivée aléatoire.
 */
export const BOARDING_WAIT_FRACTION = 0.5

export function dwellMinutes(network: string): number {
  return DWELL_MIN[network] ?? DEFAULT_DWELL_MIN
}

/** Minutes de marche affichées : au moins 1, arrondi à la minute supérieure.
 *  La vitesse peut être celle choisie dans Paramètres (accessibilité). */
export function walkDisplayMinutes(meters: number, speedMpm: number = WALK_SPEED_MPM): number {
  return Math.max(1, Math.ceil(meters / Math.max(20, speedMpm)))
}

/**
 * Vitesses de marche proposées dans Paramètres → Préférences de mobilité.
 * 55 m/min ≈ 3,3 km/h (marche lente ou pénibilité), 80 m/min ≈ 4,8 km/h
 * (valeur déjà retenue par le moteur), 100 m/min ≈ 6 km/h (marche rapide).
 * Ces trois réglages sont des hypothèses de modèle, pas des normes publiées.
 */
export const WALK_SPEED_PRESETS = {
  slow: { mpm: 55, label: 'Marche lente' },
  normal: { mpm: WALK_SPEED_MPM, label: 'Marche normale' },
  fast: { mpm: 100, label: 'Marche rapide' },
} as const

export type WalkSpeedPreset = keyof typeof WALK_SPEED_PRESETS

export function walkSpeedOf(preset: WalkSpeedPreset | undefined): number {
  return preset && preset in WALK_SPEED_PRESETS ? WALK_SPEED_PRESETS[preset].mpm : WALK_SPEED_MPM
}

/** Rayons de marche d'accès proposés dans Paramètres (mètres). */
export const ACCESS_RADIUS_PRESETS = { near: 700, normal: MAX_ACCESS_M, wide: 1800 } as const
export type AccessRadiusPreset = keyof typeof ACCESS_RADIUS_PRESETS

export function accessRadiusOf(preset: AccessRadiusPreset | undefined): number {
  return preset && preset in ACCESS_RADIUS_PRESETS ? ACCESS_RADIUS_PRESETS[preset] : MAX_ACCESS_M
}

/**
 * Géométrie des correspondances entre réseaux au même pôle.
 * `CROW_FLIES_TO_WALK_FACTOR` convertit une distance à vol d'oiseau en distance
 * de marche : c'est le facteur déjà utilisé pour les deux correspondances
 * TER ↔ BRT déclarées (770 m → ~1 km, 1 080 m → ~1,4 km). `MIN_TRANSFER_WALK_M`
 * évite une marche de 0 m entre deux arrêts partagés : traverser un quai ou un
 * parvis se paie en minutes. Au-delà de `MAX_TRANSFER_WALK_M`, la correspondance
 * n'est plus proposée : marcher plus loin qu'un quart d'heure pour changer de
 * réseau relève du trajet à pied, pas d'une correspondance.
 */
export const CROW_FLIES_TO_WALK_FACTOR = 1.3
export const MIN_TRANSFER_WALK_M = 150
export const MAX_TRANSFER_WALK_M = 1500
/**
 * Une correspondance entre deux réseaux n'est modélisée que si les deux arrêts
 * sont au **même pôle** : leurs positions déclarées sont à moins de
 * `SAME_POLE_MATCH_M` l'une de l'autre. Au-delà, le référentiel ne dit rien d'un
 * cheminement commun et le moteur refuse de l'inventer. Les deux correspondances
 * TER ↔ BRT déclarées dans `CORRIDOR_TRANSFERS` restent admises telles quelles.
 */
export const SAME_POLE_MATCH_M = 120
/**
 * Pénalité de fiabilité, appliquée à la recherche uniquement (jamais aux minutes
 * affichées) : à durée égale, une ligne dont la fréquence est publiée est
 * préférée à une ligne dont la fréquence est estimée. C'est un réglage de
 * classement, pas une information opérateur.
 */
export const RELIABILITY_PENALTY_MIN = 4

/**
 * Marge d'incertitude affichée à côté d'une durée (minutes).
 * Une fréquence officielle publiée laisse une incertitude de cadence ; une
 * fréquence estimée (DDD/AFTU/TATA, aucune grille ligne par ligne) y ajoute la
 * part d'inconnu. Ces valeurs sont les hypothèses du modèle, pas des écarts
 * mesurés : le dépôt ne contient aucune observation de ponctualité.
 */
export const UNCERTAINTY_MIN = { officialReference: 3, estimatedFrequency: 8 } as const
export type FrequencyBasis = keyof typeof UNCERTAINTY_MIN

/**
 * Fréquences de repli utilisées quand aucune grille n'est publiée pour la ligne.
 * Le moteur bascule dessus explicitement et l'affiche : ce ne sont PAS des
 * fréquences officielles, ce sont des hypothèses de modèle (niveau C de
 * docs/spec-estimation-progressive-ddd-aftu.md), jamais un fait annoncé.
 */
export const FALLBACK_HEADWAY_MIN: Record<string, number> = { ddd: 20, aftu: 15, tata: 20 }
export const DEFAULT_FALLBACK_HEADWAY_MIN = 20

export function fallbackHeadwayMinutes(network: string): number {
  return FALLBACK_HEADWAY_MIN[network] ?? DEFAULT_FALLBACK_HEADWAY_MIN
}

/** Base de fréquence réellement applicable à une ligne : grille publiée ou repli. */
export function frequencyBasisOf(status: string | undefined, network: string): FrequencyBasis {
  if (status === 'OFFICIAL_REFERENCE' || status === 'SCHEDULED') return 'officialReference'
  void network
  return 'estimatedFrequency'
}

export function uncertaintyMinutes(bases: readonly FrequencyBasis[], transfers = 0): number {
  const worst = bases.includes('estimatedFrequency') ? UNCERTAINTY_MIN.estimatedFrequency : UNCERTAINTY_MIN.officialReference
  // Chaque correspondance ajoute sa propre part d'attente non mesurée.
  return worst + transfers * 2
}
