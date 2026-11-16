import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Footprints, Info, Route as RouteIcon } from 'lucide-react'
import { ALL_CORRIDOR_STOPS, networkLabelOf } from '../domain/corridors'
import { formatMeters, planReferenceJourney, PRIORITY_HINTS, PRIORITY_LABELS, type PlannerEndpoint, type PlannerOutcome, type PlannerPriority } from '../domain/planner'
import { MobilityLineBadges } from './MobilityBadge'
import { PlannerLegList } from './PlannerLegList'

export interface PlannerPoint {
  label: string
  lat: number
  lng: number
}

interface MultimodalPlannerProps {
  /** Point de départ choisi dans l'onglet Explorer (ou position GPS), réutilisé par Trajet. */
  mapOrigin?: PlannerPoint | null
  /** Destination choisie dans l'onglet Explorer, réutilisée par Trajet. */
  mapDestination?: PlannerPoint | null
}

const MAP_ORIGIN_VALUE = '__map_origin__'
const MAP_DESTINATION_VALUE = '__map_destination__'
const DEFAULT_ORIGIN_STOP_ID = 'ter-dakar'
const DEFAULT_DESTINATION_STOP_ID = 'brt-prefecture-guediawaye'

function pointKey(point: PlannerPoint | null | undefined): string {
  return point ? `${point.lat},${point.lng}` : ''
}

function endpointFromSelection(value: string, mapPoint: PlannerPoint | null, kind: 'origin' | 'destination'): PlannerEndpoint | null {
  if (value === (kind === 'origin' ? MAP_ORIGIN_VALUE : MAP_DESTINATION_VALUE)) {
    if (!mapPoint) return null
    return { label: mapPoint.label, lat: mapPoint.lat, lon: mapPoint.lng }
  }
  const stop = ALL_CORRIDOR_STOPS.find((candidate) => candidate.id === value)
  if (!stop) return null
  return { label: stop.name, lat: stop.lat, lon: stop.lon, stopId: stop.id }
}

/**
 * Calculatrice de trajets multimodaux sur le réseau de référence.
 * Les trois critères sont calculés sur le même graphe et les mêmes arrêts :
 * le plus rapide, le moins de changements et le moins de marche.
 */
export function MultimodalPlanner({ mapOrigin = null, mapDestination = null }: MultimodalPlannerProps) {
  const [pickedOrigin, setOriginValue] = useState<string>('ter-dakar')
  const [pickedDestination, setDestinationValue] = useState<string>('brt-prefecture-guediawaye')
  // Si le point choisi sur la carte disparaît, le champ revient à un arrêt réel
  // (sinon le <select> afficherait une option absente de la liste).
  const originValue = pickedOrigin === MAP_ORIGIN_VALUE && !mapOrigin ? DEFAULT_ORIGIN_STOP_ID : pickedOrigin
  const destinationValue = pickedDestination === MAP_DESTINATION_VALUE && !mapDestination ? DEFAULT_DESTINATION_STOP_ID : pickedDestination
  const priorities: readonly PlannerPriority[] = ['fastest', 'fewerTransfers', 'lessWalking']
  const [result, setResult] = useState<{ key: string; outcomes: Record<PlannerPriority, PlannerOutcome> } | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<PlannerPriority>('fastest')

  // Le résultat n’est affiché que tant que les points demandés sont inchangés :
  // un point modifié sur la carte ou dans la liste n’affiche jamais l’ancien trajet.
  const selectionKey = [originValue, destinationValue, pointKey(mapOrigin), pointKey(mapDestination)].join('|')
  const outcomes = result && result.key === selectionKey ? result.outcomes : null
  const outcome = outcomes?.[selectedPriority] ?? null

  const originOptions = useMemo(
    () => [
      ...(mapOrigin ? [{ value: MAP_ORIGIN_VALUE, label: `📍 ${mapOrigin.label} (carte)` }] : []),
      ...ALL_CORRIDOR_STOPS.map((stop) => ({ value: stop.id, label: `${networkLabelOf(stop.id)} · ${stop.name}` })),
    ],
    [mapOrigin],
  )
  const destinationOptions = useMemo(
    () => [
      ...(mapDestination ? [{ value: MAP_DESTINATION_VALUE, label: `📍 ${mapDestination.label} (carte)` }] : []),
      ...ALL_CORRIDOR_STOPS.map((stop) => ({ value: stop.id, label: `${networkLabelOf(stop.id)} · ${stop.name}` })),
    ],
    [mapDestination],
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const origin = endpointFromSelection(originValue, mapOrigin, 'origin')
    const destination = endpointFromSelection(destinationValue, mapDestination, 'destination')
    if (!origin || !destination) {
      const failure: PlannerOutcome = { ok: false, reason: 'SAME_POINT', message: 'Choisissez un départ et une destination valides.' }
      setResult({ key: selectionKey, outcomes: { fastest: failure, fewerTransfers: failure, lessWalking: failure, lowestFare: failure } })
      return
    }
    const calculated = Object.fromEntries(
      priorities.map((priority) => [priority, planReferenceJourney(origin, destination, priority)]),
    ) as Record<PlannerPriority, PlannerOutcome>
    setResult({ key: selectionKey, outcomes: calculated })
    setSelectedPriority('fastest')
  }

  return (
    <section className="planner-card" aria-label="Calculateur de trajets multimodaux">
      <div className="planner-head">
        <span className="planner-head-icon"><RouteIcon size={16} /></span>
        <div>
          <strong>Calculateur de trajets multimodaux</strong>
          <span>Réseau de référence : combinaisons TER, BRT, DDD et AFTU / TATA avec marche et attente estimées.</span>
        </div>
      </div>

      <form className="planner-form" onSubmit={submit}>
        <label className="planner-field">
          <span>Départ</span>
          <select value={originValue} onChange={(event) => setOriginValue(event.target.value)}>
            {originOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="planner-field">
          <span>Destination</span>
          <select value={destinationValue} onChange={(event) => setDestinationValue(event.target.value)}>
            {destinationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="primary-action planner-submit"><RouteIcon size={16} /><span>Calculer le trajet</span><ArrowRight size={15} /></button>
      </form>

      {outcome && !outcome.ok && (
        <p className="planner-error" role="status">{outcome.message}</p>
      )}

      {outcomes && (
        <div className="planner-result" role="status">
          <div className="planner-alternatives" aria-label="Comparer les itinéraires">
            {priorities.map((priority) => {
              const candidate = outcomes[priority]
              const available = candidate.ok
              return (
                <button
                  key={priority}
                  type="button"
                  className={`planner-alternative${selectedPriority === priority ? ' is-selected' : ''}`}
                  aria-pressed={selectedPriority === priority}
                  disabled={!available}
                  onClick={() => setSelectedPriority(priority)}
                  title={PRIORITY_HINTS[priority]}
                >
                  <strong>{PRIORITY_LABELS[priority]}</strong>
                  {available ? (
                    <span>≈ {candidate.totalMinutes} min · {candidate.transfers} changement{candidate.transfers > 1 ? 's' : ''} · {formatMeters(candidate.totalWalkM)} à pied</span>
                  ) : (
                    <span>Pas de parcours disponible</span>
                  )}
                </button>
              )
            })}
          </div>
          {outcome && !outcome.ok && <p className="planner-error">{outcome.message}</p>}
          {outcome && outcome.ok && (
            <>
              <div className="planner-summary">
                <strong>≈ {outcome.totalMinutes} min</strong>
                <span>{outcome.transfers} correspondance{outcome.transfers > 1 ? 's' : ''}</span>
                <span className="strip-divider" />
                <span><Footprints size={13} /> {formatMeters(outcome.totalWalkM)}</span>
                {outcome.boardedLines.length > 0 && <span className="strip-divider" />}
                {outcome.boardedLines.length > 0 && <MobilityLineBadges names={outcome.boardedLines} />}
              </div>
              <PlannerLegList legs={outcome.legs} />
              <p className="planner-footnote"><Info size={13} /> {outcome.limitation}</p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
