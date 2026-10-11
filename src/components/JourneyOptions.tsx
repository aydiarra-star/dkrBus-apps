import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarClock, Footprints, RefreshCw, Volume2 } from 'lucide-react'
import {
  alternativeOf,
  optionSummaryLine,
  planRoundTrip,
  type JourneyOption,
  type JourneyPlan,
  type JourneyPlanOutcome,
  type JourneyPlanPreferences,
  type JourneyRoundTripPlan,
} from '../domain/journeyOptions'
import { formatDistance, formatEstimatedDuration, transferLabel } from '../domain/units'
import type { DistanceUnits } from '../domain/preferences'
import type { PlannerEndpoint, PlannerPriority } from '../domain/planner'
import { woOptionLine } from '../domain/wolof'
import { MobilityLineBadges } from './MobilityBadge'
import { PlannerLegList } from './PlannerLegList'

type Point = { label: string; lat: number; lng: number; stopId?: string }

const toEndpoint = (point: Point): PlannerEndpoint => ({
  label: point.label, lat: point.lat, lon: point.lng, stopId: point.stopId,
})

const CRITERION_CARDS: { priority: PlannerPriority; title: string; hint: string }[] = [
  { priority: 'fastest', title: 'Le plus rapide', hint: 'Préférence donnée aux lignes à cadence publiée (TER, BRT).' },
  { priority: 'fewerTransfers', title: 'Moins de correspondances', hint: 'Le moins de changements possible sur le réseau connu.' },
  { priority: 'lessWalking', title: 'Moins de marche', hint: 'Accès et correspondances au plus court.' },
  { priority: 'lowestFare', title: 'Le moins cher', hint: 'Somme des tickets publiés, uniquement si toutes les lignes sont tarifées.' },
]

const cardFor = (priority: PlannerPriority): { title: string; hint: string } =>
  CRITERION_CARDS.find((card) => card.priority === priority) ?? { title: 'Itinéraire', hint: 'Calculé sur le réseau de référence.' }

/**
 * Comparateur d'itinéraires du référentiel : les critères réellement calculés,
 * l'aller-retour recalculé dans l'autre sens, et la bascule sur l'autre option
 * distincte. La marge d'incertitude est affichée avec la durée, jamais renvoyée
 * en note de bas de page.
 */
export function JourneyOptions({
  origin,
  destination,
  plan,
  preferences,
  units = 'metric',
  speak = 'fr',
  onReadAloud,
}: {
  origin: Point
  destination: Point
  /** Calcul déjà obtenu par le panneau de saisie : aucune double recherche. */
  plan: JourneyPlanOutcome | null
  preferences?: JourneyPlanPreferences
  units?: DistanceUnits
  speak?: 'fr' | 'wo'
  onReadAloud?: (text: string, language: 'fr' | 'wo') => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [roundTrip, setRoundTrip] = useState<{ key: string; title: string; plan: JourneyRoundTripPlan | null } | null>(null)
  const key = `${origin.lat},${origin.lng},${origin.stopId ?? ''}|${destination.lat},${destination.lng},${destination.stopId ?? ''}`
  const alternatives = useMemo(() => {
    if (!plan?.ok) return new Map<string, JourneyOption | null>()
    return new Map(plan.options.map((option) => [option.key, alternativeOf(plan, option.key)]))
  }, [plan])

  if (!plan) {
    return (
      <section className="journey-options" aria-label="Itinéraires de référence">
        <header className="journey-options-head">
          <div>
            <span className="eyebrow">RÉSEAU DE RÉFÉRENCE</span>
            <h3>Comparer les itinéraires</h3>
          </div>
        </header>
        <p className="journey-options-empty">
          Lancez une recherche pour obtenir les itinéraires calculés sur le réseau de référence. Trois critères sont
          comparés dès que les données le permettent : le plus rapide, le moins de correspondances et le moins de marche.
        </p>
      </section>
    )
  }

  if (!plan.ok) {
    return (
      <section className="journey-options" aria-label="Itinéraires de référence">
        <p role="status">{plan.message}</p>
      </section>
    )
  }

  function compareReturn(option: JourneyOption) {
    const computed = planRoundTrip(toEndpoint(origin), toEndpoint(destination), preferences)
    setRoundTrip({ key, title: cardFor(option.priority).title, plan: computed.ok ? computed : null })
    if (!computed.ok && onReadAloud) onReadAloud(computed.failure.message, speak)
  }

  return (
    <section className="journey-options" aria-label="Itinéraires de référence">
      <header className="journey-options-head">
        <div>
          <span className="eyebrow">RÉSEAU DE RÉFÉRENCE</span>
          <h3>{plan.originLabel} → {plan.destinationLabel}</h3>
          <p>
            {plan.options.length} itinéraire{plan.options.length > 1 ? 's' : ''} distinct{plan.options.length > 1 ? 's' : ''} calculé
            {plan.options.length > 1 ? 's' : ''} · durées estimées avec leur marge · aucune donnée temps réel.
          </p>
        </div>
        {onReadAloud && (
          <button type="button" className="ghost-button" onClick={() => onReadAloud(spokenSummary(plan, speak, units), speak)}>
            <Volume2 size={15} /> Énoncer la réponse
          </button>
        )}
      </header>

      <ol className="journey-option-list">
        {plan.options.map((option, index) => {
          const card = cardFor(option.priority)
          const open = openKey === option.key
          const alternative = alternatives.get(option.key) ?? null
          return (
            <li key={option.key} className={`journey-option${index === 0 ? ' is-preferred' : ''}`}>
              <article>
                <header>
                  <div className="journey-option-title">
                    <span className="journey-option-rank" aria-hidden="true">{index + 1}</span>
                    <h4>{card.title}</h4>
                    {option.result.boardedLines.length > 0
                      ? <MobilityLineBadges names={option.result.boardedLines} />
                      : <span className="journey-option-plain">À pied uniquement</span>}
                  </div>
                  <span className="journey-option-tag">
                    {['duration', 'walking', 'transfers', 'fare'].filter((criterion) => option.best[criterion as keyof JourneyOption['best']]).map((criterion) => ({ duration: 'meilleure durée', walking: 'moins de marche', transfers: 'moins de correspondances', fare: 'meilleur tarif' })[criterion] as string).join(' · ') || option.tagline}
                  </span>
                </header>

                <dl className="journey-option-metrics">
                  <div>
                    <dt>Durée estimée</dt>
                    <dd>
                      {formatEstimatedDuration(option.metrics.displayMinutes, option.metrics.uncertaintyMinutes)}
                      <small>{option.result.frequencyBasis === 'officialReference' ? 'fréquences publiées' : 'fréquences en partie estimées'}</small>
                    </dd>
                  </div>
                  <div><dt>Marche</dt><dd>{formatDistance(option.metrics.walkMeters, units)}<small>{option.metrics.waitMinutes} min d’attente</small></dd></div>
                  <div><dt>Correspondances</dt><dd>{transferLabel(option.metrics.transfers)}<small>{option.result.networksUsed.join(' → ')}</small></dd></div>
                  <div><dt>Tarif</dt><dd>{option.metrics.fareLabel}<small>{option.metrics.fareNote}</small></dd></div>
                </dl>

                <div className="journey-option-actions">
                  <button type="button" className="text-action" aria-expanded={open} onClick={() => setOpenKey(open ? null : option.key)}>
                    <Footprints size={14} /> {open ? 'Masquer les étapes' : 'Voir les étapes'}
                  </button>
                  <button type="button" className="text-action" onClick={() => compareReturn(option)}>
                    <RefreshCw size={14} /> {roundTrip?.key === key && roundTrip.title === card.title ? 'Aller-retour affiché' : 'Calculer l’aller-retour'}
                  </button>
                  {alternative && (
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => {
                        setOpenKey(alternative.key)
                        if (onReadAloud) onReadAloud(`${cardFor(alternative.priority).title} : ${optionSummaryLine(alternative)}`, speak)
                      }}
                    >
                      <ArrowLeftRight size={14} /> Comparer avec l’autre option ({cardFor(alternative.priority).title.toLowerCase()})
                    </button>
                  )}
                </div>

                {open && (
                  <div className="journey-option-steps">
                    <PlannerLegList legs={option.result.legs} />
                    <p className="journey-option-source">
                      {card.hint} Marge ± {option.result.uncertaintyMinutes} min : horaires non publiés pour certaines lignes, donc fréquence estimée. Vérifiez le service auprès des opérateurs avant de partir.
                    </p>
                  </div>
                )}
              </article>
            </li>
          )
        })}
      </ol>

      {roundTrip?.key === key && roundTrip.plan && roundTrip.plan.ok && (
        <div className="journey-roundtrip" role="status" aria-live="polite">
          <header>
            <CalendarClock size={15} />
            <strong>Aller-retour · {roundTrip.title}</strong>
            <span>Le retour est recalculé dans l’autre sens, il n’est pas copié depuis l’aller.</span>
          </header>
          <RoundTripLeg label="Aller" plan={roundTrip.plan.outbound} units={units} />
          {roundTrip.plan.return.ok
            ? <RoundTripLeg label="Retour" plan={roundTrip.plan.return} units={units} />
            : <p className="journey-option-warning">Retour impossible sur le réseau de référence : {roundTrip.plan.return.message}</p>}
          {[...new Set([...roundTrip.plan.outbound.notes, ...(roundTrip.plan.return.ok ? roundTrip.plan.return.notes : [])])].map((note) => (
            <p className="journey-option-warning" key={note}>{note}</p>
          ))}
        </div>
      )}

      {roundTrip?.key === key && roundTrip.plan && !roundTrip.plan.ok && (
        <p className="journey-option-warning" role="status">Aller-retour non calculable : {roundTrip.plan.failure.message}</p>
      )}

      {plan.notes.length > 0 && (
        <ul className="journey-options-notes">
          {plan.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </section>
  )
}

function RoundTripLeg({ label, plan, units }: { label: string; plan: JourneyPlan; units: DistanceUnits }) {
  return (
    <div className="journey-roundtrip-leg">
      <strong>{label} · {plan.originLabel} → {plan.destinationLabel}</strong>
      <ol>
        {plan.options.map((option) => (
          <li key={option.key}>
            {cardFor(option.priority).title} · {option.result.boardedLines.join(' + ') || 'à pied'} ·{' '}
            {formatEstimatedDuration(option.metrics.displayMinutes, option.metrics.uncertaintyMinutes)} ·{' '}
            {formatDistance(option.metrics.walkMeters, units)} de marche · {transferLabel(option.metrics.transfers)} · {option.metrics.fareLabel}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Texte énoncé : mêmes chiffres que l'écran, dans la langue de la question. */
function spokenSummary(plan: JourneyPlan, language: 'fr' | 'wo', units: DistanceUnits): string {
  if (language === 'wo') {
    return `${plan.originLabel} → ${plan.destinationLabel}. ${plan.options.map((option, index) => woOptionLine(option, index)).join('. ')}`
  }
  return `${plan.originLabel} vers ${plan.destinationLabel} : ${plan.options.map((option, index) => `${index + 1}. ${cardFor(option.priority).title}, ${optionSummaryLine(option)}`).join('. ')}. Durées estimées sur le réseau de référence, sans temps réel. Vérifiez le service auprès des opérateurs avant de partir${units === 'imperial' ? ' (distances en miles)' : ''}.`
}
