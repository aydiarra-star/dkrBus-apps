/** Survey/review inventory, NOT an input to dakarNetwork. Each direction has
 * its own proof slot. A reverse review request never reverses a way. */
import { ALL_CORRIDOR_STOPS } from '../domain/corridors'
import { assessTransfer, type TransferEnd, type TransferProof } from '../routing/transferReview'
import { buildNetwork } from '../routing/network'
import type { Dataset, Network } from '../routing/model'

interface Dossier {
  id: string
  ends: readonly [TransferEnd, TransferEnd]
  betweenSites: boolean
  observation: string
  sources: readonly string[]
}
const ter = (stopId: string): TransferEnd => ({ stopId, mode: 'ter' })
const brt = (stopId: string): TransferEnd => ({ stopId, mode: 'brt' })
const ddd = (stopId: string): TransferEnd => ({ stopId, mode: 'ddd' })
const aftu = (stopId: string): TransferEnd => ({ stopId, mode: 'aftu' })
const legacy = 'docs/audit-connexions-graphe-multimodal-2026-11-18.md'
const petersen = 'docs/audit-pole-petersen-acces-correspondances-2026-11-16.md'
const poles = 'docs/audit-poles-correspondance-2026-11-16.md'
const colobane = 'docs/colobane-walking-transfer-audit-2026-11-16.md'
const pepp = 'https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf'
const busSite = 'https://www.openstreetmap.org/way/599927187' // area, not a bus bay
const railSite = 'https://www.openstreetmap.org/node/10245681535' // station, not a gate

export const dakarTransferDossiers: readonly Dossier[] = [
  { id: 'dakar-petersen', ends: [ter('ter-dakar'), brt('brt-petersen')], betweenSites: true,
    observation: 'La valeur historique de 1 km ne décrit ni les accès ni le chemin entre gares.', sources: [legacy, petersen] },
  { id: 'colobane-place-nation', ends: [ter('ter-colobane'), brt('brt-place-nation')], betweenSites: true,
    observation: 'Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.', sources: [legacy, railSite] },
  { id: 'petersen-brt-ddd', ends: [brt('brt-petersen'), ddd('ddd-petersen')], betweenSites: false,
    observation: 'Relever séparément les points de montée et de descente DDD 13 ou 18 : leurs séquences nomment Petersen, pas le quai.', sources: [petersen, pepp, 'https://demdikk.sn/reseau-urbain-dakar/'] },
  { id: 'petersen-brt-aftu', ends: [brt('brt-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.', sources: [petersen, pepp, 'https://aftu-senegal.org/infos-pratiques/'] },
  { id: 'petersen-ddd-aftu', ends: [ddd('ddd-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.', sources: [legacy, petersen] },
  { id: 'guediawaye-brt-ddd', ends: [brt('brt-prefecture-guediawaye'), ddd('ddd-guediawaye')], betweenSites: false,
    observation: 'Pôle de rabattement documenté ; localiser les points actuels de montée/descente DDD 5 ou 12.', sources: [poles, pepp] },
  { id: 'colobane-ter-ddd', ends: [ter('ter-colobane'), ddd('ddd-colobane')], betweenSites: true,
    observation: 'Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.', sources: [colobane, railSite, busSite] },
  { id: 'colobane-ter-aftu', ends: [ter('ter-colobane'), aftu('aftu-colobane')], betweenSites: true,
    observation: 'Les fiches 30 et 33 confirment le terminus, pas les quais ni les accès. Ne pas confondre Colobane et Colobane Rufisque.', sources: [colobane, railSite, 'https://aftu-senegal.org/map/dakar-urbain-ligne-30/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-33/'] },
]

function reference(end: TransferEnd) {
  const ref = ALL_CORRIDOR_STOPS.find(s => s.id === end.stopId)
  if (!ref) throw Error(`Repère de catalogue absent : ${end.stopId}`)
  return { ...end, name: ref.name,
    // Only report coordinates for the reference rail/BRT calls. Other catalog
    // entries include copied centroids; do not redistribute them as observations.
    referenceCall: end.mode === 'brt' || end.mode === 'ter' ? {
      lat: ref.lat, lon: ref.lon, osmNode: ref.osmNodeId ? `https://www.openstreetmap.org/node/${ref.osmNodeId}` : null,
    } : null }
}
function direction(s: Dossier, reverse: boolean) {
  return { dossier: s.id, from: reference(s.ends[reverse ? 1 : 0]), to: reference(s.ends[reverse ? 0 : 1]),
    betweenSites: s.betweenSites, observation: s.observation, sources: s.sources }
}
const directions = dakarTransferDossiers.flatMap(s => [direction(s, false), direction(s, true)])
export function dakarTransferReport(net: Network) {
  return directions.map(d => ({ ...d, ...assessTransfer(net, d) }))
}

/** An offline review packet describes its OWN staging subgraph. The CLI can
 * neither import data into the passenger application nor change the catalogue.
 * Select an exact ordered pair, not an approximate stop name. */
export interface ReviewPacket {
  dossier: string; fromStopId: string; toStopId: string
  dataset: Dataset; proof: TransferProof
}
export function reviewDakarPacket(packet: ReviewPacket) {
  const d = directions.find(d => d.dossier === packet.dossier && d.from.stopId === packet.fromStopId && d.to.stopId === packet.toStopId)
  if (!d) throw Error('Le dossier et le couple ordonné fromStopId/toStopId doivent correspondre à un sens de l’inventaire.')
  if (!packet.proof || typeof packet.proof !== 'object' || Array.isArray(packet.proof) ||
      !packet.dataset || ![packet.dataset.places, packet.dataset.patterns, packet.dataset.footways].every(Array.isArray)) {
    throw Error('Le paquet doit fournir proof et un dataset de revue (places, patterns, footways).')
  }
  const net = buildNetwork(packet.dataset)
  return { ...d, ...assessTransfer(net, d, packet.proof), rejected: net.rejected }
}
