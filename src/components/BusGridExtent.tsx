import { useMemo } from 'react'
import { gridAt, type SourceHours } from '../domain/busSourceHours'

/** Bounds belong to the transcribed origin columns, not to an arbitrary
 * downstream stop. Midnight carry-over remains the sign's responsibility. */
export function BusGridExtent({hours, day, ranks}: {hours: SourceHours; day: number; ranks: number}) {
  const description = useMemo(() => {
    const g = gridAt(hours,day)
    if (!g) return 'Pas de grille applicable à cette date.'
    const origins = g.profiles.flatMap(p=>p.origins)
    if (!origins.length) return g.nextUntranscribedOrigin === null ? 'Aucun service indiqué sur la fiche pour ce jour.' : 'Aucune colonne horaire disponible pour ce jour.'
    const extent = g.nextUntranscribedOrigin ? 'Début de grille uniquement : la fiche comporte une lacune après les départs transcrits.' : 'Grille transcrite du premier au dernier départ de la fiche.'
    return `${extent} ${origins.length} départs transcrits pour ${g.ranks.length} des ${ranks} rangs. Les heures sources restent dans la fiche d’origine.`
  }, [hours, day, ranks])
  return <small className="station-board-itinerary-pending">{description}</small>
}
