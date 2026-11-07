/**
 * Estimations de temps d'attente pour les réseaux sans horaire de passage.
 *
 * Les valeurs sont des attentes moyennes statistiques, pas des heures de
 * départ ni des positions de véhicules.
 *
 * AFTU : calcul à partir des intervalles observés à Dakar en 2023-2024,
 * publiés dans Diaou et al. (2025), tableau 3 : moyenne 11,58 min,
 * écart-type 6,97 min. Pour une arrivée aléatoire, E(H²)/(2E(H)) ≈ 7,9 min.
 * https://doi.org/10.18280/ijtdi.090108
 *
 * DDD : estimation à partir des intervalles de planification historiques
 * publiés (7-10 min en pointe, 10-15 min en creux), convertis en attente
 * moyenne approximative par la moitié de l'intervalle moyen.
 * https://documents1.worldbank.org/curated/en/917981485199724235/pdf/P156186-RAP-revised-afterRSA-final-clean.pdf
 */

const SERVICE_START_HOUR = 6
const SERVICE_END_HOUR = 21

export function estimatedWaitMinutes(network: string | null, now = Date.now()): number | null {
  if (!Number.isFinite(now) || !network) return null
  const hour = new Date(now).getUTCHours()
  if (hour < SERVICE_START_HOUR || hour >= SERVICE_END_HOUR) return null

  if (network === 'ddd') {
    const peak = (hour >= 6 && hour < 9) || (hour >= 16 && hour < 19)
    return peak ? 4 : 6
  }

  if (network === 'aftu' || network === 'tata') return 8
  return null
}
