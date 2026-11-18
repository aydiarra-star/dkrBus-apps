import { Clock3, Footprints, Layers3, ShieldCheck } from 'lucide-react'
import { CORRIDOR_LINES } from '../domain/corridors'
import { fareForJourney, fareStatusLabel } from '../domain/fares'
import type { Preferences } from '../domain/preferences'
import { formatDistance, formatDuration, transferLabel } from '../domain/units'
import type { Leg, Outcome } from '../routing/model'
import { criterionLabels, dakarClock } from '../routing/presentation'
import { MobilityBadge } from './MobilityBadge'
import './VerifiedJourneys.css'

const walkLabel = { access: 'Accès à pied', egress: 'Marche finale', direct: 'Marche', transfer: 'Correspondance à pied' }
const accessible = { unknown: 'Accessibilité sans marches non renseignée', no: 'Parcours non accessible sans marches', yes: 'Parcours sans marches vérifié' }
function minutes(s: number) { return s > 0 && s < 60 ? '< 1 min' : `${Math.round(s / 60)} min` }
function Step({ leg, preferences }: { leg: Leg; preferences: Preferences }) {
  const distance = formatDistance(leg.meters, preferences.units.distance)
  return <li>
    {leg.kind === 'ride' ? <>
      <span className="verified-wait"><Clock3 size={13} /> Attente à {leg.from.name} : {minutes(leg.waitSeconds)}{leg.headwaySeconds !== null && ` · intervalle ${minutes(leg.headwaySeconds)}`}</span>
      <div><MobilityBadge id={leg.network}>{leg.network === 'aftu_tata' ? `${leg.mode.toUpperCase()} · ` : ''}{leg.lineName}</MobilityBadge> <strong>{dakarClock(leg.start)} · {leg.from.name}</strong></div>
      <p>Sens {leg.direction} · Descendre à <strong>{leg.to.name}</strong> vers {dakarClock(leg.end)}.</p>
      <p>{distance} · {minutes(leg.end - leg.start)} à bord · {leg.timing === 'frequency' ? 'passage projeté selon la fréquence' : 'horaire théorique déclaré'}.</p>
      <p>{leg.timing === 'frequency' ? 'Créneaux estimés' : 'Départs déclarés'} à {leg.from.name} : {leg.passages.map(dakarClock).join(' · ')}.</p>
      <details><summary>Desserte et sources</summary><p>{leg.stops.map(s => s.name).join(' → ')}</p><p>{leg.source} · {leg.serviceSource} · {leg.timingSource}.</p></details>
    </> : <>
      <strong><Footprints size={14} /> {walkLabel[leg.role]} · {dakarClock(leg.start)}–{dakarClock(leg.end)}</strong>
      <p>{leg.from.name} → {leg.to.name} · {distance} · {minutes(leg.end - leg.start)}.</p>
      <p>{leg.ways.map(w => w.name).join(' → ')}</p>
      <details><summary>Sources du cheminement</summary>{leg.ways.map(w => <p key={w.id}>{w.name} · {w.evidence.reference} · {w.evidence.date}</p>)}</details>
    </>}
    <small>{accessible[leg.stepFree]}</small>
  </li>
}

export function VerifiedJourneys({ result, selectedId, onSelect, preferences }: {
  result: Outcome; selectedId?: string; onSelect: (id: string) => void; preferences: Preferences
}) {
  return <section className="verified-journeys" aria-label="Itinéraires sur tracés vérifiés" aria-live="polite">
    <header><ShieldCheck size={18} /><div><span className="eyebrow">CALCUL SUR TRACÉS VÉRIFIÉS</span><h3>{result.ok ? 'Votre trajet' : 'Pas d’itinéraire vérifié'}</h3></div></header>
    {!result.ok ? <p role="status">{result.message}</p> : <>
      <p className="verified-hint">Heures de Dakar. Les créneaux de fréquence et les durées sont des estimations, pas des passages garantis.</p>
      {result.options.map(trip => {
        const selected = selectedId === trip.id
        const rides = trip.legs.flatMap(l => l.kind === 'ride' ? [l] : [])
        const fareLegs = rides.flatMap(l => {
          const line = CORRIDOR_LINES.find(r => r.id === l.lineId && r.network === l.network)
          return line ? [{ line, fromStopId: l.from.id, toStopId: l.to.id }] : []
        })
        return <article key={trip.id} className={`verified-trip${selected ? ' is-selected' : ''}`}>
          <span className="eyebrow">{result.options.length === 1 ? 'SEUL PARCOURS CALCULABLE' : trip.best.map(c => criterionLabels[c]).join(' · ')}</span>
          <h4>{dakarClock(trip.start)} → {dakarClock(trip.end)} <span>≈ {formatDuration(trip.totalSeconds / 60, preferences.units.duration)}</span></h4>
          <p>{rides.map((r, i) => <MobilityBadge key={i} id={r.network}>{r.lineName}</MobilityBadge>)} {' '}{transferLabel(trip.changes)} · {formatDistance(trip.meters, preferences.units.distance)}</p>
          <p>Marche : {minutes(trip.walkSeconds)} ({formatDistance(trip.walkMeters, preferences.units.distance)}) · Attente : {minutes(trip.waitSeconds)} · À bord : {minutes(trip.rideSeconds)}.</p>
          {preferences.mobility.showFares && <p>Tarif de référence : {fareLegs.length === rides.length ? fareStatusLabel(fareForJourney(fareLegs, { terClass: preferences.mobility.terClass })) : 'non disponible'}.</p>}
          {result.options.length > 1 && <button type="button" className="text-action" aria-pressed={selected} onClick={() => onSelect(trip.id)}><Layers3 size={14} /> {selected ? 'Affiché sur la carte' : 'Afficher ce trajet sur la carte'}</button>}
          <ol>{trip.legs.map((leg, i) => <Step key={i} leg={leg} preferences={preferences} />)}</ol>
        </article>
      })}
    </>}
    <p className="verified-hint">Périmètre actuel : gares TER de phase 1 et BRT B1, dans les sens contrôlés. Un trajet entre arrêts suppose le voyageur déjà au point de montée ; il ne certifie pas l’accès depuis la rue. Aucun transfert piéton n’est activé à Dakar sans preuve quai à quai.</p>
  </section>
}
