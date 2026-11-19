/** Manual, bounded reviews. Nothing here authorizes a service, transfer or
 * the rest of the source relation. Versioned OSM platforms retain their IDs
 * even when two successive occurrences have the same name. */
export interface SectionReview {
  id: string; family: 'ddd' | 'aftu' | 'tata'; line: string; towards: string
  relation: number; version: number; operatorUrl: string
  landmarkKind: 'platform' | 'road-limit'
  /** Signed way ID: negative means explicitly travel against OSM digitisation
   * on a two-way way, NOT synthesise the opposite bus direction. */
  ways: readonly number[]; markers: readonly number[]
}
/** [version, latitude, longitude, display name]. Qualifiers distinguish
 * homonymous platforms; unnamed nodes get geographical descriptions. */
export const BUS_SECTION_MARKERS: Readonly<Record<number, readonly [number, number, number, string]>> = {
  4323838512: [3,14.7357947,-17.4733169,'VDN · secteur ENSUP'],
  4363242544: [3,14.7291693,-17.4727569,'VDN · cimetière Saint-Lazare'],
  4666430960: [2,14.6890347,-17.4577499,'Manguiers'],
  4666430958: [7,14.6864512,-17.4554847,'Église Saint-Joseph'],
  4666430955: [2,14.6833902,-17.4524284,'Médina · vers Leclerc'],
  4666430953: [5,14.6814319,-17.4502967,'Marché Tilène · côté Sahm, vers Leclerc'],
  4666430951: [6,14.6794172,-17.4481891,'Marché Tilène · côté Stade, vers Leclerc'],
  4666430950: [2,14.6784889,-17.4471505,'Stade · avenue Blaise Diagne'],
  4666430949: [6,14.6779668,-17.4463337,'Polyclinique · avenue Blaise Diagne'],
  4666430952: [3,14.6799822,-17.4485358,'Marché Tilène · côté Stade, vers Liberté 5'],
  4666430954: [3,14.6820994,-17.4507748,'Marché Tilène · côté Sahm, vers Liberté 5'],
  4666430956: [3,14.6837606,-17.4525605,'Médina · vers Liberté 5'],
  4754647802: [2,14.6850066,-17.4530551,'Boulevard Gueule Tapée · côté Sahm'],
  4754647804: [2,14.6893354,-17.4507672,'Boulevard Gueule Tapée · entre Sahm et Canal 4'],
  4754647805: [2,14.6903928,-17.4501972,'Boulevard Gueule Tapée · côté Canal 4'],
  305375476: [21,14.7315610,-17.4352974,'Carrefour des Civilisations · sortie des Maristes'],
  3403676386: [4,14.7237880,-17.4383993,'Route des pères Maristes × Front de Terre'],
}
const ddd = 'https://demdikk.sn/reseau-urbain-dakar/'
const medina = [4666430955,4666430953,4666430951,4666430950]
export const BUS_SECTION_REVIEWS: readonly SectionReview[] = [
  { id: 'ddd-1-vdn', family: 'ddd', line: '1', towards: 'Leclerc', relation: 6951328, version: 28, operatorUrl: ddd, landmarkKind: 'platform',
    ways: [108059458,1097940661], markers: [4323838512,4363242544] },
  { id: 'ddd-1-sahm', family: 'ddd', line: '1', towards: 'Leclerc', relation: 6951328, version: 28, operatorUrl: ddd, landmarkKind: 'platform',
    ways: [518366662,411081524,441226525,441232792,108821782], markers: [4666430960,4666430958,...medina] },
  { id: 'ddd-4-medina', family: 'ddd', line: '4', towards: 'Leclerc', relation: 7203970, version: 10, operatorUrl: ddd, landmarkKind: 'platform',
    ways: [108821782], markers: medina },
  { id: 'ddd-4-gueule-tapee', family: 'ddd', line: '4', towards: 'Liberté 5', relation: 6990830, version: 16, operatorUrl: ddd, landmarkKind: 'platform',
    ways: [25860686,430812008,162751424,476073360], markers: [4666430949,4666430952,4666430954,4666430956,4754647802,4754647804,4754647805] },
  // The official Petersen-bound description, the identified route ways and
  // archive occurrence order corroborate THIS street only. The relation has
  // NO stop members. These are physical road junctions, not boarding points.
  { id: 'aftu-40-maristes', family: 'aftu', line: '40', towards: 'Petersen', relation: 3982642, version: 25, operatorUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-40/',
    landmarkKind: 'road-limit', ways: [581409738,-27811399], markers: [305375476,3403676386] },
]
