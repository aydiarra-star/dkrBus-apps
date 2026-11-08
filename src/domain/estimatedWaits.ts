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

const SERVICE_END_MINUTE = 21 * 60

function serviceStartMinute(network: string): number {
  return network === 'ddd' ? 5 * 60 + 30 : 6 * 60
}

export function estimatedFrequencyReference(network: string | null): string | null {
  if (network === 'ddd') return 'Intervalle de passage : 7–10 min aux heures de pointe · 10–15 min en heures creuses (repère de planification historique)'
  if (network === 'aftu') return 'Intervalle moyen observé : 11,6 min (11,58 min mesurés à Dakar en 2023–2024)'
  if (network === 'tata') return 'Référence partagée AFTU/TATA : intervalle moyen observé 11,6 min (11,58 min mesurés en 2023–2024)'
  return null
}

export function estimatedLineFrequencyReference(lineName: string): string | null {
  const key = lineName.toUpperCase().replace(/\s+/g, ' ').trim()
  if (key === 'DDD 1') {
    return 'Horaires publiés ligne 1 : Parcelles Assainies 05:30–20:30 · Leclerc 06:30–21:00 (Dakar Dem Dikk).'
  }
  if (key === 'AFTU 42') {
    return 'Estimation ligne 42 : 15 min du lundi au vendredi · 25 min le week-end · service 05:50–21:50 en semaine et 06:00–21:50 le week-end (référence TransitByCity, actualisée le 28/05/2026).'
  }
  return null
}

export function estimatedLineWaitMinutes(lineName: string, network: string | null, now = Date.now()): number | null {
  if (!Number.isFinite(now) || estimatedWaitMinutes(network, now) === null) return null
  const day = new Date(now).getUTCDay()
  const weekend = day === 0 || day === 6
  const key = lineName.toUpperCase().replace(/\s+/g, ' ').trim()
  if (key === 'AFTU 42') return weekend ? 13 : 8
  return estimatedWaitMinutes(network, now)
}

export function estimatedWaitMinutes(network: string | null, now = Date.now()): number | null {
  if (!Number.isFinite(now) || !network) return null
  const minuteOfDay = new Date(now).getUTCHours() * 60 + new Date(now).getUTCMinutes()
  if (minuteOfDay < serviceStartMinute(network) || minuteOfDay >= SERVICE_END_MINUTE) return null

  if (network === 'ddd') {
    const hour = Math.floor(minuteOfDay / 60)
    const peak = (hour >= 6 && hour < 9) || (hour >= 16 && hour < 19)
    // Attente moyenne indicative dérivée du milieu des plages de planification.
    return peak ? 4 : 6
  }

  // AFTU et TATA partagent la même référence empirique : environ 7,9 min
  // d'attente résiduelle, arrondie à 8 min. Ce n'est pas une arrivée prédite.
  if (network === 'aftu' || network === 'tata') return 8
  return null
}


/** Prochain passage indicatif du réseau, projeté depuis les intervalles de référence.
 *  Les créneaux sont ancrés au début de chaque plage pour produire un compte
 *  à rebours vivant. Ils ne représentent pas la position d'un véhicule.
 */
export interface EstimatedNetworkPassage {
  nextDepartureAt: string
  minutes: number
  headwayMinutes: number
}

type EstimatedHeadwayPeriod = { startMinute: number; endMinute: number; headwayMinutes: number }

const DDD_HEADWAY_PERIODS: readonly EstimatedHeadwayPeriod[] = [
  { startMinute: 5 * 60 + 30, endMinute: 6 * 60, headwayMinutes: 13 },
  { startMinute: 6 * 60, endMinute: 9 * 60, headwayMinutes: 8 },
  { startMinute: 9 * 60, endMinute: 16 * 60, headwayMinutes: 13 },
  { startMinute: 16 * 60, endMinute: 19 * 60, headwayMinutes: 8 },
  { startMinute: 19 * 60, endMinute: 21 * 60, headwayMinutes: 13 },
]

const AFTU_TATA_HEADWAY_PERIODS: readonly EstimatedHeadwayPeriod[] = [
  // 11,58 minutes observées à Dakar, arrondies à 12 minutes.
  { startMinute: 6 * 60, endMinute: 21 * 60, headwayMinutes: 12 },
]

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/**
 * Calcule un prochain passage indicatif à partir des fréquences de référence :
 * DDD 8 min en pointe / 13 min hors pointe ; AFTU et TATA 12 min.
 * TATA partage la référence AFTU : aucune fréquence autonome n'est inventée.
 */
export function estimatedNextPassage(network: string | null, now = Date.now()): EstimatedNetworkPassage | null {
  if (!Number.isFinite(now) || !network) return null

  const periods = network === 'ddd'
    ? DDD_HEADWAY_PERIODS
    : network === 'aftu' || network === 'tata'
      ? AFTU_TATA_HEADWAY_PERIODS
      : null
  if (!periods) return null

  const dayStart = Math.floor(now / DAY_MS) * DAY_MS
  const minuteOfDay = Math.floor((now - dayStart) / MINUTE_MS)

  for (const period of periods) {
    const startAt = dayStart + period.startMinute * MINUTE_MS
    const endAt = dayStart + period.endMinute * MINUTE_MS
    if (minuteOfDay >= period.endMinute) continue

    const intervalMs = period.headwayMinutes * MINUTE_MS
    const slotIndex = now < startAt ? 0 : Math.floor((now - startAt) / intervalMs) + 1
    const nextAt = startAt + slotIndex * intervalMs
    if (nextAt >= endAt) continue

    return {
      nextDepartureAt: new Date(nextAt).toISOString(),
      minutes: Math.max(1, Math.ceil((nextAt - now) / MINUTE_MS)),
      headwayMinutes: period.headwayMinutes,
    }
  }

  return null
}
