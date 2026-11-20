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
const exchangeReview = 'docs/enquete-correspondances.md'
const stopReads = 'data/bus-review/friday-stop-excerpts.json'
const stopPage = (slug: string, id: number) => `https://moovitapp.com/index/fr/transport_en_commun-${slug}-Dakar-stop_${id}-5996`
const printed = (id: string) => `src/data/weekly-cells/${id}.json`
const exchangeArchive = 'data/bus-review/exchange-call-comparison.json'
const gare = (site: string) => `https://www.terdakar.sn/gare-de-${site}-tout-ce-qu-il-faut-savoir/`
const colobaneStations = [gare('colobane-nord'), gare('colobane-sud'), colobane]
const colobane60 = [exchangeReview, exchangeArchive, 'https://aftu-senegal.org/map/dakar-urbain-ligne-60/',
  'src/data/bus-sheets/aftu-60-outbound.json', 'src/data/bus-sheets/aftu-60-inbound.json']
const familyReview = [exchangeReview, exchangeArchive, reportedReview, 'data/bus-review/within-bus-families.json', 'data/bus-review/reference-archives.json']
const survey = (mode: 'ddd' | 'aftu' | 'tata', key: string, documentaryName: string): SurveyEnd => ({ mode, stopId: `survey:${key}`, documentaryName })
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
    observation: 'Même objet OSM 4666430941, rang 36/38 dans la 1 et 30/34 dans la 7 vers Palais 1. L’ancien appel D_128 (Cbao Ponty) était commun, mais la fiche DDD nomme Palais 2. CBAO rang 44/47 de la 1, entre Plaza et Place de l’indépendance ; aucune occurrence nommée Ponty sur la 7 de Gare Palais. Identifier les portes et deux appels datés avant de proposer de rester sur place.',
    reverse: { ends: [survey('ddd', 'ponty:7:ouakam', 'Ponty · descente de la 7 vers Ouakam'),
      survey('ddd', 'ponty:1:parcelles', 'Ponty · montée dans la 1 vers les Parcelles')],
      observation: 'Dans ce sens, les deux anciennes lignes appelaient D_122 (Poste Ponty), pas D_128. Poste (Avenue Ponty), rang 4/43 de l’extrait DDD, est à 305,2 m du symbole OSM 711879280 sans relation et à 305,3 m de D_122. Cercle Mess des Officiers et Imm Yoro Lam Ponty encadrent ce rang, sans heure de passage. Écart entre coordonnées de sources, pas un chemin : ne pas placer la porte à cet ancien ID.' },
    sources: [...familyReview, 'https://www.openstreetmap.org/node/4666430941/history/3', 'https://api.openstreetmap.org/api/0.6/node/4666430941/relations.json', 'https://demdikk.sn/chatbot-arrets/', urbanPage] },
  { id: 'colobane-aftu-75-65', busSources: ['aftu:75', 'aftu:65'], betweenSites: false,
    ends: [survey('aftu', 'colobane:75:arrivee', 'Colobane · descente de la 75 depuis Malika'),
      survey('aftu', 'colobane:65:depart', 'Colobane · montée dans la 65 vers Jaxaay 2')],
    observation: 'Les symboles fin 75 / début 65 sont à 0,4 m ; les extrémités des traits à 1,4 m. L’ancienne 65 depuis A_1564 allait vers Kounoune École Mbaba. 75 r52/52 à 04:33, 65 r1/57 à 04:42 : 9 min entre cellules de semaine, pas le temps pour passer d’une porte à l’autre. La fiche d’arrêt 37702002 associe ces deux minutes, pas les deux portes.',
    reverse: { ends: [survey('aftu', 'colobane:65:arrivee', 'Colobane · descente de la 65 depuis Jaxaay 2'),
      survey('aftu', 'colobane:75:depart', 'Colobane · montée dans la 75 vers Malika')],
      observation: 'Les dessins mesurés ne montrent pas cette arrivée de la 65 ni ce départ de la 75. 65 r56/56 à 05:11 et 75 r1/51 à 05:16 : 5 min entre cellules de semaine. La fiche d’arrêt 37702003 associe 05:11 et 05:16 et nomme Yeumbeul ; confirmer la variante de Malika, les quais et la permission de monter.' },
    sources: [...familyReview, stopReads, stopPage('Gare_De_Colobane',37702002), stopPage('Gare_De_Colobane',37702003), 'https://aftu-senegal.org/map/dakar-urbain-ligne-75/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-65/'] },
  { id: 'colobane-aftu-75-60', busSources: ['aftu:75','aftu:60'], betweenSites: false,
    ends: [survey('aftu','colobane:75:yeumbeul:arrivee','Gare De Colobane · 75 depuis Yeumbeul, rang 52/52'),
      survey('aftu','colobane:60:depart','Gare De Colobane · 60 vers Bargny, rang 1/50')],
    observation: '75 depuis 03:50, arrivée 04:33 après Av. Mbacké / Rue 231 ; 60 à 04:40 avant deux occurrences Rue Gib 71, 18. Sept minutes entre cellules, pas un délai de marche. Fin 75 / début 60 : 0,5 m entre symboles, 1,6 m entre bouts des traits. La carte nomme Malika, la grille Yeumbeul : confirmer la variante, la dépose et la file pour Bargny.',
    reverse: { ends: [survey('aftu','colobane:60:arrivee','Gare De Colobane · 60 depuis Bargny, rang 48/48'),
      survey('aftu','colobane:75:yeumbeul:depart','Gare De Colobane · 75 vers Yeumbeul, rang 1/51')],
      observation: '60 depuis 04:20, arrivée 05:17 après Hlm V. La 75 à 05:16 est déjà partie sur la grille ; prochaine origine imprimée 05:25, huit minutes après 05:17. Aucune des deux cartes sortantes ne décrit ces portes dans le sens inverse. Dans l’archive 2023, A_990 → A_1564 pour la 60 et A_1564 → A_1868 pour la 75. Aucun droit d’attendre au même quai.' },
    sources: [...colobane60,'data/bus-review/within-bus-families.json','data/bus-review/reference-archives.json',
      'https://aftu-senegal.org/map/dakar-urbain-ligne-75/','src/data/weekly-cells/aftu-75-colobane.json','src/data/weekly-cells/aftu-75-yeumbeul.json'] },
  { id: 'colobane-aftu-60-ter', busSources: ['aftu:60'], betweenSites: true,
    ends: [survey('aftu','colobane:60:arrivee','Gare De Colobane · 60 depuis Bargny, rang 48/48'),ter('ter-colobane')],
    observation: 'La première arrivée imprimée est 05:17 (04:20 de Bargny) ; ce n’est ni l’ouverture de la gare ni un départ de train. Identifier le quai de dépose, la sortie de la gare routière, le contrôle Nord ou Sud et la voie du TER dans le sens voulu. La fin historique A_1564 r46/46 n’est pas une porte.',
    reverse: { ends: [ter('ter-colobane'),survey('aftu','colobane:60:depart','Gare De Colobane · 60 vers Bargny, rang 1/50')],
      observation: '04:40 est le premier départ de la grille de bus, pas l’arrivée du TER. La carte AFTU ne dessine que le départ vers Bargny ; relever la sortie du train et le passage public vers la bonne file. Ne pas utiliser les deux minutes de la DDD 18 ni la cadence TER pour dater cette paire.' },
    sources: [...colobane60,...colobaneStations] },
  { id: 'colobane-tata-60-ter', busSources: ['tata:60'], betweenSites: true,
    ends: [survey('tata','colobane:tata60:arrivee','Colobane · TATA 60 depuis Bargny'),ter('ter-colobane')],
    observation: 'SETER nomme « Bus TATA : Gare de Colobane : 60 » au Nord et au Sud ; MoMove Dakar nomme Bargny → Colobane. Le dernier secteur après Patte d’Oie ne situe pas la dépose. Identifier côté, accès de gare et horaire du bus par appel ; pas de durée de marche fournie pour la 60.',
    reverse: { ends: [ter('ter-colobane'),survey('tata','colobane:tata60:depart','Colobane · TATA 60 vers Bargny')],
      observation: 'Colobane → Autoroute → Route Nationale est un ordre de repères. Le sens sortant du bus ne précise pas où monter après la sortie du train. Relever porte, traversées, contrôle, durée dans ce sens et les deux courses datées. Les 50/48 rangs de la provenance AFTU ne sont pas une grille TATA.' },
    sources: [...colobaneStations, 'https://momove.app/guide', 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/60/colobane/bargny/',
      'https://www.xibaaru.sn/bus-tata-voici-les-nouveaux-tarifs-document/'] },
  { id: 'colobane-16b-ter', busSources: ['ddd:16B'], betweenSites: true,
    ends: [survey('ddd','colobane:16b:vers-palais','SCOA / Police Bel Air · 16B vers Palais 1'),ter('ter-colobane')],
    observation: 'DDD ordonne Place Bakou → SCOA → Police Bel Air → Bel Air (r11 à r14/27 de repères). SETER indique ESCOA / Police Bel-Air à six minutes à pied. Identifier la dépose précise de la 16B et la porte TER : aucune de ces deux appellations ne désigne une colonne de la grille à 83 appels vers Gare Palais.',
    reverse: { ends: [ter('ter-colobane'),survey('ddd','colobane:16b:vers-malika','ESCOA / Police Bel-Air · montée 16B vers Malika à localiser')],
      observation: 'La liste à 82 appels depuis Gare Palais ne nomme pas Police Bel Air. Ne pas retourner les r12/r13 de l’autre variante ni choisir un Arrêt De Bus anonyme. Confirmer le quai de descente du train, le côté de montée vers Malika, les traversées, le contrôle et la durée porte à porte.' },
    sources: [...colobaneStations,urbanPage,'src/data/weekly-cells/ddd-16B-outbound.json','src/data/weekly-cells/ddd-16B-inbound.json'] },
  { id: 'ouakam-7-42', busSources: ['ddd:7','aftu:42'], betweenSites: false,
    ends: [survey('ddd','okm:7:fin','Rue Okm 60, 67 · 7 depuis Palais, rang 29/29'),
      survey('aftu','okm:42:vers-gadaye','Rue Okm 60, 67 · 42 depuis Ouakam, rang 3/68')],
    observation: 'Semaine : 7 depuis Palais à 05:23, r29 à 05:53 ; 42 depuis Stade Municipal à 06:05, r3 à 06:06. Ni côté de rue ni quai commun établis. Dans les archives, Boutique Diallo devant Shell (D_45) et en face (A_13) sont deux repères différents.',
    reverse: { ends: [survey('aftu','okm:42:vers-ouakam','Rue Okm 60, 67 · 42 vers Ouakam, rang 68/70'),
      survey('ddd','okm:7:vers-palais','Rue Okm 60, 67 · 7 vers Gare Palais, rang 1/27')],
      observation: '42 depuis 05:30, r68 à 06:20 ; la 7 commence aussi à 06:20. Même minute imprimée, pas une marge, ni une permission de rester. A_12 et D_48 sont des repères historiques de côtés différents. Relever séparément ce sens.' },
    sources: [exchangeReview, exchangeArchive, 'https://aftu-senegal.org/map/dakar-urbain-ligne-42/', 'src/data/bus-sheets/aftu-42-outbound.json','src/data/bus-sheets/aftu-42-inbound.json','src/data/bus-sheets/ddd-7-outbound.json','src/data/bus-sheets/ddd-7-inbound.json'] },
  { id: 'dakar-ddd-16a-23', busSources: ['ddd:16A','ddd:23'], betweenSites: false,
    ends: [survey('ddd','dakar:16a:alight-malika','Gare De Dakar · 16A vers Malika, rang 10/64'),survey('ddd','dakar:23:board-parcelles','Gare De Dakar · 23 vers les Parcelles, rang 10/56')],
    observation: 'Les deux services depuis Gare Palais citent Allees Delmas, 1 → Gare De Dakar → Avenue Faidherbe, 7. La fiche 37701983 du vendredi donne 16A à 05:22 puis 23 à 05:27. Même fiche, cinq minutes : ni attente autorisée au même point ni délai entre deux portes établis.',
    reverse: { ends: [survey('ddd','dakar:23:alight-parcelles','Gare De Dakar · descente de la 23 vers les Parcelles'),survey('ddd','dakar:16a:board-malika','Gare De Dakar · montée dans la 16A vers Malika')],
      observation: 'Pour changer de la 23 de 05:37 à la 16A de 05:39, vérifier le temps de descente et la position de la porte de montée. Cet ordre de changement utilise encore les deux bus sortant de Palais. Les deux grilles vers Palais ne nomment pas Gare De Dakar. Dans le ZIP de 2023 le r10/56 de la 23 était D_803, Crédit Mutuel, pas une preuve de quai à la gare.' },
    sources: [stopReads,stopPage('Gare_De_Dakar',37701983),exchangeArchive,printed('ddd-23-inbound'),printed('ddd-16A-inbound')] },
  { id: 'dakar-ter-16a', busSources: ['ddd:16A'], betweenSites: true,
    ends: [ter('ter-dakar'),survey('ddd','dakar:16a:board-malika','Gare De Dakar · 16A vers Malika, rang 10/64')],
    observation: 'La grille donne 05:22 en semaine et 05:47 le week-end au premier bus. SETER indique une ouverture de la gare à 06:00 le week-end ; le 05:47 ne peut servir de départ après cette ouverture. Localiser la sortie du quai, la traversée du parvis et la montée du bus. Le hall n’est pas le point d’arrêt Allées Delmas.',
    reverse: { ends: [survey('ddd','dakar:16a:alight-palais','Dépose de la 16A depuis Malika près du TER à identifier'),ter('ter-dakar')],
      observation: 'Le tableau des 65 appels vers Palais ne nomme pas Gare De Dakar. Ne pas lui attribuer l’arrêt 37701983 ni retourner le rang 10. Mesurer le chemin de la véritable dépose à la porte, au contrôle puis au quai de départ pour une course TER datée.' },
    sources: [gare('dakar'),stopPage('Gare_De_Dakar',37701983),printed('ddd-16A-outbound'),printed('ddd-16A-inbound')] },
  { id: 'pikine-16a-65', busSources: ['ddd:16A','aftu:65'], betweenSites: false,
    ends: [survey('ddd','pikine:16a:palais','Route De Rufisque, 7432 · 16A vers Palais, rang 33/65'),survey('aftu','pikine:65:colobane','Route De Rufisque, 7432 · 65 vers Colobane, rang 38/56')],
    observation: 'Après Sips, la fiche 37702867 du vendredi donne 16A 05:28, 65 05:32. Quatre minutes entre cellules. Confirmer que les deux portes ouvrent du même côté et au même point, les droits de descendre puis monter et le délai minimal ; aucune course datée admise.',
    reverse: { ends: [survey('aftu','pikine:65:jaxaay','Route De Rufisque, 7432 · 65 vers Jaxaay, rang 18/57'),survey('ddd','pikine:16a:malika','Route De Rufisque, 7432 · 16A vers Malika, rang 34/64')],
      observation: 'Avant Sips cette fois : à 05:45 pour la 65 issue de 05:27, à 05:48 pour la 16A issue de 05:15. Ne pas réutiliser la fiche d’arrêt du sens vers Colobane. Relever le côté et la position des portes ou une traversée autorisée dans ce sens, et son temps.' },
    sources: [stopReads,stopPage('Route_De_Rufisque_7432',37702867),printed('ddd-16A-outbound'),printed('ddd-16A-inbound'),printed('aftu-65-colobane'),printed('aftu-65-jaxaay')] },
  { id: 'rufisque-66-ter', busSources: ['aftu:66'], betweenSites: true,
    ends: [survey('aftu','rufisque:66:gorom','Gare De Rufisque · 66 vers Gorom, rang 44/77'),ter('ter-rufisque')],
    observation: 'La 66 de 04:50 passe à Gare Routiere De Rufisque r41 à 05:40 puis à Gare De Rufisque r44 à 05:43. La fiche 37703748 cite la 66 vers Gorom, pas une arrivée sur le quai du train. Identifier trottoir de dépose, accès ferroviaire, traversées autorisées et contrôle.',
    reverse: { ends: [ter('ter-rufisque'),survey('aftu','rufisque:66:yoff','Gare De Rufisque · 66 vers Yoff, rang 34/77')],
      observation: 'La 66 de 04:45 passe à 05:20 au r34. La fiche 37703749 vers Yoff renvoie à un autre arrêt homonyme, 37703748. Les 17 mètres annoncés entre points ne sont pas le trajet du quai TER à la porte du bus. Ni PNR, ni gare maritime, ni centre de la gare routière ne remplace ces portes.' },
    sources: [east,stopReads,stopPage('Gare_De_Rufisque',37703748),stopPage('Gare_De_Rufisque',37703749),printed('aftu-66-outbound'),printed('aftu-66-inbound')] },
  { id: 'petersen-tata-55-brt', busSources: ['tata:55'], betweenSites: true,
    ends: [survey('tata','petersen:55:alight','Petersen · dépose TATA 55 depuis Rufisque SONADIS'),brt('brt-petersen')],
    observation: 'Rond-point Petersen est cité par SETER pour la 55. Les Allées Papa Gueye Fall précèdent Petersen dans la description depuis SONADIS. Ni cette suite ni le mot « rond-point » ne localisent la dépose pour rejoindre le valideur et le départ du B1. Relever la porte et une course TATA datée.',
    reverse: { ends: [brt('brt-petersen'),survey('tata','petersen:55:board','Petersen · montée TATA 55 vers Rufisque à identifier')],
      observation: 'Depuis le quai B1 d’arrivée, relever sortie, traversées et file TATA vers Rufisque, puis la durée de cette marche. SETER ne donne ni sens, ni minute de départ ni temps de marche pour la 55. Ne pas réutiliser le chemin de la R01A, ni un arrêt AFTU 55.' },
    sources: [petersen,b1,...colobaneStations,'src/data/tataNamedStops.json','https://www.covoiturage.sn/bus-tata-itineraire/ligne/55/terminus-rufisque-sonadis/petersen/'] },
  { id: 'dakar-12-ter', busSources: ['ddd:12'], betweenSites: true,
    ends: [survey('ddd','gare:12:depuis-palais','Gare De Dakar · 12 depuis Gare Palais, rang 10/67'),ter('ter-dakar')],
    observation: '19:53 à Gare Palais, 20:01 à la cellule Gare De Dakar. Le hall et le guichet place du Tirailleur ne localisent ni la descente du bus ni la montée dans le train. Relever porte, traversée du parvis, contrôle des titres, voie et délai.',
    reverse: { ends: [ter('ter-dakar'),survey('ddd','gare:12:vers-palais','Gare de Dakar · montée à localiser, 12 vers Palais')],
      observation: 'La feuille des 63 appels vers Palais ne nomme pas Gare De Dakar. Ne pas inverser le rang 10/67, ni utiliser Avenue Faidherbe comme porte. Il manque la descente du train dans ce sens, sa sortie et le vrai point de montée de la 12.' },
    sources: [exchangeReview,gare('dakar'),'src/data/ddd12DirectionSheets.ts','src/data/weekly-cells/ddd-12-guediawaye.json'] },
  { id: 'colobane-18-ter', busSources: ['ddd:18'], betweenSites: true,
    ends: [survey('ddd','colobane:18:descente','Colobane après CSS · descente sur le circuit 18'),ter('ter-colobane')],
    observation: 'Les deux fiches TER Nord et Sud disent « en face de la gare (2 minutes à pied) : 18 ». Elles ne distinguent pas la porte desservie, le sens de marche, le contrôle ni la voie. Aucun chrono porte bus → quai train.',
    reverse: { ends: [ter('ter-colobane'),survey('ddd','colobane:18:montee','Colobane avant Service des mines · montée sur le circuit 18')],
      observation: 'Localiser la sortie du quai TER et le côté à rejoindre pour monter vers Service des mines, sans retourner le circuit Dieuppeul. D_700 Terrain Colobane r14/43 dans l’archive ne désigne pas la porte. Les deux fiches de gare donnent le même texte.' },
    sources: [exchangeReview,exchangeArchive,gare('colobane-nord'),gare('colobane-sud'),urbanPage] },
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
  { id: 'petersen-brt-ddd', busSources: ['ddd:13', 'ddd:121'], ends: [brt('brt-petersen'), ddd('ddd-petersen')], betweenSites: true,
    reverse: { ends: [ddd('ddd-petersen'),brt('brt-petersen')], observation: 'Confirmer la dépose de la R01A depuis le centre-ville et sa sortie. Le zébra ne désigne pas la porte de dépose. Relever le chemin autorisé jusqu’au valideur et au quai de départ B1 vers Guédiawaye ; le quai B1 d’arrivée ne prouve pas ce rôle.' },
    observation: 'SunuBRT indique la R01A au pôle en face pour le centre-ville. Le chemin 1458575519 atteint un passage zébré, pas un point de montée R01A. Relever les portes, le quai et le départ de ce sens. Ne pas lui attribuer la desserte des 13 ou 121.', sources: [petersen, b1, pepp, urbanPage, 'https://www.sunubrt.sn/', 'https://www.openstreetmap.org/way/1458575519'] },
  { id: 'petersen-brt-aftu', busSources: ['aftu:4', 'aftu:25', 'aftu:29'], ends: [brt('brt-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.', sources: [petersen, b1, pepp, 'https://aftu-senegal.org/infos-pratiques/'] },
  { id: 'petersen-ddd-aftu', ends: [ddd('ddd-petersen'), aftu('aftu-petersen')], betweenSites: false,
    observation: 'Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.', sources: [legacy, petersen] },
  { id: 'guediawaye-brt-ddd', busSources: ['ddd:5', 'ddd:12'], ends: [brt('brt-prefecture-guediawaye'), ddd('ddd-guediawaye')], betweenSites: false,
    observation: 'Le passage zébré 13376903816 traverse la boucle de bus mais ne rejoint pas le poteau 6440488778. Relever le chemin quai à quai et les points de montée/descente DDD 5 ou 12 dans chaque sens.', sources: [poles, pepp, 'https://www.openstreetmap.org/node/6440488778', 'https://www.openstreetmap.org/way/1458592779'] },
  { id: 'colobane-ter-ddd', ends: [ter('ter-colobane'), ddd('ddd-colobane')], betweenSites: true,
    observation: 'Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.', sources: [colobane, railSite, busSite] },
  { id: 'colobane-ter-aftu', busSources: ['aftu:30', 'aftu:33'], betweenSites: true,
    ends: [ter('ter-colobane'), survey('aftu','colobane:30:depart','Gare De Colobane · 30 vers Guédiawaye, rang 1/74')],
    observation: 'La 30 part à 05:20 puis 05:35, avant Rue Hlm 225, 23. Confirmer la sortie du train, le contrôle et la file de montée pour Gadaye. A_1564 → A_1394 appartient à une ancienne liste de 68 appels ; les 6 minutes de SETER pour le rond-point DDD ne concernent pas ce départ.',
    reverse: { ends: [survey('aftu','colobane:30:arrivee','Gare De Colobane · 30 depuis Guédiawaye, rang 77/77'), ter('ter-colobane')],
      observation: '05:15 → 06:01, après Av. Mbacké / Rue 231. A_1869 → A_1564 terminait une ancienne liste de 67 appels. Aucune correspondance établie entre la dépose et une porte TER Nord ou Sud. Les fiches 30 et 33 confirment le terminus, pas les quais ni les accès ; ne pas attribuer les heures de la 30 à la 33.' },
    sources: [...colobaneStations,railSite,exchangeArchive,printed('aftu-30-outbound'),printed('aftu-30-inbound'), 'https://aftu-senegal.org/map/dakar-urbain-ligne-30/', 'https://aftu-senegal.org/map/dakar-urbain-ligne-33/'] },
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
