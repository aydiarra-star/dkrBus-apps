/** Manual, bounded reviews. Nothing here authorizes a service, transfer or
 * the rest of the source relation. Versioned OSM platforms retain their IDs
 * even when two successive occurrences have the same name. */
interface Scope {
  id: string; family: 'ddd' | 'aftu' | 'tata'; line: string; towards: string
  descriptionUrl: string
  landmarkKind: 'platform' | 'road-limit'
  /** Signed way ID: negative means explicitly travel against OSM digitisation
   * on a two-way way, NOT synthesise the opposite bus direction. */
  ways: readonly number[]; markers: readonly number[]
}
// A named street between circumscribed limits need not have a bus relation.
// It can never supply platforms. The second source supports the travel order.
export type SectionReview = Scope & ({ relation: number; version: number; directionUrl?: never }
  | { relation?: never; version?: never; directionUrl: string; landmarkKind: 'road-limit' })
/** [version, latitude, longitude, display name]. Qualifiers distinguish
 * homonymous platforms; unnamed nodes get geographical descriptions. */
export const BUS_SECTION_MARKERS: Readonly<Record<number, readonly [number, number, number, string]>> = {
  4323838512: [3,14.7357947,-17.4733169,'VDN · secteur ENSUP'],
  4363242544: [3,14.7291693,-17.4727569,'VDN · cimetière Saint-Lazare'],
  4666430960: [2,14.6890347,-17.4577499,'Manguiers'],
  4666430958: [7,14.6864512,-17.4554847,'Église Saint-Joseph'],
  4666430955: [2,14.6833902,-17.4524284,'Médina · sens centre-ville'],
  4666430953: [5,14.6814319,-17.4502967,'Marché Tilène · côté Sahm, vers Stade'],
  4666430951: [6,14.6794172,-17.4481891,'Marché Tilène · côté Stade, vers le centre'],
  4666430950: [2,14.6784889,-17.4471505,'Stade · avenue Blaise Diagne'],
  4666430949: [6,14.6779668,-17.4463337,'Polyclinique · avenue Blaise Diagne'],
  4666430952: [3,14.6799822,-17.4485358,'Marché Tilène · côté Stade, vers Sahm'],
  4666430954: [3,14.6820994,-17.4507748,'Marché Tilène · côté Sahm, vers le rond-point'],
  4666430956: [3,14.6837606,-17.4525605,'Médina · vers le rond-point Sahm'],
  4754647802: [2,14.6850066,-17.4530551,'Boulevard Gueule Tapée · côté Sahm'],
  4754647804: [2,14.6893354,-17.4507672,'Boulevard Gueule Tapée · entre Sahm et Canal 4'],
  4754647805: [2,14.6903928,-17.4501972,'Boulevard Gueule Tapée · côté Canal 4'],
  305375476: [21,14.7315610,-17.4352974,'Carrefour des Civilisations · sortie des Maristes'],
  3403676386: [4,14.7237880,-17.4383993,'Route des pères Maristes × Front de Terre'],
  4666430964: [3,14.6930841,-17.4621614,'UCAD · vers Sahm'],
  4666430962: [8,14.6910578,-17.4597119,'Avenue Cheikh Anta Diop · entre UCAD et Manguiers'],
  4666430957: [7,14.6856378,-17.4542992,'Sahm · vers Ouakam'],
  4666430959: [3,14.6880625,-17.4568862,'Manguiers · vers Ouakam'],
  4666430961: [8,14.6907153,-17.4589622,'Avenue Cheikh Anta Diop · vers UCAD'],
  4666430963: [3,14.6932398,-17.4620743,'UCAD · vers Ouakam'],
  1745835667: [9,14.6845624,-17.4533711,'Sahm · sortie vers le boulevard de la Gueule Tapée'],
  297238941: [6,14.6917653,-17.4495083,'Boulevard de la Gueule Tapée · limite côté Fass'],
  6047705119: [3,14.7539077,-17.2847054,'Jaxaay · virage côté Shell, vers Keur Massar'],
  3445856553: [4,14.7553284,-17.2865139,'Route de Diakhaye · secteur du lycée, vers Keur Massar'],
  4873880717: [4,14.7582665,-17.2944787,'Route de Diakhaye · secteur ASECNA, vers Keur Massar'],
  4873881075: [4,14.7580007,-17.2940003,'Route de Diakhaye · secteur ASECNA, vers Rufisque'],
  339228136: [7,14.7552010,-17.2863714,'Route de Diakhaye · secteur du lycée, vers Rufisque'],
  2415437588: [7,14.7538439,-17.2847805,'Jaxaay · virage côté Shell, vers Rufisque'],
}
const ddd = 'https://demdikk.sn/reseau-urbain-dakar/'
const aftu1 = 'https://aftu-senegal.org/map/dakar-urbain-ligne-1/'
const tata1 = 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/1/lat-dior/hlm-grand-yoff/'
const aftu74 = 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/'
const sheet74 = 'https://moovitapp.com/index/fr/transport_en_commun-line-74-Dakar-5996-1618038-18051487-'
const towardSahm = [108697072,411081520,162751443,166572373,518366663,518366662,411081524,441226525,441232792,108821782]
const medina = [4666430955,4666430953,4666430951,4666430950]
export const BUS_SECTION_REVIEWS: readonly SectionReview[] = [
  { id: 'ddd-1-vdn', family: 'ddd', line: '1', towards: 'Leclerc', relation: 6951328, version: 28, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: [108059458,1097940661], markers: [4323838512,4363242544] },
  { id: 'ddd-1-sahm', family: 'ddd', line: '1', towards: 'Leclerc', relation: 6951328, version: 28, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: towardSahm, markers: [4666430964,4666430962,4666430960,4666430958,...medina] },
  { id: 'ddd-4-medina', family: 'ddd', line: '4', towards: 'Leclerc', relation: 7203970, version: 10, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: [108821782], markers: medina },
  { id: 'ddd-4-gueule-tapee', family: 'ddd', line: '4', towards: 'Liberté 5', relation: 6990830, version: 16, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: [25860686,430812008,162751424,476073360], markers: [4666430949,4666430952,4666430954,4666430956,4754647802,4754647804,4754647805] },
  // The official Petersen-bound description, the identified route ways and
  // archive occurrence order corroborate THIS street only. The relation has
  // NO stop members. These are physical road junctions, not boarding points.
  { id: 'aftu-40-maristes', family: 'aftu', line: '40', towards: 'Petersen', relation: 3982642, version: 25, descriptionUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-40/',
    landmarkKind: 'road-limit', ways: [581409738,-27811399], markers: [305375476,3403676386] },
  { id: 'ddd-7-sahm', family: 'ddd', line: '7', towards: 'Palais (portion UCAD–Stade)', relation: 7500475, version: 14, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: towardSahm, markers: [4666430964,4666430962,4666430960,4666430958,...medina] },
  { id: 'ddd-7-ucad', family: 'ddd', line: '7', towards: 'Ouakam', relation: 6990669, version: 19, descriptionUrl: ddd, landmarkKind: 'platform',
    ways: [25860686,430812008,162751433,430810297,108697076,517802196,166572372,166572374,430805833,517410592,162751446],
    markers: [4666430949,4666430952,4666430954,4666430956,4666430957,4666430959,4666430961,4666430963] },
  // Both texts describe the northbound boulevard from Sahm. They do not
  // establish two vehicles, or the right to board at any of the DDD platforms.
  { id: 'aftu-1-fass', family: 'aftu', line: '1', towards: 'HLM Grand Médine', descriptionUrl: aftu1, directionUrl: tata1, landmarkKind: 'road-limit',
    ways: [162751424,476073360], markers: [1745835667,297238941] },
  { id: 'tata-1-fass', family: 'tata', line: '1', towards: 'HLM Grand Yoff (fiche TATA)', descriptionUrl: tata1, directionUrl: aftu1, landmarkKind: 'road-limit',
    ways: [162751424,476073360], markers: [1745835667,297238941] },
  // Two independent one-way carriageways; neither claims the whole 74 or
  // validates a terminal at the TER. Rufisque <> Bargny varies by source.
  { id: 'aftu-74-keur-massar', family: 'aftu', line: '74', towards: 'Keur Massar', descriptionUrl: aftu74, directionUrl: sheet74 + '1', landmarkKind: 'road-limit',
    ways: [642083765], markers: [6047705119,3445856553,4873880717] },
  { id: 'aftu-74-rufisque', family: 'aftu', line: '74', towards: 'Rufisque', descriptionUrl: aftu74, directionUrl: sheet74 + '0', landmarkKind: 'road-limit',
    ways: [361741996], markers: [4873881075,339228136,2415437588] },
]
