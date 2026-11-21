import { Fragment, useMemo, useState } from 'react'
import tataStops from '../data/tataNamedStops.json'
import { DDD_TERMINUS_NOTICES } from '../data/dddTerminusNotices'
import { DddVariantNote, AftuReferenceNote } from './BusTerminusNotes'
import { BusSurveyNote } from './BusSurveyNote'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import { datedBusBoards, type BusBoardDirection, type BusFamily, type BusPassage } from '../domain/busPassageBoard'
import { BusGridExtent } from './BusGridExtent'
import { BusCoverageNote } from './BusCoverageNote'
import { consultationPage } from '../domain/busReadingCoverage'
import { compileSign } from '../domain/busSignReading'
import { midnight } from '../domain/stopPassageCountdown'
import type { Network } from '../routing/model'
import { PassageClock, usePassageClock } from './PassageClock'
import { PassageArcs } from './PassageArcs'
import { formatPassageCountdown } from '../domain/headways'
import { usePassengerNetwork } from './usePassengerNetwork'

/** Reuse the journey edition only when it is for the day on the sign. */
export interface ExplorerBusEdition { day: string; snapshot?: string; network: Network; rediscover: () => void }

function Passage({ passage, now, caption, model = false }: { passage: BusPassage; now: number; caption?: string; model?: boolean }) {
  const p = passage
  // Modelled phases and interpolated stop offsets are useful for planning,
  // not a deadline. Even the opt-in view must not count down to them.
  if (model) {
    return <span className="network-summary-passage station-board-passage is-undeclared bus-estimate"><strong>Projection non confirmée</strong><small>{caption ?? 'Estimé'}</small></span>
  }
  const at = 'at' in p ? p.at : null
  const minutes = p.state === 'active' ? p.minutes : p.state === 'upcoming' ? Math.max(1, Math.ceil((p.at - now) / 60_000)) : null
  const value = minutes !== null ? `Dans ${formatPassageCountdown(minutes)}`
    : p.state === 'finished' ? 'Fin de service' : p.state === 'closed' ? 'Pas de créneau' : p.state === 'calendar' ? 'Non confirmé' : '—'
  return <span className={`network-summary-passage station-board-passage${p.state === 'active' ? '' : p.state === 'upcoming' ? ' is-upcoming' : p.state === 'finished' ? ' is-finished' : ' is-undeclared'}`} role={minutes !== null ? 'timer' : undefined} aria-live="off">
    <strong>{p.state === 'active' && <PassageArcs />}{value}</strong>{at !== null && minutes !== null && <PassageClock atMs={at} now={now} />}{caption && <small>{caption}</small>}
  </span>
}

export function BusDirectionPanel({ d, sign, estimates, now, name, open, toggle, id }: {
  d: BusBoardDirection; sign: ReturnType<typeof compileSign>; estimates: boolean; now: number; name: string; open: boolean; toggle: () => void; id: string
}) {
  const scheduled = d.clock?.kind === 'timetable', model = estimates && d.clock?.kind === 'model'
  const origin = sign.at(1,now), hours = d.sourceHours
  const basis = scheduled ? 'Horaire du jour' : hours?.weekday ? 'Fiche hebdomadaire' : model ? 'Passages estimés' : hours?.samples ? 'Heures de référence · jour non confirmé' : d.reason ?? 'Heures non renseignées'
  const readingUrl = consultationPage(d)
  const heading = `${d.label} · ${d.from} → ${d.to}`
  return <div className="station-board-direction-detail">
    <button type="button" className={`station-board-row station-board-direction-row station-board-direction-toggle${open ? ' is-expanded' : ''}`}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>
      <span className="station-board-stop"><strong>{name}</strong><small>{heading}</small></span>
      <span className="station-board-direction-action"><Passage now={now} passage={origin.passage} model={origin.kind === 'model'} caption={origin.kind === 'model' ? 'Estimé' : scheduled || model || hours?.weekday ? d.pointKind === 'secteurs' ? 'Premier secteur' : 'Au départ' : undefined} />
        <span aria-hidden="true">{open ? '−' : '+'}</span></span>
    </button>
    {open && <div className="station-board-itinerary bus-occurrences" id={id} aria-label={`${name} · ${d.label}`}>
      {d.points.length ? <>
        <div className="bus-occurrences-head"><strong>{d.pointKind === 'départ seul' ? 'Départ seul' : `${d.points.length} ${d.pointKind}`}</strong>
          <small>{basis}</small></div>
        {hours && sign.reading && <BusGridExtent hours={hours} day={midnight(now)} ranks={d.points.length} />}
        {hours?.friday && <small>Grilles distinctes : lundi à jeudi, vendredi, samedi et dimanche. Les derniers passages peuvent tomber après minuit.</small>}
        {!scheduled && !readingUrl && <small className="station-board-itinerary-pending">Pas de fiche horaire externe vérifiée pour ce sens.</small>}
        <BusSurveyNote name={name} d={d} />
        <AftuReferenceNote name={name} d={d} />
        <ol className="station-board-itinerary-list bus-occurrences-list">{d.points.map((point, index) => {
          const terminal = d.points.length > 1 && index === d.points.length - 1
          const row = sign.at(index+1,now)
          const missing = row.kind === 'model' || row.passage.state === 'unknown' || row.passage.state === 'calendar'
          const printed = hours?.printedLabels?.[index+1]
          return <li className="station-board-row station-board-row-static" key={index}>
            <span className="station-board-stop"><small className="bus-rank">{index + 1}.</small> <strong>{printed ?? point}</strong>
              {printed && <small>Libellé local : {point} · non repris sur la fiche horaire</small>}
              {missing && readingUrl && <small>Heure non renseignée ici · <a href={readingUrl} target="_blank" rel="noreferrer"
                aria-label={`Consulter la fiche externe de ${name} vers ${d.to}, rang ${index+1} (nouvel onglet)`}>Voir la fiche du sens</a></small>}
            </span>
            <Passage now={now} passage={row.passage} model={row.kind === 'model'} caption={d.partialList && terminal ? 'Dernier arrêt documenté' : terminal ? d.pointKind === 'secteurs' ? (row.kind === 'model' ? 'Dernier secteur · estimé' : 'Dernier secteur') : row.kind === 'model' ? 'Arrivée au terminus · estimée' : 'Arrivée au terminus' : undefined} />
          </li>
        })}</ol>
      </> : <span className="station-board-itinerary-pending">{d.reason}. Pas de fiche horaire externe vérifiée pour ce sens.</span>}
      {d.indexSource && <a className="station-board-itinerary-source" href={d.indexSource} target="_blank" rel="noreferrer">Index de la ligne</a>}
      {hours?.source.startsWith('https://') && hours.source !== d.source && <a className="station-board-itinerary-source" href={hours.source} target="_blank" rel="noreferrer">{hours.weekday ? 'Tableau horaire du sens' : 'Source des heures de référence'}</a>}
      {/^https:\/\//.test(d.source) && <a className="station-board-itinerary-source" href={d.source} target="_blank" rel="noreferrer">Fiche du parcours</a>}
    </div>}
  </div>
}

type BoardProps = { network: 'ddd' | 'aftu_tata'; published?: ExplorerBusEdition }
export function EstimatedLineScheduleBoard(props: BoardProps) {
  const now = usePassageClock()
  return <BusLineScheduleBoard {...props} now={now} />
}

// An interchange mention or a passenger waiting for a bus is not a ranked
// boarding call. Keep source and scope attached even when codes coincide.
const mentionSources: Readonly<Record<string, { label: string; url: string }>> = tataStops.sources
function TataStopMentions({code}: {code: string}) {
  const axis = (tataStops.axes as Readonly<Record<string, { listed: string; note: string }>>)[code]
  return <>{tataStops.mentions.filter(m => m.lines.includes(code)).map(m =>
    <details key={m.stop} className="bus-survey-note"><summary>{m.title} : {m.stop}</summary>
      <p>{m.note ?? `La fiche de gare cite la ligne TATA ${code}. Le sens, le quai et les heures du bus ne sont pas précisés.`}</p>
      <p>{m.sources.map((id,i) => <Fragment key={id}>{i > 0 && ' · '}<a href={mentionSources[id].url} target="_blank" rel="noreferrer">{mentionSources[id].label}</a></Fragment>)}</p>
      {axis && <p>Autre description de la ligne : {axis.listed} (<a href={tataStops.axisSource.url} target="_blank" rel="noreferrer">{tataStops.axisSource.label}</a>). {axis.note}</p>}
    </details>)}</>
}

export function BusLineScheduleBoard({ network, published, now }: BoardProps & { now: number }) {
  const [source, setSource] = useState<'aftu' | 'tata'>('aftu')
  const [opened, setOpened] = useState('')
  const [filter, setFilter] = useState('')
  const [estimates, setEstimates] = useState(false)
  const family: BusFamily = network === 'ddd' ? 'ddd' : source, day = midnight(now), date = new Date(day).toISOString().slice(0,10)
  const otherDay = usePassengerNetwork(published?.day === date ? undefined : published?.snapshot, date, published?.rediscover)
  const net = published?.snapshot && published.day === date ? published.network : otherDay.network
  const groups = useMemo(() => {
    const dated = datedBusBoards(net.patterns, family, day)
    return [dated, BUS_BOARD_LINES[family]].map(lines => lines.map(line => ({ ...line, signs: line.directions.map(d => compileSign(d,day,estimates)) })))
  }, [net, day, family, estimates])
  const visible = useMemo(() => {
    const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    // A catalogue identifier can name the same published sheet. Search its
    // actual panel rather than counting the calls twice (or borrowing AIBD).
    const code = (s: string) => fold(s).replace(/[\s_-]+/g, '')
    const requested = fold(filter.trim()), id = code(requested).replace(new RegExp(`^${family}`),'')
    const sheetCode = groups[1].find(l => code(l.code) === id)?.aliasOf
    const q = sheetCode ? fold(sheetCode) : requested
    const exactCode = sheetCode || groups.flat().some(l => code(l.code) === id) || /^\d+[ab]?$/.test(id)
    return groups.map(lines => lines.filter(l => !l.aliasOf && (!q || (exactCode ? code(l.code) === (sheetCode ? code(sheetCode) : id)
      : fold(`${family} ${l.code}`).includes(q) || (family === 'ddd' && lines === groups[1] && DDD_TERMINUS_NOTICES.some(n => n.code === l.code && n.separateVariant && fold(n.separateVariant.name).includes(q))) || (family === 'tata' && lines === groups[1] && tataStops.mentions.some(m => m.lines.includes(l.code) && fold(m.stop).includes(q))) || l.directions.some(d => [d.from, d.to, ...d.points].some(p => fold(p).includes(q)))))))
  }, [groups, family, filter])
  const name = family.toUpperCase()
  return <section className="station-board bus-board" aria-label={`Affichage des lignes ${network === 'ddd' ? 'DDD' : 'AFTU / TATA'}`}>
    <header className="station-board-head"><strong>Lignes {name}</strong>
      {network !== 'ddd' && <div className="bus-board-switch" role="group" aria-label="Fiches du réseau de minibus">{(['aftu','tata'] as const).map(f =>
        <button type="button" key={f} aria-pressed={family === f} onClick={() => { setSource(f); setOpened('') }}>{f.toUpperCase()}</button>)}</div>}
    </header>
    <label className="bus-model-option"><input type="checkbox" checked={estimates} onChange={e=>setEstimates(e.target.checked)} /> Inclure les passages estimés</label>
    <BusCoverageNote family={family} />
    <input className="bus-board-filter" type="search" aria-label="Rechercher une ligne ou un arrêt" placeholder="Ligne ou arrêt" value={filter} onChange={e => setFilter(e.target.value)} />
    {visible.every(lines => !lines.length) && <p className="bus-board-section-title">Aucun résultat</p>}
    {visible.map((lines, groupIndex) => lines.length ? <Fragment key={groupIndex}>
      <div className="bus-board-section-title">{groupIndex === 0 ? 'Horaires du jour' : estimates ? 'Fiches et passages estimés' : 'Heures sur fiche'}</div>
      <ul className="station-board-list">{lines.map((line, l) => <li key={line.key} className="station-board-line-group" data-line-code={line.code} data-family={family}>
        {line.directions.map((d, i) => {
          const key = JSON.stringify([line.key, d.source, d.label, d.from, d.to])
          return <BusDirectionPanel key={key} d={d} sign={line.signs[i]} estimates={estimates} now={now} name={groupIndex === 0 ? line.code : `${name} ${line.code}`} open={opened === key}
            toggle={() => setOpened(opened === key ? '' : key)} id={`bus-${family}-${groupIndex}-${l}-${i}`} />
        })}
        {groupIndex === 1 && family === 'ddd' && <DddVariantNote code={line.code} />}
        {groupIndex === 1 && family === 'tata' && <TataStopMentions code={line.code} />}
      </li>)}</ul>
    </Fragment> : null)}
  </section>
}
