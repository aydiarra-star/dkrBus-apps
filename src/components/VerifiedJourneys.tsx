import { PassageClock, usePassageClock } from './PassageClock'
import { PassageArcs } from './PassageArcs'
import { formatPassageCountdown } from '../domain/headways'
import { midnight } from '../domain/stopPassageCountdown'
import type { OperatorDrawing } from '../data/reviewedAftuDrawings'
import { Clock3, Footprints, Layers3, ShieldCheck } from 'lucide-react'
import { CORRIDOR_LINES } from '../domain/corridors'
import { fareForJourney, fareStatusLabel } from '../domain/fares'
import type { Preferences } from '../domain/preferences'
import { formatDistance, formatDuration, transferLabel } from '../domain/units'
import type { ChangeLead, ChangeSide } from '../routing/changePreparation'
import { BUS_SECTION_WAYS } from '../data/busSectionWays'
import type { BusMapSection } from '../routing/busGeography'
import type { StopSection } from '../routing/placeConnections'
import type { Leg } from '../routing/model'
import type { DakarOutcome } from '../routing/dakar'
import { criterionLabels, dakarClock, dakarClockAtSecond } from '../routing/presentation'
import { MobilityBadge } from './MobilityBadge'
import './VerifiedJourneys.css'

const walkLabel = { access: 'Accès à pied', egress: 'Marche finale', direct: 'Marche', transfer: 'Correspondance à pied' }
const accessible = { unknown: 'Accessibilité sans marches non renseignée', no: 'Parcours non accessible sans marches', yes: 'Parcours sans marches vérifié' }
function minutes(s: number) { return s > 0 && s < 60 ? '< 1 min' : `${Math.round(s / 60)} min` }
/** Unlike a station board, an itinerary refers to ONE specific run. Never
 * roll it over to a later departure: its connection would have to be replanned. */
function LegClock({ leg, now }: { leg: Leg; now: number }) {
  const start = leg.start * 1000, end = leg.end * 1000
  const before = now < start, target = before ? start : end
  if (midnight(target) !== midnight(now) || now >= end) return null
  const estimate = leg.kind === 'walk' || leg.timing === 'frequency' || leg.timeProfile === 'model'
  const label = leg.kind === 'walk' ? (before ? 'Début de marche prévu dans' : 'Fin de marche prévue dans')
    : before ? (estimate ? 'Montée estimée dans' : 'Montée prévue dans') : `Montée passée. Si vous êtes à bord, descente ${estimate ? 'estimée' : 'prévue'} dans`
  return <p className="leg-clock" role="timer" aria-live="off">{label} <span><PassageArcs />{formatPassageCountdown(Math.ceil((target - now) / 60_000))} · <PassageClock atMs={target} now={now} /></span> (min:s)</p>
}
function Step({ leg, preferences, now }: { leg: Leg; preferences: Preferences; now?: number }) {
  const distance = formatDistance(leg.meters, preferences.units.distance)
  const projected = leg.kind === 'ride' && (leg.timing === 'frequency' || leg.timeProfile === 'model')
  return <li>
    {leg.kind === 'ride' ? <>
      {leg.timing === 'frequency' && leg.mode === 'ddd' && <p><strong>Passage modélisé, pas un horaire DDD.</strong> {leg.serviceSource}</p>}
      {leg.samePlatformChange && <p>Changement au même point du quai, sans marche. Délai minimal vérifié : {leg.samePlatformChange.minimumSeconds} s.</p>}
      <span className="verified-wait"><Clock3 size={13} /> Attente à {leg.from.name} : {minutes(leg.waitSeconds)}{leg.headwaySeconds !== null && ` · intervalle ${minutes(leg.headwaySeconds)}`}</span>
      {leg.changeBufferSeconds !== undefined && <p>Arrivée prévue au point de montée : {dakarClockAtSecond(leg.start - leg.waitSeconds)}.
        {' '}Marge incluse dans l’attente : {leg.changeBufferSeconds} s (jusqu’à {dakarClockAtSecond(leg.start - leg.waitSeconds + leg.changeBufferSeconds)}).
        {' '}Temps restant après cette marge : {leg.waitSeconds - leg.changeBufferSeconds} s, pour un départ à {dakarClockAtSecond(leg.start)}.</p>}
      <div><MobilityBadge id={leg.network}>{leg.network === 'aftu_tata' ? `${leg.mode.toUpperCase()} · ` : ''}{leg.lineName}</MobilityBadge> <strong>{projected ? 'Vers ' : ''}{dakarClock(leg.start)} · {leg.from.name}</strong></div>
      <p>Sens {leg.direction} · Descendre à <strong>{leg.to.name}</strong> vers {dakarClock(leg.end)}.</p>
      <p>{distance} · {minutes(leg.end - leg.start)} à bord · {leg.timing === 'frequency' ? 'passage projeté selon la fréquence' : projected ? 'durée de parcours modélisée' : 'horaire théorique déclaré'}.</p>
      <p>{projected ? 'Créneaux estimés' : 'Départs déclarés'} à {leg.from.name} : {leg.passages.map(dakarClock).join(' · ')}.</p>
      <details><summary>Desserte et sources</summary><p>{leg.stops.map(s => s.name).join(' → ')}</p><p>{leg.source} · {leg.serviceSource} · {leg.timingSource}.</p>
        {leg.samePlatformChange && <p>Changement : {leg.samePlatformChange.evidence.reference} · {leg.samePlatformChange.evidence.date}.</p>}</details>
    </> : <>
      <strong><Footprints size={14} /> {walkLabel[leg.role]} · {dakarClock(leg.start)}–{dakarClock(leg.end)}</strong>
      <p>{leg.from.name} → {leg.to.name} · {distance} · {minutes(leg.end - leg.start)}.</p>
      {leg.ways.some(w => w.onlyFor) && <p>Accès voyageurs uniquement. La marche commence et finit aux points indiqués ; aucun trajet depuis le trottoir voisin n’est inclus.</p>}
      <p>{leg.ways.map(w => w.name).join(' → ')}</p>
      <details><summary>Sources du cheminement</summary>{leg.ways.map(w => <p key={w.id}>{w.name} · {w.evidence.reference} · {w.evidence.date}
        {leg.role === 'transfer' && w.transferTiming && <>. Temps relevé dans ce sens : {w.transferTiming.seconds} s · {w.transferTiming.evidence.reference} · {w.transferTiming.evidence.date}.</>}</p>)}</details>
    </>}
    {now !== undefined && <LegClock leg={leg} now={now} />}
    <small>{accessible[leg.stepFree]}</small>
  </li>
}

export type ChooseSection = (section: Pick<StopSection, 'from' | 'to'> & { tripId?: string }) => void
function DrawingNote({ drawing, url }: { drawing: OperatorDrawing; url: string }) {
  return <p><a href={url} target="_blank" rel="noreferrer">Carte du sens publié par l’AFTU</a> : {drawing.from} → {drawing.to} ({(drawing.meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km sur le dessin entier). Ce n’est ni la distance de votre trajet ni la position d’un quai.</p>
}
function Side({ side, onChoose }: { side: ChangeSide; onChoose: ChooseSection }) {
  return <li><strong>{side.line}</strong> · « {side.from} » → « {side.to} »<br />
    {side.kind === 'sheet' ? <><a href={side.url} target="_blank" rel="noreferrer">{side.source}</a> · <a href={`tel:${side.contact.phone.replaceAll(' ', '')}`}>Renseignements {side.contact.name}</a>{side.drawing && <DrawingNote drawing={side.drawing} url={side.url} />}</>
      : <button className="text-action" type="button" onClick={() => onChoose(side.section)}>Calculer ce tronçon seul</button>}
  </li>
}
function ChangeDetails({ changes, onChoose }: { changes: ChangeLead[]; onChoose: ChooseSection }) {
  return <div className="connection-details"><h4>Préparer un changement · à confirmer</h4>
    <p>Ces lignes se documentent séparément. Aucun chemin à pied ni horaire de correspondance n’est établi. Demandez où descendre, comment rejoindre le prochain quai et à quelle heure passe le dernier service.</p>
    {changes.map((c, i) => <details key={c.hub} open={i === 0}><summary>{c.hub} · {c.before.line} puis {c.after.line}</summary>
      <ol><Side side={c.before} onChoose={onChoose} /><Side side={c.after} onChoose={onChoose} /></ol>
      <p>{c.check}</p>
      {c.poleUrl && <a href={c.poleUrl} target="_blank" rel="noreferrer">Voir le poteau sur OpenStreetMap</a>}
    </details>)}
  </div>
}
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
        <a href={d.url} target="_blank" rel="noreferrer">{d.source}</a>{d.window && <p>{d.window}</p>}{d.drawing && <DrawingNote drawing={d.drawing} url={d.url} />}
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

function GeographicPortion({ section: s, selected, onShow, preferences }: {
  section: BusMapSection; selected: boolean; onShow?: (id: string) => void; preferences: Preferences
}) {
  const { review, markers } = s
  const distance = (m: number) => formatDistance(m, preferences.units.distance)
  return <article className="verified-trip"><strong>{review.family.toUpperCase()} {review.line} · sens {review.towards}</strong>
    <p>{markers[0].name} → {markers.at(-1)!.name} · {distance(s.meters)} sur la voirie.</p>
    <p>{review.landmarkKind === 'road-limit' ? 'Les repères délimitent la voirie, pas des arrêts de montée ou de descente.' : 'Les quais figurent dans cet ordre sur la carte de la ligne. Aucun passage ni accès à pied n’est établi.'}</p>
    {(s.fromGapM !== null || s.toGapM !== null) && <p>Écart à vol d’oiseau, pas une marche : {[
      s.fromGapM !== null && `${distance(s.fromGapM)} au départ`, s.toGapM !== null && `${distance(s.toGapM)} à l’arrivée`,
    ].filter(Boolean).join(' ; ')}.</p>}
    {onShow && <button type="button" className="text-action" aria-pressed={selected} onClick={() => onShow(s.id)}><Layers3 size={14} /> {selected ? 'Masquer cette portion' : 'Voir cette portion sur la carte'}</button>}
    <details><summary>Repères et sources de la portion</summary><p>{markers.map(m => m.name).join(' → ')}</p>
      {review.sourceSlice && <p>Pour la portion entière : fiche transcrite, {review.sourceSlice.side === 'inbound' ? 'retour' : 'aller'}, rangs {review.sourceSlice.first} à {review.sourceSlice.last}. Les occurrences de la fiche ne sont pas des quais localisés.</p>}
      <a href={review.descriptionUrl} target="_blank" rel="noreferrer">Description de la ligne</a> · {review.relation ? <a href={`https://api.openstreetmap.org/api/0.6/relation/${review.relation}/${review.version}.json`} target="_blank" rel="noreferrer">Relation OSM {review.relation} v{review.version}</a>
        : <><a href={review.directionUrl} target="_blank" rel="noreferrer">Recoupement du sens</a>{review.ways.map(w => <span key={w}> · <a href={`https://api.openstreetmap.org/api/0.6/way/${Math.abs(w)}/${BUS_SECTION_WAYS[Math.abs(w)].version}.json`} target="_blank" rel="noreferrer">Voie OSM {Math.abs(w)} v{BUS_SECTION_WAYS[Math.abs(w)].version}</a></span>)}</>} · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© les contributeurs OpenStreetMap · ODbL</a>
    </details></article>
}

export function VerifiedJourneys({ result, selectedId, onSelect, onChooseSection, preferences, shownPortion, onShowPortion }: {
  shownPortion?: string; onShowPortion?: (id: string) => void
  result: DakarOutcome; onChooseSection: ChooseSection; selectedId?: string; onSelect: (id: string) => void; preferences: Preferences
}) {
  const now = usePassageClock(result.ok && Boolean(selectedId))
  return <section className="verified-journeys" aria-label="Itinéraires sur tracés vérifiés" aria-live="polite">
    <header><ShieldCheck size={18} /><div><span className="eyebrow">CALCUL SUR TRACÉS VÉRIFIÉS</span><h3>{result.ok ? 'Votre trajet' : result.code === 'DOCUMENTED_SECTION_ONLY' ? 'Tracé disponible, passage non confirmé' : 'Pas d’itinéraire vérifié'}</h3></div></header>
    {!result.ok ? <><p role="status">{result.message}</p>
      {!!result.mapSections?.length && <div className="connection-details"><h4>Portion cartographiée · sans horaire</h4>
        {result.mapSections.some(s => s.review.id === 'tata-1-fass') && <p>À Fass, les fiches AFTU 1 et TATA 1 décrivent la même chaussée. Ce ne sont pas deux services confirmés.</p>}
        {result.mapSections.length > 1 && !result.mapSections.some(s => s.review.id === 'tata-1-fass') && <p>Choisissez la fiche à afficher. Deux fiches sur la même rue ne prouvent pas deux services ni une correspondance.</p>}
        {result.mapSections.map(s => <GeographicPortion key={s.id} section={s} selected={s.id === shownPortion} onShow={onShowPortion} preferences={preferences} />)}</div>}
      <ConnectionDetails failure={result} preferences={preferences} onChoose={onChooseSection} />{Boolean(result.changesToCheck?.length) && <ChangeDetails changes={result.changesToCheck!} onChoose={onChooseSection} />}</> : <>
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
          <ol>{trip.legs.map((leg, i) => <Step key={i} leg={leg} preferences={preferences} now={selected ? now : undefined} />)}</ol>
        </article>
      })}
    </>}
    <p className="verified-hint">Sans édition opérateur : TER Dakar → Diamniadio ; B1 Préfecture → Petersen et Petersen → Gueule Tapée ; DDD 1 de l’École Manguiers à El Malick Sandaga vers Leclerc, et de PMI Médina à Rue 37 vers les Parcelles. Pour B1, vérifier la desserte du jour : la liste de stations est celle du modèle de référence. Un trajet entre arrêts suppose le voyageur déjà au point de montée ; il ne certifie pas l’accès depuis la rue. Aucun transfert piéton n’est activé à Dakar sans preuve quai à quai.</p>
  </section>
}
