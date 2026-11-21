import { useMemo } from 'react'
import { gridAt, type SourceHours } from '../domain/busSourceHours'

/** Bounds belong to the transcribed origin columns, not to an arbitrary
 * downstream stop. Midnight carry-over remains the sign's responsibility. */
export function BusGridExtent({hours, day, ranks}: {hours: SourceHours; day: number; ranks: number}) {
  const description = useMemo(() => {
    const g = gridAt(hours,day)
    if (!g) return 'Pas de grille applicable à cette date.'
    const origins = g.profiles.flatMap(p=>p.origins).sort()
    if (!origins.length) return g.nextUntranscribedOrigin === null ? 'Aucun service indiqué sur la fiche pour ce jour.' : 'Aucune colonne horaire disponible pour ce jour.'
    const extent = g.nextUntranscribedOrigin ? `Début de grille uniquement : lacune dès le départ de ${g.nextUntranscribedOrigin}.` : 'Du premier au dernier départ de cette fiche.'
    return `${extent} ${origins.length} départs transcrits (${origins[0]} à ${origins.at(-1)}) pour ${g.ranks.length} des ${ranks} rangs. Ces bornes concernent le départ, pas l’arrivée.`
  }, [hours, day, ranks])
  return <small className="station-board-itinerary-pending">{description}</small>
}
