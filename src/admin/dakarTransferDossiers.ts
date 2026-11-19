/** Survey/review inventory, NOT an input to dakarNetwork. Each direction has
 * its own proof slot. A reverse review request never reverses a way. */
import { transferWitness } from './transferWitness'
import { ALL_CORRIDOR_STOPS } from '../domain/corridors'
import { assessTransfer, type TransferEnd, type TransferProof } from '../routing/transferReview'
import { buildNetwork } from '../routing/network'
import type { Dataset, Network } from '../routing/model'

type SurveyEnd = TransferEnd & { documentaryName?: string }
interface Dossier {
  id: string
  ends: readonly [SurveyEnd, SurveyEnd]
  /** Which documentary line dossiers nominate this site, NOT a platform assignment. */
  busSources?: readonly string[]
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

const feederPage = 'https://demdikk.sn/info-voyageurs/'
const urbanPage = 'https://demdikk.sn/reseau-urbain-dakar/'
const stationReview = 'docs/revue-bus-2026-11-19.md'
// Each reference is a survey target at the named station, not a new Place.
// 501, generic 502/503 circuits, and the lettered services remain separate.
const feeders: readonly [string, string, string, string][] = [
  ['501','dakar','Palais 2','Gare de Dakar, Port et Leclerc figurent dans des sources différentes. Ne pas déplacer le terminus au quai du TER.'],
  ['502A','colobane','UCAD','La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.'],
  ['502B','colobane','Abass Ndao','La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.'],
  ['503A','colobane','Môle 8','La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.'],
  ['503B','colobane','Hydrocarbure','La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.'],
  ['504A','diamniadio','Sphère ministérielle','Terminus publiés, mais ni l’ordre intermédiaire ni le quai du bus par sens ne sont établis.'],
  ['504B','diamniadio','Sébikotane','Ni le quai de la 504B ni le parcours jusqu’à la voie du train ne se déduisent de l’intitulé de gare.'],
]
export const dakarTransferDossiers: readonly Dossier[] = [
  { id: 'dakar-petersen', ends: [ter('ter-dakar'), brt('brt-petersen')], betweenSites: true,
    observation: 'Le quai B1 de descente est identifié. Le quai de montée vers Guédiawaye est distinct et hors du seuil du point de référence. Les 1 km historiques ne décrivent pas un chemin entre gares.', sources: [legacy, petersen, b1] },
  { id: 'colobane-place-nation', ends: [ter('ter-colobane'), brt('brt-place-nation')], betweenSites: true,
    observation: 'Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.', sources: [legacy, railSite] },
  { id: 'petersen-brt-ddd', busSources: ['ddd:13', 'ddd:121'], ends: [brt('brt-petersen'), ddd('ddd-petersen')], betweenSites: false,
    observation: 'Les rôles B1 sont distincts. Relever séparément les points de montée et de descente DDD 13 ou 121 : leurs séquences nomment Petersen, pas le quai.', sources: [petersen, b1, pepp, 'https://demdikk.sn/reseau-urbain-dakar/'] },
  { id: 'petersen-brt-aftu', busSources: ['aftu:4', 'aftu:25', 'aftu:29'], ends: [brt('brt-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.', sources: [petersen, b1, pepp, 'https://aftu-senegal.org/infos-pratiques/'] },
  { id: 'petersen-ddd-aftu', ends: [ddd('ddd-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.', sources: [legacy, petersen] },
  { id: 'guediawaye-brt-ddd', busSources: ['ddd:5', 'ddd:12'], ends: [brt('brt-prefecture-guediawaye'), ddd('ddd-guediawaye')], betweenSites: false,
    observation: 'Pôle de rabattement documenté ; localiser les points actuels de montée/descente DDD 5 ou 12.', sources: [poles, pepp] },
  { id: 'colobane-ter-ddd', ends: [ter('ter-colobane'), ddd('ddd-colobane')], betweenSites: true,
    observation: 'Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.', sources: [colobane, railSite, busSite] },
  { id: 'colobane-ter-aftu', busSources: ['aftu:30', 'aftu:33'], ends: [ter('ter-colobane'), aftu('aftu-colobane')], betweenSites: true,
    observation: 'Les fiches 30 et 33 confirment le terminus, pas les quais ni les accès. Ne pas confondre Colobane et Colobane Rufisque.', sources: [colobane, railSite, 'https://aftu-senegal.org/map/dakar-urbain-ligne-30/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-33/'] },
  { id: 'scat-brt-121', busSources: ['ddd:121'], ends: [brt('brt-scat-urbam'), { ...ddd('sheet:ddd-121-scat'), documentaryName: 'Terminus Scat Urbam · DDD 121' }], betweenSites: true,
    observation: 'Les accès depuis les deux îlots atteignent le quai central B1. Ils ne mènent pas au terminus 121. Le texte DDD ne donne ni son quai par sens, ni ses départs depuis ce point.', sources: [b1, 'https://demdikk.sn/reseau-urbain-dakar/'] },
  { id: 'bargny-ter-74', busSources: ['aftu:74'], ends: [ter('ter-bargny'), { ...aftu('sheet:aftu-74-bargny'), documentaryName: 'Bargny gare ferroviaire · AFTU 74' }], betweenSites: true,
    observation: 'Deux quais TER (1016285873/874) dans la station. Affectation au train à confirmer. La fiche 74 cite Bargny gare ; le quai routier et les accès manquent. Ne pas utiliser les horaires Rufisque–Tivaouane Peul.', sources: [east, 'https://api.openstreetmap.org/api/0.6/relation/13607602/2.json', 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/'] },
  { id: 'pnr-ddd-rufisque', busSources: ['ddd:213'], ends: [ter('ter-pnr'), ddd('ddd-rufisque')], betweenSites: true,
    observation: 'PNR possède deux quais TER (1016285877/878). L’emprise de gare routière 178908478 n’est ni la gare TER Rufisque ni le point de montée DDD 213. Vérifier d’abord quelle gare désigne le bus.', sources: [east, 'https://api.openstreetmap.org/api/0.6/relation/13607604/1.json', 'https://www.openstreetmap.org/way/178908478'] },
  { id: 'rufisque-ter-83', busSources: ['aftu:83'], ends: [ter('ter-rufisque'), aftu('aftu-rufisque')], betweenSites: true,
    observation: 'La fiche de la 83 cite le secteur de Sonadis, pas le quai de la gare TER. Identifier les occurrences et les côtés de chaussée. Ne pas rattacher cet arrêt à PNR.', sources: [east, 'src/data/aftu-83-directions.json'] },
  { id: 'keur-massar-ddd-tata', ends: [ddd('ddd-keur-massar'), tata('tata-keur-massar')], betweenSites: true,
    observation: 'Distinguer le terminus TATA 52, la gare routière et la mention « Terminus Keur Massar » de la 74. Une commune ou le libellé « Station » ne désigne pas le quai où changer.', sources: [east, 'https://www.openstreetmap.org/node/5286379847', 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/'] },
  { id: 'colobane-ter-tata', busSources: ['tata:33'], ends: [ter('ter-colobane'), tata('tata-colobane')], betweenSites: true,
    observation: 'La fiche TATA 33 et la fiche AFTU 33 ont des provenances distinctes. Aucune ne donne une marche entre quais, ni deux services à enchaîner.', sources: [colobane, busSite, 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/33/colobane/serigne-assane/'] },
  ...feeders.map(([code, station, destination, observation]): Dossier => ({ id: `${station}-ter-${code.toLowerCase()}`,
    ends: [ter(`ter-${station}`), { ...ddd(`sheet:ddd-${code.toLowerCase()}-${station}`), documentaryName: `Desserte gare · DDD ${code} (${destination})` }],
    busSources: [`ddd:${code}`], betweenSites: true, observation, sources: [feederPage, urbanPage, stationReview] })),
  { id: 'bargny-ter-89', ends: [ter('ter-bargny'), { ...aftu('sheet:aftu-89-bargny'), documentaryName: 'Poste Courant Bargny près de la gare TER · AFTU 89' }],
    busSources: ['aftu:89'], betweenSites: true, observation: 'Le repère de la 89 près de la gare ne désigne ni le terminus de la 74 ni le quai TER. Relever les deux côtés et les accès séparément.',
    sources: ['src/data/aftu-89-directions.json', east, stationReview] },
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
    busSources: s.busSources ?? [], betweenSites: s.betweenSites, observation: s.observation, sources: s.sources }
}
const directions = dakarTransferDossiers.flatMap(s => [direction(s, false), direction(s, true)])
export function dakarTransferReport(net: Network, departAt?: number) {
  // Qualify only a binding actually compiled for THIS mode, call and role.
  // Do not look up a bus or a train by the name or the location of its pole.
  function observations(end: TransferEnd, role: 'alight' | 'board') {
    return net.patterns.flatMap(p => {
      if (p.mode !== end.mode) return []
      const bound = net.platforms.get(p)?.[role].get(p.stops.indexOf(end.stopId))
      return bound ? [{ stopId: end.stopId, mode: end.mode, platformId: bound.place.id, lineId: p.lineId, direction: p.direction, evidence: bound.evidence }] : []
    })
  }
  return directions.map(d => {
    const from = observations(d.from, 'alight'), to = observations(d.to, 'board')
    const serviceReviews = (from.length ? from : [undefined]).flatMap(alight => (to.length ? to : [undefined]).map(board => {
      const observed = { alight, board }
      const assessment = assessTransfer(net, d, observed)
      return { observed, ...assessment, ...(departAt !== undefined && { timed: transferWitness(net, assessment, observed, departAt) }) }
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
export function reviewDakarPacket(packet: ReviewPacket, departAt?: number) {
  const d = directions.find(d => d.dossier === packet.dossier && d.from.stopId === packet.fromStopId && d.to.stopId === packet.toStopId)
  if (!d) throw Error('Le dossier et le couple ordonné fromStopId/toStopId doivent correspondre à un sens de l’inventaire.')
  if (!packet.proof || typeof packet.proof !== 'object' || Array.isArray(packet.proof) ||
      !packet.dataset || ![packet.dataset.places, packet.dataset.patterns, packet.dataset.footways].every(Array.isArray)) {
    throw Error('Le paquet doit fournir proof et un dataset de revue (places, patterns, footways).')
  }
  const net = buildNetwork(packet.dataset)
  const assessment = assessTransfer(net, d, packet.proof)
  return { ...d, ...assessment, ...(departAt !== undefined && { timed: transferWitness(net, assessment, packet.proof, departAt) }), rejected: net.rejected }
}
