import { Clock3, Footprints, Layers3, ShieldCheck } from 'lucide-react'
import { CORRIDOR_LINES } from '../domain/corridors'
import { fareForJourney, fareStatusLabel } from '../domain/fares'
import type { Preferences } from '../domain/preferences'
import { formatDistance, formatDuration, transferLabel } from '../domain/units'
import type { StopSection } from '../routing/placeConnections'
import type { Leg } from '../routing/model'
import type { DakarOutcome } from '../routing/dakar'
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

type ChooseSection = (section: StopSection) => void
function ConnectionDetails({ failure, preferences, onChoose }: {
  failure: Extract<DakarOutcome, { ok: false }>; preferences: Preferences; onChoose: ChooseSection
}) {
  const report = failure.connections
  if (!report) return null
  const distance = (m: number) => formatDistance(m, preferences.units.distance)
  const count = (n: number) => n === 0 ? 'aucun point' : `${n} point${n > 1 ? 's' : ''}`
  return <div className="connection-details">
    <p>Dans les dessertes vérifiées, à {distance(report.radiusM)} à vol d’oiseau ou moins : {[
      report.boardingCount !== null && `${count(report.boardingCount)} de montée près du départ`,
      report.alightingCount !== null && `${count(report.alightingCount)} de descente près de l’arrivée`,
    ].filter(Boolean).join(' ; ')}. Ce rayon ne mesure pas la marche.</p>
    {report.sections.length > 0 ? <>
      <h4>Tronçons calculables entre arrêts</h4>
      <p>À condition d’être déjà au départ du tronçon à l’heure demandée. Les liaisons manquantes ne sont pas incluses.</p>
      <ul>{report.sections.map(s => <li key={JSON.stringify([s.from.id, s.to.id])}>
        <strong>{s.from.name} → {s.to.name}</strong><br />
        {s.lines.join(' → ')} · montée vers {dakarClock(s.boardAt)}, arrivée vers {dakarClock(s.arriveAt)} · {transferLabel(s.changes)}.<br />
        <small>Écarts à vol d’oiseau : {[
          s.fromGapM !== null && `${distance(s.fromGapM)} au départ`, s.toGapM !== null && `${distance(s.toGapM)} à l’arrivée`,
        ].filter(Boolean).join(' ; ')}.</small><br />
        <button type="button" className="text-action" onClick={() => onChoose(s)}>Choisir ce tronçon à la place du trajet</button>
      </li>)}</ul>
    </> : report.boardingCount === 0 || report.alightingCount === 0 ?
      <p>Pas de tronçon calculable avec les données disponibles. Cela ne signifie pas qu’aucun bus ne circule.</p> :
      <p>Aucun tronçon entre les arrêts examinés ne convient à l’heure et aux réglages choisis, même en recherchant les correspondances vérifiées.</p>}
    {Boolean(failure.documentation?.length) && <details open>
      <summary>Fiches de lignes à vérifier · pas un itinéraire</summary>
      <p>La fiche cite ces noms dans cet ordre. Elle ne situe pas les quais aux points choisis et ne confirme ni le tracé ni le passage demandé.</p>
      <ul>{failure.documentation?.slice(0, 3).map(d => <li key={`${d.line}:${d.url}`}>
        <strong>{d.line}</strong> : « {d.fromLabel} » puis « {d.toLabel} ».<br />
        <a href={d.url} target="_blank" rel="noreferrer">{d.source}</a>{d.window && <p>{d.window}</p>}
        <details>
          <summary>Vérifier auprès du réseau {d.operator.name}</summary>
          <p>{d.question}</p>
          <p><a href={`tel:${d.operator.phone.replaceAll(' ', '')}`}>Appeler {d.operator.name} : {d.operator.phone}</a> · <a href={d.operator.sourceUrl} target="_blank" rel="noreferrer">Source du numéro</a></p>
          {d.officialLineUrl && <p><a href={d.officialLineUrl} target="_blank" rel="noreferrer">Fiche officielle {d.line}</a> · Présentation de la ligne, pas une confirmation du passage.</p>}
        </details>
      </li>)}</ul>
    </details>}
  </div>
}

export function VerifiedJourneys({ result, selectedId, onSelect, onChooseSection, preferences }: {
  result: DakarOutcome; onChooseSection: ChooseSection; selectedId?: string; onSelect: (id: string) => void; preferences: Preferences
}) {
  return <section className="verified-journeys" aria-label="Itinéraires sur tracés vérifiés" aria-live="polite">
    <header><ShieldCheck size={18} /><div><span className="eyebrow">CALCUL SUR TRACÉS VÉRIFIÉS</span><h3>{result.ok ? 'Votre trajet' : 'Pas d’itinéraire vérifié'}</h3></div></header>
    {!result.ok ? <><p role="status">{result.message}</p><ConnectionDetails failure={result} preferences={preferences} onChoose={onChooseSection} /></> : <>
      <p className="verified-hint">Heures de Dakar. Les créneaux de fréquence et les durées sont des estimations, pas des passages garantis.</p>
      {!selectedId && <p role="status">La variante précédente n’est plus disponible avec ces réglages. Choisissez un trajet pour l’afficher sur la carte.</p>}
      {result.options.map(trip => {
        const selected = selectedId === trip.id
        const rides = trip.legs.flatMap(l => l.kind === 'ride' ? [l] : [])
        const fareLegs = rides.flatMap(l => {
          const line = CORRIDOR_LINES.find(r => r.id === l.lineId && r.network === l.network)
          return line ? [{ line, fromStopId: l.stops[0].id, toStopId: l.stops.at(-1)!.id }] : []
        })
        return <article key={trip.id} className={`verified-trip${selected ? ' is-selected' : ''}`}>
          <span className="eyebrow">{result.options.length === 1 ? 'SEUL PARCOURS CALCULABLE' : trip.best.map(c => criterionLabels[c]).join(' · ')}</span>
          <h4>{dakarClock(trip.start)} → {dakarClock(trip.end)} <span>≈ {formatDuration(Math.ceil(trip.totalSeconds / 60), preferences.units.duration)}</span></h4>
          <p>{rides.map((r, i) => <MobilityBadge key={i} id={r.network}>{r.lineName}</MobilityBadge>)} {' '}{transferLabel(trip.changes)} · {formatDistance(trip.meters, preferences.units.distance)}</p>
          <p>Marche : {minutes(trip.walkSeconds)} ({formatDistance(trip.walkMeters, preferences.units.distance)}) · Attente : {minutes(trip.waitSeconds)} · À bord : {minutes(trip.rideSeconds)}.</p>
          {preferences.mobility.showFares && <p>Tarif de référence : {fareLegs.length === rides.length ? fareStatusLabel(fareForJourney(fareLegs, { terClass: preferences.mobility.terClass })) : 'non disponible'}.</p>}
          {(result.options.length > 1 || !selectedId) && <button type="button" className="text-action" aria-pressed={selected} onClick={() => onSelect(trip.id)}><Layers3 size={14} /> {selected ? 'Affiché sur la carte' : 'Afficher ce trajet sur la carte'}</button>}
          <ol>{trip.legs.map((leg, i) => <Step key={i} leg={leg} preferences={preferences} />)}</ol>
        </article>
      })}
    </>}
    <p className="verified-hint">Périmètre actuel : gares TER de phase 1 et BRT B1, dans les sens contrôlés. Un trajet entre arrêts suppose le voyageur déjà au point de montée ; il ne certifie pas l’accès depuis la rue. Aucun transfert piéton n’est activé à Dakar sans preuve quai à quai.</p>
  </section>
}
