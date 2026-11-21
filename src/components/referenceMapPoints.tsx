import { getCorridorStop, networkOfStopId, TRANSFER_INDEX, type CorridorLine, type CorridorStop } from '../domain/corridors'
import type { DddArcgisMapStop } from '../domain/dddArcgisMapGeometry'
import { GREATER_DAKAR_BUS_COVERAGE_POINTS } from '../data/greaterDakarBusCoverage'
import { formatFrequencyPeriod, formatSourceVerification } from '../domain/frequencies'
import { safeHttpUrl } from '../domain/http'
import type { NetworkId } from '../domain/network'
import type { PublishedStop } from '../domain/published'
import { busMapPoints } from '../routing/busGeography'
import type { DakarEndpoint } from '../routing/placeConnections'
import { badgeFor, type PointBadge, type MapPoint } from './MapPointLayer'

export type MapLayers = Readonly<Partial<Record<NetworkId, boolean>>>
interface Sources {
  corridors: readonly CorridorStop[]; lines: readonly CorridorLine[]
  published: readonly (PublishedStop & { lat: number; lon: number })[]
  historical: readonly DddArcgisMapStop[]; layers: MapLayers
  picking: boolean; choose: (point: DakarEndpoint) => void
  selectReference?: (stop: CorridorStop) => void; selectPublished?: (stop: PublishedStop) => void
}
function ReferenceDetails({ stop, line }: { stop: CorridorStop; line?: CorridorLine }) {
  const source = line && safeHttpUrl(line.frequencySource.sourceUrl)
  return <>
    {stop.note && (stop.id.startsWith('brt-') || stop.id.startsWith('ter-')) && <small>{stop.note}</small>}
    {TRANSFER_INDEX.get(stop.id)?.map(link => {
      const peer = getCorridorStop(link.fromStopId === stop.id ? link.toStopId : link.fromStopId)
      if (!peer) return null
      const kind = link.evidence?.kind
      return <small className="map-point-link" key={peer.id} data-peer={peer.id}>
        {kind === 'shared_hub' ? 'Pôle commun déclaré' : kind === 'reference_estimate' ? 'Marche de référence, chemin non vérifié' : 'Liaison piétonne documentée'} : {badgeFor(networkOfStopId(peer.id), peer.id)} · {peer.name}. Pas de changement garanti sur horaires.
      </small>
    })}
    {line && <details><summary>Fréquence de référence</summary>
      {line.officialFrequencies.map((f, i) => <small key={i}>{formatFrequencyPeriod(f)}</small>)}
      <small>{line.frequencyStatus === 'OFFICIAL_REFERENCE' ? 'Fréquence officielle de référence' : 'Fréquence inconnue'} · {formatSourceVerification(line.frequencySource)}. Pas un prochain passage.</small>
      {source && <a href={source} target="_blank" rel="noreferrer">Source : {line.frequencySource.authority}</a>}
    </details>}
  </>
}
export function referenceMapPoints({ corridors, lines, published, historical, layers, picking, choose, selectReference, selectPublished }: Sources): MapPoint[] {
  const points: MapPoint[] = []
  const select = (point: DakarEndpoint) => picking ? { label: 'Choisir ce point', run: () => choose(point) } : undefined
  for (const s of corridors) {
    const line = lines.find(l => l.stopIds.includes(s.id)), network = networkOfStopId(s.id) ?? line?.network ?? null
    if (layers[network ?? 'other'] === false) continue
    const badge = badgeFor(network, s.id)
    points.push({ key: `ref:${s.id}`, title: `${badge} — ${s.name}`, name: s.name, badges: [badge], position: [s.lat, s.lon],
      kind: network === 'ter' ? 'Gare de référence' : network === 'brt' ? 'Station de référence' : 'Arrêt de référence',
      detail: <ReferenceDetails stop={s} line={line} />,
      action: select({ label: s.name, stopId: s.id, lat: s.lat, lng: s.lon }) ?? (selectReference && { label: 'Centrer sur cet arrêt', run: () => selectReference(s) }) })
  }
  for (const s of published) {
    const network = networkOfStopId(s.stopId)
    if (layers[network ?? 'other'] === false) continue
    points.push({ key: `published:${s.snapshotId ?? ''}:${s.stopId}`, title: s.stopName, name: s.stopName, badges: [badgeFor(network, s.stopId)],
      position: [s.lat, s.lon], kind: 'Arrêt du jeu publié',
      action: select({ kind: 'stop', label: s.stopName, stopId: s.stopId, snapshotId: s.snapshotId, lat: s.lat, lng: s.lon }) ??
        (selectPublished && { label: 'Ouvrir la fiche publiée', run: () => selectPublished(s) }) })
  }
  for (const p of GREATER_DAKAR_BUS_COVERAGE_POINTS) {
    const routes = p.routes.filter(r => layers[r.network] !== false)
    if (!routes.length) continue
    const badges = [...new Set(routes.map((r): PointBadge => r.network === 'ddd' ? 'DDD' : 'AFTU'))]
    points.push({ key: `landmark:${p.id}`, title: p.name, name: p.name, position: [p.lat, p.lon], badges,
      kind: `Zone desservie · ${routes.map(r => `${r.network === 'ddd' ? 'DDD' : 'AFTU'} ${r.line}`).join(', ')}`, symbol: 'landmark',
      action: select({ kind: 'map', landmarkId: `landmark:${p.id}`, label: p.name, lat: p.lat, lng: p.lon }) })
  }
  // Same map-only selections as the journey form. No platform binding, edge or timetable is inferred here.
  for (const { marker: p, lines: sourceLines, roadLimit } of busMapPoints) {
    const visible = [...sourceLines].filter(l => layers[l.startsWith('DDD ') ? 'ddd' : 'aftu_tata'] !== false)
    if (!visible.length) continue
    points.push({ key: p.id, title: p.name, name: p.name, position: [p.lat, p.lon], symbol: 'landmark',
      badges: [...new Set(visible.map(l => badgeFor(l.startsWith('DDD ') ? 'ddd' : 'aftu_tata', l)))],
      kind: `${roadLimit ? 'Limite de voirie, pas un quai' : 'Quai cartographié'} · ${visible.join(' / ')} · sans horaire`,
      action: select({ kind: 'map', landmarkId: p.id, label: p.name, lat: p.lat, lng: p.lon }) })
  }
  if (layers.ddd !== false) for (const s of historical) {
    const name = s.name || `Repère DDD · ligne ${s.line}`
    points.push({ key: s.id, title: `DDD — ${name} · ligne ${s.line}`, name, position: s.position, badges: ['DDD'],
      kind: `Repère ArcGIS historique · DDD ${s.line} · service actuel non certifié`, symbol: 'landmark' })
  }
  return points
}
