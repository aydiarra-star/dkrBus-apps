import { OFFICIAL_REFERENCE_FREQUENCIES, formatFrequencyDays } from './frequencies'
import { nextReferencePassage } from './headways'

export type TerDakarDiamniadioDirection = 'aller' | 'retour'

export interface GareTER {
  id: string
  nom: string
  offsetAller: number
}

export interface TerDakarDiamniadioPassage {
  id: string
  nom: string
  ordre: number
  decalageMinutes: number
  estDepart: boolean
  estTerminus: boolean
  heureFormatee: string
  passageAt: string
  dansMinutes: number
}

export interface TerDakarDiamniadioSchedule {
  direction: TerDakarDiamniadioDirection
  departAt: string
  heureDepart: string
  dureeMinutes: number
  frequenceMinutes: number
  rows: readonly TerDakarDiamniadioPassage[]
}

/** Référentiel isolé : uniquement le tronc commun Dakar ↔ Diamniadio. */
export const GARES_TER_DAKAR_DIAMNIADIO: readonly GareTER[] = [
  { id: 'ter-dakar', nom: 'Dakar - Gare ferroviaire', offsetAller: 0 },
  { id: 'ter-colobane', nom: 'Colobane', offsetAller: 4 },
  { id: 'ter-hann', nom: 'Hann', offsetAller: 7 },
  { id: 'ter-dalifort', nom: 'Dalifort', offsetAller: 10 },
  { id: 'ter-baux-maraichers', nom: 'Baux Maraîchers', offsetAller: 13 },
  { id: 'ter-pikine', nom: 'Pikine', offsetAller: 16 },
  { id: 'ter-thiaroye', nom: 'Thiaroye', offsetAller: 19 },
  { id: 'ter-yeumbeul', nom: 'Yeumbeul', offsetAller: 23 },
  { id: 'ter-mbao', nom: 'Keur Mbaye Fall', offsetAller: 27 },
  { id: 'ter-pnr', nom: 'PNR Rufisque', offsetAller: 32 },
  { id: 'ter-rufisque', nom: 'Rufisque', offsetAller: 36 },
  { id: 'ter-bargny', nom: 'Bargny', offsetAller: 41 },
  { id: 'ter-diamniadio', nom: 'Diamniadio', offsetAller: 45 },
] as const

export const TER_DAKAR_DIAMNIADIO_DUREE_MINUTES = 45
export const TER_DAKAR_DIAMNIADIO_DISTANCE_KM = 36
export const TER_DAKAR_DIAMNIADIO_FREQUENCIES = OFFICIAL_REFERENCE_FREQUENCIES.ter.filter(
  (frequency) => frequency.routeSegment === 'DAKAR_DIAMNIADIO',
)

function heureDakar(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Africa/Dakar',
  }).format(date)
}

/**
 * Projette un seul train sur toutes les gares à partir de son départ au
 * terminus. Les départs sont issus de la grille TER déclarée, jamais du temps
 * réel. Dakar est UTC+0 ; le formatage explicite Africa/Dakar évite de
 * dépendre du fuseau du téléphone.
 */
export function genererHorairesTerDakarDiamniadio(
  sens: TerDakarDiamniadioDirection,
  maintenant: number = Date.now(),
): TerDakarDiamniadioSchedule | null {
  if (!Number.isFinite(maintenant)) return null

  const prochainDepart = nextReferencePassage(TER_DAKAR_DIAMNIADIO_FREQUENCIES, maintenant)
  if (!prochainDepart) return null

  const departMs = Date.parse(prochainDepart.nextDepartureAt)
  if (!Number.isFinite(departMs)) return null

  const gares = sens === 'aller'
    ? GARES_TER_DAKAR_DIAMNIADIO
    : [...GARES_TER_DAKAR_DIAMNIADIO].reverse()

  const rows = gares.map((gare, index) => {
    const decalageMinutes = sens === 'aller'
      ? gare.offsetAller
      : TER_DAKAR_DIAMNIADIO_DUREE_MINUTES - gare.offsetAller
    const passageMs = departMs + decalageMinutes * 60_000
    const passageAt = new Date(passageMs).toISOString()

    return {
      id: gare.id,
      nom: gare.nom,
      ordre: index + 1,
      decalageMinutes,
      estDepart: index === 0,
      estTerminus: index === gares.length - 1,
      heureFormatee: heureDakar(new Date(passageMs)),
      passageAt,
      dansMinutes: Math.max(0, Math.ceil((passageMs - maintenant) / 60_000)),
    }
  })

  // Garde-fou de production : aucun horaire du même train ne peut reculer.
  for (let index = 1; index < rows.length; index += 1) {
    if (Date.parse(rows[index].passageAt) < Date.parse(rows[index - 1].passageAt)) {
      throw new Error(`Offsets TER non chronologiques entre ${rows[index - 1].nom} et ${rows[index].nom}.`)
    }
  }

  return {
    direction: sens,
    departAt: prochainDepart.nextDepartureAt,
    heureDepart: heureDakar(new Date(departMs)),
    dureeMinutes: TER_DAKAR_DIAMNIADIO_DUREE_MINUTES,
    frequenceMinutes: prochainDepart.headwayMinutes,
    rows,
  }
}

export function libelleFrequenceTerDakarDiamniadio(): string {
  return TER_DAKAR_DIAMNIADIO_FREQUENCIES
    .map((frequency) => `${frequency.headwayMinutes} min · ${formatFrequencyDays(frequency)}`)
    .join(' / ')
}
