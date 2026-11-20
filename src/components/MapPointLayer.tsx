import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import { Marker, Tooltip, useMapEvents } from 'react-leaflet'
import { POINT_HEIGHT, POINT_WIDTH, packMapPoints, type PointGroup } from './mapPointLayout'
import type { MobilityId } from '../domain/mobilityColors'

export type PointBadge = 'TER' | 'BRT' | 'DDD' | 'TATA' | 'AFTU' | 'AFTU/TATA' | 'BUS'
export const badgeFor = (network: MobilityId | null, id = ''): PointBadge => {
  if (network === 'aftu_tata' && /^aftu\s*\/\s*tata/i.test(id)) return 'AFTU/TATA'
  if (network === 'aftu_tata') return /^tata\b/i.test(id) ? 'TATA' : /^aftu\b/i.test(id) ? 'AFTU' : 'AFTU/TATA'
  return network === 'ter' ? 'TER' : network === 'brt' ? 'BRT' : network === 'ddd' ? 'DDD' : 'BUS'
}
export interface MapPoint {
  key: string
  name: string
  title: string
  position: [number, number]
  badges: PointBadge[]
  kind: string
  /** A visual symbol, not a new service/transfer attribution. */
  symbol?: 'landmark' | 'change' | 'origin' | 'destination' | 'gps'
  detail?: ReactNode
  action?: { label: string; run: () => void }
}
const symbolLabels = { landmark: '◇', change: '⇄', origin: 'Départ', destination: 'Arrivée', gps: 'GPS' }
const badgeClass = (badge: PointBadge) => `point-${badge.replace('/', '-').toLowerCase()}`

function summarize({ point, members }: PointGroup<MapPoint>) {
  const badges = [...new Set(members.flatMap(p => p.badges))]
  const title = members.length === 1 ? point.title : [`${members.length} points sur la carte`, badges.join(' / '), `autour de ${point.name}`].filter(Boolean).join(' · ')
  const icon = document.createElement('span')
  icon.className = 'map-point-face'; icon.setAttribute('aria-hidden', 'true')
  const stripe = icon.appendChild(document.createElement('span')); stripe.className = 'map-point-stripe'
  for (const b of badges) stripe.appendChild(document.createElement('i')).className = badgeClass(b)
  const label = icon.appendChild(document.createElement('b'))
  label.textContent = point.symbol === 'landmark' && members.length === 1 ? `◇ ${point.badges.join('/')}` : point.symbol ? symbolLabels[point.symbol] : point.badges[0]
  if (members.length > 1) {
    const others = point.symbol ? badges : badges.filter(b => b !== point.badges[0])
    if (others.length) {
      const networks = icon.appendChild(document.createElement('small'))
      networks.textContent = others.slice(0, 2).join(' · ') + (others.length > 2 ? '…' : '')
    }
    const count = icon.appendChild(document.createElement('span')); count.className = 'map-point-count'; count.textContent = `+${members.length - 1}`
  }
  return { title, icon: L.divIcon({ className: 'map-point-marker', html: icon, iconSize: [POINT_WIDTH, POINT_HEIGHT], iconAnchor: [POINT_WIDTH / 2, POINT_HEIGHT / 2] }) }
}

const PointMarker = memo(function PointMarker({ group, activate }: {
  group: PointGroup<MapPoint>; activate: (group: PointGroup<MapPoint>, trigger: HTMLElement) => void
}) {
  const { title, icon } = useMemo(() => summarize(group), [group])
  return <Marker key={title} position={group.point.position} title={title} icon={icon} keyboard eventHandlers={{
    click: e => activate(group, e.target.getElement()),
    // A rapid second tap on a list marker is not a double-tap on the basemap.
    dblclick: e => L.DomEvent.stopPropagation(e),
    keydown: e => {
      if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
        L.DomEvent.stop(e.originalEvent); activate(group, e.target.getElement())
      }
    },
  }}><Tooltip direction="top" offset={[0,-12]}>{title}</Tooltip></Marker>
})

function PointList({ group, close, zoomIn, locate }: { group: PointGroup<MapPoint>; close: () => void; zoomIn?: () => void; locate: (point: MapPoint) => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeButton.current?.focus({ preventScroll: true }) }, [])
  const [search, setSearch] = useState('')
  const normal = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
  const members = group.members.filter(p => normal(`${p.name} ${p.badges.join(' ')} ${p.kind}`).includes(normal(search)))
  return <section className="map-point-panel" role="dialog" aria-label="Points sur la carte" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
  }}>
    <header><strong>{group.members.length > 1 ? `${group.members.length} points à ce zoom` : group.point.name}</strong>
      <button type="button" aria-label="Fermer les points" ref={closeButton} onClick={close}>×</button></header>
    {group.members.length > 1 && <p>Points proches sur la carte, pas nécessairement en correspondance. {zoomIn && <button type="button" onClick={zoomIn}>Zoomer ici</button>}</p>}
    {group.members.length > 8 && <input type="search" aria-label="Filtrer les points" placeholder="Nom ou réseau…" value={search} onChange={e => setSearch(e.target.value)} />}
    <ul aria-label="Points représentés">{members.map(p => <li key={p.key} data-point-key={p.key}>
      <strong>{p.badges.map(b => <span key={b} className={`map-point-badge ${badgeClass(b)}`}>{b}</span>)}{p.name}</strong>
      <small>{p.kind}</small>{p.detail}
      {p.action ? <button type="button" aria-label={`${p.action.label} : ${p.title}`} onClick={() => { close(); p.action?.run() }}>{p.action.label}</button>
        : <button type="button" aria-label={`Situer : ${p.title}`} onClick={() => { close(); locate(p) }}>Situer ce point</button>}
    </li>)}</ul>
    {!members.length && <p role="status">Aucun point pour ce filtre.</p>}
  </section>
}

/** Shared across reference, historical, published and journey points. The sheet
 * lives outside Leaflet's event container: scrolling or selecting a row must
 * never pan the map or pick the pixel underneath it as the journey origin. */
export function MapPointLayer({ points, picking }: { points: MapPoint[]; picking: boolean }) {
  const [revision, refresh] = useReducer((n: number) => n + 1, 0)
  const [open, setOpen] = useState<string | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const map = useMapEvents({
    movestart: e => e.target.getContainer().setAttribute('aria-busy', 'true'),
    moveend: refresh, resize: refresh, zoomstart: () => setOpen(null), dragstart: () => setOpen(null), click: () => setOpen(null),
  })
  // Announce a settled layout only after React has committed the new hit targets.
  useLayoutEffect(() => { map.getContainer().setAttribute('aria-busy', 'false') }, [map, revision])
  const groups = useMemo(() => packMapPoints(points.map(point => ({ point, ...map.latLngToContainerPoint(point.position) })), map.getSize()), [map, points, revision])
  const active = groups.find(group => group.point.key === open)
  useEffect(() => { if (open !== null && !active) setOpen(null) }, [open, active])
  function close() {
    setOpen(null); (trigger.current?.isConnected ? trigger.current : map.getContainer()).focus({ preventScroll: true })
  }
  const activate = useCallback((group: PointGroup<MapPoint>, el: HTMLElement) => {
    if (picking && group.members.length === 1 && group.point.action) { setOpen(null); group.point.action.run(); return }
    trigger.current = el; setOpen(group.point.key)
  }, [picking])
  return <>{groups.map(group => <PointMarker key={JSON.stringify(group.members.map(p => p.key))} group={group} activate={activate} />)}
    {active && map.getContainer().parentElement && createPortal(<PointList key={active.point.key} group={active} close={close}
      locate={p => map.setView(p.position, Math.max(16, map.getZoom()), { animate: false })}
      zoomIn={map.getZoom() < map.getMaxZoom() ? () => { close(); map.setView(active.point.position, Math.min(map.getMaxZoom(), map.getZoom() + 2), { animate: false }) } : undefined} />,
    map.getContainer().parentElement!)}
  </>
}
