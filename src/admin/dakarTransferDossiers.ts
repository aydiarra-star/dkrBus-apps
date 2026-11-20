/** Survey/review inventory, NOT an input to dakarNetwork. Each direction has
 * its own proof slot. A reverse review request never reverses a way. */
import { transferWitness, validRunOrigins, type RunOrigins } from './transferWitness'
import { ALL_CORRIDOR_STOPS } from '../domain/corridors'
import { assessTransfer, type TransferEnd, type TransferProof } from '../routing/transferReview'
import { buildNetwork } from '../routing/network'
import type { Dataset, Network } from '../routing/model'

type SurveyEnd = TransferEnd & { documentaryName?: string }
type SurveyPair = readonly [alight: SurveyEnd, board: SurveyEnd]
interface Dossier {
  id: string
  ends: SurveyPair
  /** At terminals the return transfer needs other service calls, not a swap
   * that would alight at an origin and board at the final stop. */
  reverse?: { ends: SurveyPair; observation: string }
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
const terminalReview = ['docs/terminus-correspondances.md', 'data/bus-review/terminal-occurrences.json', 'data/bus-review/terminus-quays-2026-11-19.json']
const reportedReview = 'docs/releve-218-73.md'
const familyReview = [reportedReview, 'data/bus-review/within-bus-families.json', 'data/bus-review/reference-archives.json']
const survey = (mode: 'ddd' | 'aftu', key: string, documentaryName: string): SurveyEnd => ({ mode, stopId: `survey:${key}`, documentaryName })
export const dakarTransferDossiers: readonly Dossier[] = [
  { id: 'thiaroye-218-73', busSources: ['ddd:218', 'aftu:73'], betweenSites: false,
    ends: [survey('ddd', 'thiaroye:218:arrivee', 'Dépôt Thiaroye · descente de la 218 depuis Aéroport LSS'),
      survey('aftu', 'thiaroye:73:depart', 'Poste Thiaroye · montée dans la 73 vers Lac Rose')],
    observation: 'Départ marqué de la 73 à 1,7 m du poteau 217/218. Les deux dessins quittent le dépôt. Ni la descente datée de la 218 depuis Aéroport LSS, ni le passage jusqu’à la 73 ne sont confirmés.',
    reverse: { ends: [survey('aftu', 'thiaroye:73:arrivee', 'Dépôt Thiaroye · descente de la 73 depuis Lac Rose'),
      survey('ddd', 'thiaroye:218:depart', 'Dépôt Thiaroye · montée dans la 218 vers Aéroport LSS')],
      observation: 'Depuis Lac Rose, A_586 était l’avant-dernier appel ; le terminus A_266 était à 99,9 m du poteau. Près de cet ancien terminus, une autre voie de service et une chaussée à sens unique. La 218 est dessinée depuis le point 539 à 29,7 m du poteau. Ni marche autorisée ni départ daté au dépôt établis.' },
    sources: [...terminalReview, 'docs/depot-thiaroye.md', 'data/bus-review/thiaroye-site.json', 'https://www.openstreetmap.org/node/4419421889', 'https://aftu-senegal.org/map/dakar-urbain-ligne-73/', urbanPage, 'https://x.com/dakardemdikk1/status/1937979929007702515'] },
  { id: 'thiaroye-218-73-niague', busSources: ['ddd:218', 'aftu:73'], betweenSites: false,
    ends: [survey('ddd', 'nouveau:218:arrivee-poste', 'Poste Thiaroye · descente de la 218 depuis terminus 7218/219'),
      survey('aftu', 'nouveau:73:depart-ciel-oil', 'Station Ciel Oil/Thiaroye · départ de la 73 vers Niague')],
    observation: '05:28 est un départ de la 218, pas son arrivée à Poste Thiaroye. La 73 est signalée à 05:31 à son origine. La différence de trois minutes ne mesure pas une correspondance.',
    reverse: { ends: [survey('aftu', 'nouveau:73:arrivee-ciel-oil', 'Station Ciel Oil/Thiaroye · arrivée de la 73 depuis Niague'),
      survey('ddd', 'nouveau:218:depart-poste', 'Poste Thiaroye · départ de la 218 vers terminus 7218/219')],
      observation: 'Pas d’arrivée fournie pour la 73 depuis Niague. Ne pas y reporter 06:54 depuis Lac Rose, ni générer des 218 toutes les 16 minutes.' },
    sources: [reportedReview, 'data/bus-review/reported-218-73.json', 'docs/depot-thiaroye.md'] },
  { id: 'ponty-ddd-1-7', busSources: ['ddd:1', 'ddd:7'], betweenSites: false,
    ends: [survey('ddd', 'ponty:1:leclerc', 'Ponty · descente de la 1 vers Leclerc'),
      survey('ddd', 'ponty:7:palais', 'Ponty · montée dans la 7 vers Palais 1')],
    observation: 'Même objet OSM 4666430941, rang 36/38 dans la 1 et 30/34 dans la 7 vers Palais 1. L’ancien appel D_128 (Cbao Ponty) était commun, mais la fiche DDD nomme Palais 2. Ni permission de rester au même point ni deux courses datées.',
    reverse: { ends: [survey('ddd', 'ponty:7:ouakam', 'Ponty · descente de la 7 vers Ouakam'),
      survey('ddd', 'ponty:1:parcelles', 'Ponty · montée dans la 1 vers les Parcelles')],
      observation: 'Dans ce sens, les deux anciennes lignes appelaient D_122 (Poste Ponty), pas D_128. Le poteau 711879280 près de Poste Ponty n’a pas d’appartenance de ligne. Les deux portes du retour restent à identifier.' },
    sources: [...familyReview, 'https://www.openstreetmap.org/node/4666430941/history/3', 'https://api.openstreetmap.org/api/0.6/node/4666430941/relations.json', urbanPage] },
  { id: 'colobane-aftu-75-65', busSources: ['aftu:75', 'aftu:65'], betweenSites: false,
    ends: [survey('aftu', 'colobane:75:arrivee', 'Colobane · descente de la 75 depuis Malika'),
      survey('aftu', 'colobane:65:depart', 'Colobane · montée dans la 65 vers Jaxaay 2')],
    observation: 'Les symboles fin 75 / début 65 sont à 0,4 m ; les extrémités des traits à 1,4 m. L’ancienne 65 depuis A_1564 allait vers Kounoune École Mbaba. Aucune marche ni montée datée démontrée.',
    reverse: { ends: [survey('aftu', 'colobane:65:arrivee', 'Colobane · descente de la 65 depuis Jaxaay 2'),
      survey('aftu', 'colobane:75:depart', 'Colobane · montée dans la 75 vers Malika')],
      observation: 'Les dessins mesurés ne montrent pas cette arrivée de la 65 ni ce départ de la 75. Les listes retour à Gare De Colobane ne localisent pas les portes.' },
    sources: [...familyReview, 'https://aftu-senegal.org/map/dakar-urbain-ligne-75/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-65/'] },
  { id: 'ouakam-67-7', busSources: ['aftu:67', 'ddd:7'], betweenSites: false,
    ends: [survey('aftu', 'ouakam:67:arrivee', 'Boutique Diallo · descente de la 67 depuis Thiawlène'),
      survey('ddd', 'ouakam:7:palais', 'Arrêt Pharmacie · montée dans la 7 vers Palais')],
    observation: 'Le poteau 4363242525 est le huitième quai de la relation 7500475 vers Palais 1. La 67 approche en sens opposé et sa fin marquée est à 1,7 m du poteau. Ni le dessin ni la grille Espi → Poste de Santé ne prouvent une descente au même point.',
    reverse: { ends: [survey('ddd', 'ouakam:7:ouakam', 'Ouakam · descente de la 7 depuis Palais'),
      survey('aftu', 'ouakam:67:depart', 'Ouakam · montée dans la 67 vers Thiawlène')],
      observation: 'Le rôle de la 7 vers Palais ne vaut pas pour la 7 depuis Palais. Le retour de la 67 n’est pas dessiné ; ne pas retourner le marqueur de fin ni la marche.' },
    sources: [...terminalReview, 'https://www.openstreetmap.org/relation/7500475', 'https://aftu-senegal.org/map/dakar-urbain-ligne-67/', urbanPage] },
  { id: 'guediawaye-26-5', busSources: ['aftu:26', 'ddd:5'], betweenSites: false,
    ends: [survey('aftu', 'guediawaye:26:arrivee', 'Guédiawaye · descente de la 26 depuis les Parcelles'),
      survey('ddd', 'guediawaye:5:depart', 'Guédiawaye · montée dans la 5 vers Palais')],
    observation: 'Fin marquée de la 26 à 2,5 m du poteau L5;L12. L’ancien D_406 était le troisième appel de la 5 depuis Guédiawaye, pas le terminus. La grille de la 26 finit à Thiaroye.',
    reverse: { ends: [survey('ddd', 'guediawaye:5:arrivee', 'Guédiawaye · descente de la 5 depuis Palais'),
      survey('aftu', 'guediawaye:26:depart', 'Guédiawaye · départ à vérifier de la 26 vers les Parcelles')],
      observation: 'Le dessin de la 26 ne montre pas ce départ ; sa grille depuis Thiaroye ne le situe pas à Guédiawaye. Identifier séparément la descente de la 5 depuis Palais.' },
    sources: [...terminalReview, 'https://www.openstreetmap.org/node/5038866775', 'https://aftu-senegal.org/map/dakar-urbain-ligne-26/', urbanPage] },
  { id: 'patte-doie-ddd-tata', busSources: ['ddd:218', 'tata:60'], betweenSites: false,
    ends: [{ ...ddd('survey:patte-doie:218:lss'), documentaryName: 'Patte d’Oie · 218 depuis Thiaroye vers Aéroport LSS, à confirmer' },
      { ...tata('survey:patte-doie:60:colobane'), documentaryName: 'Patte d’Oie · 60 depuis Bargny vers Colobane, à confirmer' }],
    observation: '23,7 m sur le chemin 639363334 entre les poteaux DDD et TATA dans chaque sens. Ni numéro ni rôle de ligne sur les poteaux. L’arrêt historique AFTU 60 est même plus proche du poteau DDD ; il ne localise pas la montée TATA. Aucun départ du jour attribué.',
    sources: ['docs/patte-doie.md', 'data/bus-review/interchange-region-2026-11-19.json', 'data/bus-review/patte-doie-occurrences.json', 'https://www.openstreetmap.org/way/639363334', urbanPage, 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/60/colobane/bargny/'] },
  { id: 'gt54-18-39', busSources: ['ddd:18','aftu:39'], betweenSites: false,
    ends: [{ ...ddd('survey:gt54:18:delafosse'), documentaryName: 'Rue GT-54 · 18 sur le circuit par le lycée Delafosse' },
      { ...aftu('survey:gt54:39:diamalaye'), documentaryName: 'Rue GT-54 · 39 depuis Lat Dior vers Diamalaye' }],
    observation: 'Poteau 2175197258 et appels réguliers dans les deux archives, du même côté vers GT-73. Le retour de la 39 n’y est pas. Ni droits du jour ni prochaine montée atteignable établis.',
    sources: ['docs/validation-physique.md', 'https://www.openstreetmap.org/node/2175197258', urbanPage, 'https://aftu-senegal.org/map/dakar-urbain-ligne-39/'] },
  { id: 'maristes-12-75', busSources: ['ddd:12','aftu:75'], betweenSites: false,
    ends: [{ ...ddd('survey:maristes:12:palais'), documentaryName: 'Fiche 37702688 · 12 vers Gare Palais' },
      { ...aftu('survey:maristes:75:colobane'), documentaryName: 'Fiche 37702688 · 75 vers Colobane' }],
    observation: 'Les deux fiches de sens et les heures à l’appel 37 ne prouvent pas un même point d’attente. Aucune distance réelle ni traversée établie entre ces deux appels.',
    sources: ['docs/validation-physique.md','docs/trajets-bus-medina-maristes.md', 'https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702688-5996'] },
  { id: 'dakar-petersen', ends: [ter('ter-dakar'), brt('brt-petersen')], betweenSites: true,
    observation: 'Le quai B1 de descente est identifié. Le quai de montée vers Guédiawaye est distinct et hors du seuil du point de référence. Les 1 km historiques ne décrivent pas un chemin entre gares.', sources: [legacy, petersen, b1] },
  { id: 'colobane-place-nation', ends: [ter('ter-colobane'), brt('brt-place-nation')], betweenSites: true,
    observation: 'Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.', sources: [legacy, railSite] },
  { id: 'petersen-brt-ddd', busSources: ['ddd:13', 'ddd:121'], ends: [brt('brt-petersen'), ddd('ddd-petersen')], betweenSites: false,
    observation: 'SunuBRT indique la R01A au pôle en face pour le centre-ville. Le chemin 1458575519 atteint un passage zébré, pas un point de montée R01A. Relever les portes, le quai et le départ de ce sens. Ne pas lui attribuer la desserte des 13 ou 121.', sources: [petersen, b1, pepp, urbanPage, 'https://www.sunubrt.sn/', 'https://www.openstreetmap.org/way/1458575519'] },
  { id: 'petersen-brt-aftu', busSources: ['aftu:4', 'aftu:25', 'aftu:29'], ends: [brt('brt-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.', sources: [petersen, b1, pepp, 'https://aftu-senegal.org/infos-pratiques/'] },
  { id: 'petersen-ddd-aftu', ends: [ddd('ddd-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.', sources: [legacy, petersen] },
  { id: 'guediawaye-brt-ddd', busSources: ['ddd:5', 'ddd:12'], ends: [brt('brt-prefecture-guediawaye'), ddd('ddd-guediawaye')], betweenSites: false,
    observation: 'Le passage zébré 13376903816 traverse la boucle de bus mais ne rejoint pas le poteau 6440488778. Relever le chemin quai à quai et les points de montée/descente DDD 5 ou 12 dans chaque sens.', sources: [poles, pepp, 'https://www.openstreetmap.org/node/6440488778', 'https://www.openstreetmap.org/way/1458592779'] },
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
  const [from, to] = reverse ? (s.reverse?.ends ?? [s.ends[1], s.ends[0]]) : s.ends
  return { dossier: s.id, from: reference(from), to: reference(to), busSources: s.busSources ?? [],
    betweenSites: s.betweenSites, observation: (reverse && s.reverse ? s.reverse.observation : s.observation), sources: s.sources }
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
  dataset: Dataset; proof: TransferProof; runOrigins?: RunOrigins
}
export function reviewDakarPacket(packet: ReviewPacket, departAt?: number) {
  const d = directions.find(d => d.dossier === packet.dossier && d.from.stopId === packet.fromStopId && d.to.stopId === packet.toStopId)
  if (!d) throw Error('Le dossier et le couple ordonné fromStopId/toStopId doivent correspondre à un sens de l’inventaire.')
  if (!packet.proof || typeof packet.proof !== 'object' || Array.isArray(packet.proof) ||
      !packet.dataset || ![packet.dataset.places, packet.dataset.patterns, packet.dataset.footways].every(Array.isArray)) {
    throw Error('Le paquet doit fournir proof et un dataset de revue (places, patterns, footways).')
  }
  if (packet.runOrigins !== undefined && (departAt === undefined || !validRunOrigins(packet.runOrigins))) {
    throw Error('runOrigins nécessite deux départs aux origines (secondes Unix) et une date de recherche --at.')
  }
  const net = buildNetwork(packet.dataset)
  const assessment = assessTransfer(net, d, packet.proof)
  return { ...d, ...assessment, ...(departAt !== undefined && { timed: transferWitness(net, assessment, packet.proof, departAt, packet.runOrigins) }), rejected: net.rejected }
}
