import { Fragment, useMemo, useState } from 'react'
import { BusSurveyNote } from './BusSurveyNote'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import { boardDay, busPassage, datedBusBoards, type BusBoardDirection, type BusFamily, type BusPassage } from '../domain/busPassageBoard'
import { midnight } from '../domain/stopPassageCountdown'
import type { Network } from '../routing/model'
import { PassageClock, usePassageClock } from './PassageClock'
import { PassageArcs } from './PassageArcs'
import { usePassengerNetwork } from './usePassengerNetwork'

/** Reuse the journey edition only when it is for the day on the sign. */
export interface ExplorerBusEdition { day: string; snapshot?: string; network: Network; rediscover: () => void }

function Passage({ passage, now, caption }: { passage: BusPassage; now: number; caption?: string }) {
  const p = passage
  const value = p.state === 'active' ? `${p.minutes} min` : p.state === 'upcoming' ? `Dès ${new Date(p.at).toISOString().slice(11,16)}`
    : p.state === 'finished' ? 'Fin de service' : p.state === 'closed' ? 'Pas de créneau' : p.state === 'calendar' ? 'Non confirmé' : '—'
  return <span className={`network-summary-passage station-board-passage${p.state === 'active' ? '' : p.state === 'upcoming' ? ' is-upcoming' : p.state === 'finished' ? ' is-finished' : ' is-undeclared'}`} role="timer" aria-live="off">
    <strong>{p.state === 'active' && <PassageArcs />}{value}</strong>{p.state === 'active' && <PassageClock atMs={p.at} now={now} />}{caption && <small>{caption}</small>}
  </span>
}

function Direction({ d, day, now, name, open, toggle, id }: {
  d: BusBoardDirection; day: ReturnType<typeof boardDay>; now: number; name: string; open: boolean; toggle: () => void; id: string
}) {
  const scheduled = d.clock?.kind === 'timetable', origin = busPassage(day, 0, now)
  const heading = `${d.label} · ${d.from} → ${d.to}`
  return <div className="station-board-direction-detail">
    <button type="button" className={`station-board-row station-board-direction-row station-board-direction-toggle${open ? ' is-expanded' : ''}`}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>
      <span className="station-board-stop"><strong>{name}</strong><small>{heading}</small></span>
      <span className="station-board-direction-action"><Passage now={now} passage={origin} caption={d.clock ? d.pointKind === 'secteurs' ? 'Premier secteur' : 'Au départ' : undefined} />
        <span aria-hidden="true">{open ? '−' : '+'}</span></span>
    </button>
    {open && <div className="station-board-itinerary bus-occurrences" id={id} aria-label={`${name} · ${d.label}`}>
      {d.points.length ? <>
        <div className="bus-occurrences-head"><strong>{d.pointKind === 'départ seul' ? 'Départ seul' : `${d.points.length} ${d.pointKind}`}</strong>
          <small>{d.clock ? scheduled ? 'Horaire du jour' : 'Passages estimés' : d.reason}</small></div>
        <BusSurveyNote name={name} d={d} />
        <ol className="station-board-itinerary-list bus-occurrences-list">{d.points.map((point, index) => {
          const terminal = d.points.length > 1 && index === d.points.length - 1
          return <li className="station-board-row station-board-row-static" key={index}>
            <span className="station-board-stop"><small className="bus-rank">{index + 1}.</small> <strong>{point}</strong></span>
            <Passage now={now} passage={busPassage(day, index, now)} caption={terminal ? d.pointKind === 'secteurs' ? 'Dernier secteur' : 'Arrivée au terminus' : undefined} />
          </li>
        })}</ol>
      </> : <span className="station-board-itinerary-pending">{d.reason}</span>}
      {/^https:\/\//.test(d.source) && <a className="station-board-itinerary-source" href={d.source} target="_blank" rel="noreferrer">Fiche du parcours</a>}
    </div>}
  </div>
}

type BoardProps = { network: 'ddd' | 'aftu_tata'; published?: ExplorerBusEdition }
export function EstimatedLineScheduleBoard(props: BoardProps) {
  const now = usePassageClock()
  return <BusLineScheduleBoard {...props} now={now} />
}

export function BusLineScheduleBoard({ network, published, now }: BoardProps & { now: number }) {
  const [source, setSource] = useState<'aftu' | 'tata'>('aftu')
  const [opened, setOpened] = useState('')
  const [filter, setFilter] = useState('')
  const family: BusFamily = network === 'ddd' ? 'ddd' : source, day = midnight(now), date = new Date(day).toISOString().slice(0,10)
  const otherDay = usePassengerNetwork(published?.day === date ? undefined : published?.snapshot, date, published?.rediscover)
  const net = published?.snapshot && published.day === date ? published.network : otherDay.network
  const groups = useMemo(() => {
    const dated = datedBusBoards(net.patterns, family, day)
    return [dated, BUS_BOARD_LINES[family]].map(lines => lines.map(line => ({ ...line, days: line.directions.map(d => boardDay(d, day)) })))
  }, [net, day, family])
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
      : fold(`${family} ${l.code}`).includes(q) || l.directions.some(d => [d.from, d.to, ...d.points].some(p => fold(p).includes(q)))))))
  }, [groups, family, filter])
  const name = family.toUpperCase()
  return <section className="station-board bus-board" aria-label={`Affichage des lignes ${network === 'ddd' ? 'DDD' : 'AFTU / TATA'}`}>
    <header className="station-board-head"><strong>Lignes {name}</strong>
      {network !== 'ddd' && <div className="bus-board-switch" role="group" aria-label="Fiches du réseau de minibus">{(['aftu','tata'] as const).map(f =>
        <button type="button" key={f} aria-pressed={family === f} onClick={() => { setSource(f); setOpened('') }}>{f.toUpperCase()}</button>)}</div>}
    </header>
    <input className="bus-board-filter" type="search" aria-label="Rechercher une ligne ou un arrêt" placeholder="Ligne ou arrêt" value={filter} onChange={e => setFilter(e.target.value)} />
    {visible.every(lines => !lines.length) && <p className="bus-board-section-title">Aucun résultat</p>}
    {visible.map((lines, groupIndex) => lines.length ? <Fragment key={groupIndex}>
      <div className="bus-board-section-title">{groupIndex === 0 ? 'Horaires du jour' : 'Passages estimés'}</div>
      <ul className="station-board-list">{lines.map((line, l) => <li key={line.key} className="station-board-line-group" data-line-code={line.code} data-family={family}>
        {line.directions.map((d, i) => {
          const key = JSON.stringify([line.key, d.source, d.label, d.from, d.to])
          return <Direction key={key} d={d} day={line.days[i]} now={now} name={groupIndex === 0 ? line.code : `${name} ${line.code}`} open={opened === key}
            toggle={() => setOpened(opened === key ? '' : key)} id={`bus-${family}-${groupIndex}-${l}-${i}`} />
        })}
      </li>)}</ul>
    </Fragment> : null)}
  </section>
}
