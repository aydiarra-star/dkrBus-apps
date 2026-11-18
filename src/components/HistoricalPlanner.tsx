import { useMemo, useState } from 'react'
import { planJourneyOptions } from '../domain/journeyOptions'
import { plannerPreferences, type Preferences } from '../domain/preferences'
import { speak, speechSynthesisSupported } from '../domain/speech'
import { JourneyOptions } from './JourneyOptions'
import { MultimodalPlanner, type PlannerPoint } from './MultimodalPlanner'

type Point = PlannerPoint & { stopId?: string }
/** Kept as an explicit simulation. Never a fallback, announcement or map
 * source for the passenger router. Don't run it until explicitly opened. */
export function HistoricalPlanner({ origin, destination, preferences }: { origin?: Point; destination?: Point; preferences: Preferences }) {
  const [open, setOpen] = useState(false)
  const plan = useMemo(() => open && origin && destination ? planJourneyOptions({ ...origin, lon: origin.lng }, { ...destination, lon: destination.lng }, plannerPreferences(preferences)) : null, [open, origin, destination, preferences])
  return <details className="advanced-planner" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>Simulateur historique · estimations non vérifiées</summary>
    {open && <>
      <p>Comparaison du modèle historique uniquement : accès, distances ou sens non vérifiés. Ces simulations ne sont pas des itinéraires à suivre et ne sont pas tracées sur la carte.</p>
      {origin && destination && plan && <JourneyOptions origin={origin} destination={destination} plan={plan} preferences={plannerPreferences(preferences)} units={preferences.units.distance} speak={preferences.language.interface} onReadAloud={speechSynthesisSupported() ? (text, lang) => { speak({ text, lang }) } : undefined} />}
      <MultimodalPlanner mapOrigin={origin} mapDestination={destination} />
    </>}
  </details>
}
