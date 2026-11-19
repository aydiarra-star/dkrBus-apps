/** Survey/review inventory, NOT an input to dakarNetwork. Each direction has
 * its own proof slot. A reverse review request never reverses a way. */
import { ALL_CORRIDOR_STOPS } from '../domain/corridors'
import { assessTransfer, type TransferEnd, type TransferProof } from '../routing/transferReview'
import { buildNetwork } from '../routing/network'
import type { Dataset, Network } from '../routing/model'

type SurveyEnd = TransferEnd & { documentaryName?: string }
interface Dossier {
  id: string
  ends: readonly [SurveyEnd, SurveyEnd]
  betweenSites: boolean
  observation: string
  sources: readonly string[]
}
const ter = (stopId: string): TransferEnd => ({ stopId, mode: 'ter' })
const brt = (stopId: string): TransferEnd => ({ stopId, mode: 'brt' })
const ddd = (stopId: string): TransferEnd => ({ stopId, mode: 'ddd' })
const aftu = (stopId: string): TransferEnd => ({ stopId, mode: 'aftu' })
const tata = (stopId: string): TransferEnd => ({ stopId, mode: 'tata' })
const east = 'docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md'
const b1 = 'data/bus-sections/acces-scat-urbam.md'
const legacy = 'docs/audit-connexions-graphe-multimodal-2026-11-18.md'
const petersen = 'docs/audit-pole-petersen-acces-correspondances-2026-11-16.md'
const poles = 'docs/audit-poles-correspondance-2026-11-16.md'
const colobane = 'docs/colobane-walking-transfer-audit-2026-11-16.md'
const pepp = 'https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf'
const busSite = 'https://www.openstreetmap.org/way/599927187' // area, not a bus bay
const railSite = 'https://www.openstreetmap.org/node/10245681535' // station, not a gate

export const dakarTransferDossiers: readonly Dossier[] = [
  { id: 'dakar-petersen', ends: [ter('ter-dakar'), brt('brt-petersen')], betweenSites: true,
    observation: 'Le quai B1 de descente est identifié. Le quai de montée vers Guédiawaye est distinct et hors du seuil du point de référence. Les 1 km historiques ne décrivent pas un chemin entre gares.', sources: [legacy, petersen, b1] },
  { id: 'colobane-place-nation', ends: [ter('ter-colobane'), brt('brt-place-nation')], betweenSites: true,
    observation: 'Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.', sources: [legacy, railSite] },
  { id: 'petersen-brt-ddd', ends: [brt('brt-petersen'), ddd('ddd-petersen')], betweenSites: false,
    observation: 'Les rôles B1 sont distincts. Relever séparément les points de montée et de descente DDD 13 ou 121 : leurs séquences nomment Petersen, pas le quai.', sources: [petersen, b1, pepp, 'https://demdikk.sn/reseau-urbain-dakar/'] },
  { id: 'petersen-brt-aftu', ends: [brt('brt-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.', sources: [petersen, b1, pepp, 'https://aftu-senegal.org/infos-pratiques/'] },
  { id: 'petersen-ddd-aftu', ends: [ddd('ddd-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.', sources: [legacy, petersen] },
  { id: 'guediawaye-brt-ddd', ends: [brt('brt-prefecture-guediawaye'), ddd('ddd-guediawaye')], betweenSites: false,
    observation: 'Pôle de rabattement documenté ; localiser les points actuels de montée/descente DDD 5 ou 12.', sources: [poles, pepp] },
  { id: 'colobane-ter-ddd', ends: [ter('ter-colobane'), ddd('ddd-colobane')], betweenSites: true,
    observation: 'Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.', sources: [colobane, railSite, busSite] },
  { id: 'colobane-ter-aftu', ends: [ter('ter-colobane'), aftu('aftu-colobane')], betweenSites: true,
    observation: 'Les fiches 30 et 33 confirment le terminus, pas les quais ni les accès. Ne pas confondre Colobane et Colobane Rufisque.', sources: [colobane, railSite, 'https://aftu-senegal.org/map/dakar-urbain-ligne-30/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-33/'] },
  { id: 'scat-brt-121', ends: [brt('brt-scat-urbam'), { ...ddd('sheet:ddd-121-scat'), documentaryName: 'Terminus Scat Urbam · DDD 121' }], betweenSites: true,
    observation: 'Les accès depuis les deux îlots atteignent le quai central B1. Ils ne mènent pas au terminus 121. Le texte DDD ne donne ni son quai par sens, ni ses départs depuis ce point.', sources: [b1, 'https://demdikk.sn/reseau-urbain-dakar/'] },
  { id: 'bargny-ter-74', ends: [ter('ter-bargny'), { ...aftu('sheet:aftu-74-bargny'), documentaryName: 'Bargny gare ferroviaire · AFTU 74' }], betweenSites: true,
    observation: 'Deux quais TER (1016285873/874) dans la station. Affectation au train à confirmer. La fiche 74 cite Bargny gare ; le quai routier et les accès manquent. Ne pas utiliser les horaires Rufisque–Tivaouane Peul.', sources: [east, 'https://api.openstreetmap.org/api/0.6/relation/13607602/2.json', 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/'] },
  { id: 'pnr-ddd-rufisque', ends: [ter('ter-pnr'), ddd('ddd-rufisque')], betweenSites: true,
    observation: 'PNR possède deux quais TER (1016285877/878). L’emprise de gare routière 178908478 n’est ni la gare TER Rufisque ni le point de montée DDD 213. Vérifier d’abord quelle gare désigne le bus.', sources: [east, 'https://api.openstreetmap.org/api/0.6/relation/13607604/1.json', 'https://www.openstreetmap.org/way/178908478'] },
  { id: 'rufisque-ter-83', ends: [ter('ter-rufisque'), aftu('aftu-rufisque')], betweenSites: true,
    observation: 'La fiche de la 83 cite le secteur de Sonadis, pas le quai de la gare TER. Identifier les occurrences et les côtés de chaussée. Ne pas rattacher cet arrêt à PNR.', sources: [east, 'src/data/aftu-83-directions.json'] },
  { id: 'keur-massar-ddd-tata', ends: [ddd('ddd-keur-massar'), tata('tata-keur-massar')], betweenSites: true,
    observation: 'Distinguer le terminus TATA 52, la gare routière et la mention « Terminus Keur Massar » de la 74. Une commune ou le libellé « Station » ne désigne pas le quai où changer.', sources: [east, 'https://www.openstreetmap.org/node/5286379847', 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/'] },
  { id: 'colobane-ter-tata', ends: [ter('ter-colobane'), tata('tata-colobane')], betweenSites: true,
    observation: 'La fiche TATA 33 et la fiche AFTU 33 ont des provenances distinctes. Aucune ne donne une marche entre quais, ni deux services à enchaîner.', sources: [colobane, busSite, 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/33/colobane/serigne-assane/'] },
]

function reference(end: SurveyEnd) {
  const ref = ALL_CORRIDOR_STOPS.find(s => s.id === end.stopId)
  if (!ref && end.documentaryName) return { mode: end.mode, stopId: end.stopId, name: end.documentaryName, referenceCall: null }
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
  // Show the actual directional observation when the compiled B1 review
  // supplies it. Nothing is inferred from the other end of the dossier.
  function b1Ends(end: TransferEnd, role: 'alight' | 'board') {
    if (end.mode !== 'brt') return []
    return net.patterns.flatMap(p => {
      if (p.lineId !== 'brt-b1' || p.mode !== 'brt') return []
      const bound = net.platforms.get(p)?.[role].get(p.stops.indexOf(end.stopId))
      return bound ? [{ stopId: end.stopId, mode: end.mode, platformId: bound.place.id, lineId: p.lineId, direction: p.direction, evidence: bound.evidence }] : []
    })
  }
  return directions.map(d => {
    const from = b1Ends(d.from, 'alight'), to = b1Ends(d.to, 'board')
    const serviceReviews = (from.length ? from : [undefined]).flatMap(alight => (to.length ? to : [undefined]).map(board => {
      const observed = { alight, board }
      return { observed, ...assessTransfer(net, d, observed) }
    }))
    // Keep one row per ordered site pair. Even at the same central platform,
    // keep the evidence and missing pieces for each service direction.
    const [first, ...otherServiceDirections] = serviceReviews
    return { ...d, ...first, otherServiceDirections }
  })
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
