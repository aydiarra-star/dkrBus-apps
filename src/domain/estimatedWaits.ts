/**
 * Estimations horaires DDD, AFTU et TATA pour les tableaux par arrêt.
 *
 * Ces références décrivent des intervalles moyens observés ou planifiés.
 * Elles ne permettent pas de calculer une heure exacte de prochain passage :
 * aucune phase de départ propre à chaque ligne n'est publiée ici.
 *
 * DDD :
 * - Référence de planification historique : 7–10 min en pointe, 10–15 min
 *   en heures creuses (Banque mondiale / PATMUR).
 * - Relevés CETUD/CUREM sur des points autour du corridor BRT : 6–52 min
 *   en semaine et 11–40 min le samedi (EFOV 2016, rapport CETUD 2020).
 *
 * AFTU :
 * - Relevés CETUD/CUREM sur points échantillonnés : 1–18 min en semaine,
 *   3–19 min le samedi (EFOV 2016, rapport CETUD 2020).
 * - Étude de terrain Dakar 2023–2024 publiée en 2025 : moyenne 11,58 min,
 *   écart-type 6,97 min. Attente résiduelle estimée E(H²)/(2E(H)) ≈ 7,9 min,
 *   arrondie à 8 min.
 *
 * TATA :
 * - Les TATA sont des minibus exploités dans le cadre du réseau AFTU, pas un
 *   réseau d'exploitation indépendant avec une série de fréquences séparée.
 *   Le même repère AFTU/TATA est donc affiché dans la fiche TATA, explicitement
 *   identifié comme référence partagée et non comme mesure TATA indépendante.
 *
 * Sources :
 * https://documents1.worldbank.org/curated/en/917981485199724235/pdf/P156186-RAP-revised-afterRSA-final-clean.pdf
 * https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf
 * https://doi.org/10.18280/ijtdi.090108
 * https://www.itfglobal.org/sites/default/files/node/resources/files/2020%20Dakar%20BRT%20LIA%20EN.pdf
 */

const SERVICE_START_HOUR = 6
const SERVICE_END_HOUR = 21

export function estimatedFrequencyReference(network: string | null): string | null {
  if (network === 'ddd') return 'Planification historique : 7–10 min en pointe · 10–15 min en heures creuses'
  if (network === 'aftu') return 'Moyenne observée à Dakar : 11,58 min entre passages (2023–2024)'
  if (network === 'tata') return 'Référence partagée AFTU/TATA : 11,58 min entre passages observés (2023–2024)'
  return null
}

export function estimatedWaitMinutes(network: string | null, now = Date.now()): number | null {
  if (!Number.isFinite(now) || !network) return null
  const hour = new Date(now).getUTCHours()
  if (hour < SERVICE_START_HOUR || hour >= SERVICE_END_HOUR) return null

  if (network === 'ddd') {
    const peak = (hour >= 6 && hour < 9) || (hour >= 16 && hour < 19)
    // Attente moyenne indicative dérivée du milieu des plages de planification.
    return peak ? 4 : 6
  }

  // AFTU et TATA partagent la même référence empirique : environ 7,9 min
  // d'attente résiduelle, arrondie à 8 min. Ce n'est pas une arrivée prédite.
  if (network === 'aftu' || network === 'tata') return 8
  return null
}
