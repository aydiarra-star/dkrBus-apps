import mobilityLines from '../data/mobility-lines.json'
import tataLines from '../data/tata-lines.json'

/**
 * Catalogue public des lignes à intégrer aux tableaux de passage par arrêt.
 * Ce registre identifie les lignes et leurs terminus ; il ne prétend pas fournir
 * les séquences d'arrêts ni des horaires de passage. Ceux-ci sont ajoutés
 * uniquement lorsqu'une source exploitable les documente.
 */
export interface PublicBusLineReference {
  line: string
  origin: string
  destination: string
  sourceUrl: string
  sourceLabel: string
  network: 'ddd' | 'aftu' | 'tata'
}

const aftuSource = 'https://aftu-senegal.org/infos-pratiques/'
const dddSource = 'https://demdikk.sn/info-voyageurs/'

export const AFTU_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = [
  ['1','Lat Dior','HLM Grand Yoff'],
  ['2','Route principale Parcelles','Petersen'],
  ['3','Yoff','Petersen'],
  ['4','Yoff Village','Petersen'],
  ['5','Parcelles Assainies','Petersen'],
  ['24','UCAD','Notaire Guédiawaye'],
  ['25','Parcelles Assainies','Petersen'],
  ['26','Parcelles Assainies','Poste Thiaroye'],
  ['27','Marché Boubess','Petersen'],
  ['28','Hamo V/VI','Petersen'],
  ['29','Cité Nations Unies (Cambérène)','Petersen'],
  ['30','Gadaye (Guédiawaye)','Gare de Colobane'],
  ['31','Tally Icotaf × Route des Niayes','Hôpital Abass Ndao'],
  ['32','Sahm','Serigne Assane'],
  ['33','Colobane','Serigne Assane'],
  ['34','Nord Foire','Lat Dior'],
  ['35','Ngor','Pikine Texaco'],
  ['36','Marché Ndiarème','Ngor'],
  ['37','Cité APIX','UCAD (Claudel)'],
  ['38','Cité des Enseignants','Sahm'],
  ['39','Lat Dior','Diamalaye'],
  ['40','Grand Mbao','Petersen'],
  ['41','Petersen','Étage Madiale'],
  ['42','Gadaye (Guédiawaye)','Ouakam Baye'],
  ['43','Ouakam','Thierno Ndiaye'],
  ['44','Grand Mbao','Ouakam'],
  ['45','Kounoune Ngalam','Parcelles Église'],
  ['46','SDE Serigne Assane','Lat Dior'],
  ['47','Lat Dior','Almadies'],
  ['48','Cité Serigne Mansour','Lat Dior'],
  ['49','Gadaye','Ngor'],
  ['50','Petersen','Malika Cimetière'],
  ['51','Jaxaay','Gare des Baux Maraîchers'],
  ['52','Bountou Pikine','Keur Massar'],
  ['53','Keur Massar','SébiKotane'],
  ['54','Keur Massar (Cité MTOA)','UCAD'],
  ['55','Rufisque Sonadis','Petersen'],
  ['56','Jaxaay 2','Petersen'],
  ['57','Liberté 6','Rufisque'],
  ['58','Sahm','Comico'],
  ['59','Diamalaye','Cité Gendarmerie (Jaxaay)'],
  ['60','Colobane','Bargny'],
  ['61','Almadies','Keur Massar'],
  ['62','Arrêt Chérif (Rufisque)','Penc Mi (Gueule Tapée)'],
  ['63','Camp Marchand Rufisque','Stade LSS'],
  ['64','Guédiawaye','Rufisque'],
  ['65','Colobane','Jaxaay'],
  ['66','Yoff','Gorom 1'],
  ['67','Ouakam','Thiawlène Rufisque'],
  ['68','Yeumbeul','SébiKotane'],
  ['69','Diamalaye','Terminus Tivaouane Peul'],
  ['70','Daroukhane','Jaxaay 2'],
  ['71','Keur Massar','Claudel'],
  ['72','Guédiawaye','Kounoune'],
  ['73','Lac Rose','Poste Thiaroye'],
  ['74','Bargny (gare ferroviaire)','Tivaouane Peul'],
  ['75','Malika (Cité Sonatel)','Gare routière Colobane'],
  ['76','Sipres','Cité Assurance'],
  ['77','Rufisque','Liberté 5'],
  ['78','Diamaguène','Liberté 5'],
  ['79','Sangalkam','Cambérène'],
  ['80','Diamalaye','Darou Thioub'],
  ['81','Cité Tawfeex (Tivaouane Peul)','Baux Maraîchers'],
  ['82','Lat Dior','Comico Yeumbeul'],
  ['83','Rufisque Arafat','Zone de Captage'],
  ['84','Jaxaay 2','UCAD'],
  ['85','Banoba','Liberté 5'],
  ['86','Tournalou Boune','Toubab Dialaw'],
  ['87','Bambilor','Mosquée Massalikou Djinane'],
  ['88','MTOA','Liberté 5'],
  ['89','Bargny','Croisement Niague (Cité SICAP)'],
  ['91','APIX','Dougar'],
].map(([line, origin, destination]) => ({
  line, origin, destination, network: 'aftu' as const,
  sourceUrl: aftuSource, sourceLabel: 'AFTU Sénégal · Infos pratiques',
}))

/** Lignes visibles dans l'information voyageurs officielle DDD (urbaines,
 * banlieue et dessertes de gares). Les suffixes A/B sont conservés. */
export const DDD_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = [
  ['1','Parcelles Assainies','Place Leclerc'],
  ['2','Daroukhane','Place Leclerc'],
  ['4','Liberté 5','Place Leclerc'],
  ['5','Guédiawaye','Palais 1'],
  ['6','Cambérène 2','Palais 2'],
  ['7','Ouakam','Palais 2'],
  ['8','Aéroport LSS','Palais 2'],
  ['9','Liberté 6','Palais 2'],
  ['10','Liberté 5','Palais 2'],
  ['11','Keur Massar','Lat Dior'],
  ['12','Guédiawaye','Palais 1'],
  ['13','Liberté 5','Palais 2'],
  ['TO1','Ouakam','Palais 2'],
  ['15A','Rufisque','Palais 1'],
  ['15B','Rufisque','Palais 1'],
  ['16A','Malika','Palais 1'],
  ['16B','Malika','Palais 1'],
  ['18','Dieuppeul','Centre-ville'],
  ['20','Dieuppeul','Centre-ville'],
  ['23','Parcelles Assainies','Palais 1'],
  ['121','Scat Urbam','Leclerc'],
  ['208','Bayakh','Rufisque'],
  ['213','Rufisque','Dieuppeul'],
  ['217','Thiaroye','Ouakam'],
  ['218','Thiaroye','Aéroport LSS'],
  ['219','Daroukhane','Ouakam'],
  ['220','Rufisque','Guédiawaye'],
  ['221','Gadaye','Almadies'],
  ['227','Keur Massar','Parcelles Assainies'],
  ['228','Rufisque','Yenne'],
  ['232','Baux Maraîchers','Aéroport LSS'],
  ['233','Baux Maraîchers','Palais 1'],
  ['234','Jaxaay','Leclerc'],
  ['501','Port De Dakar','Terminus Palais 2'],
  ['502A','Colobane','UCAD'],
  ['502B','Colobane','Abass Ndao'],
  ['503A','Colobane','Môle 8'],
  ['503B','Colobane','Hydrocarbure'],
  ['504A','Gare Diamniadio','Sphère ministérielle'],
  ['504B','Sébikotane','Gare Diamniadio'],
  ['319','Liberté 6','Ouakam'],
].map(([line, origin, destination]) => ({
  line, origin, destination, network: 'ddd' as const,
  sourceUrl: line === '501' ? 'https://demdikk.sn/v2appmobile/' : dddSource,
  sourceLabel: line === '501' ? 'Application mobile DDD · capture fournie et séquence validée par le responsable du projet' : 'Dakar Dem Dikk · Info voyageurs',
}))


const tataSource = 'https://momove.app/guide'

/**
 * Lignes explicitement indexées comme TATA à Dakar par MoMove
 * (graphe de transport mis à jour le 09/06/2026). La ligne 77 est corrigée
 * depuis le document tarifaire TATA de juillet 2020 : Rufisque Cité Tacco–Liberté 5.
 * Ce catalogue est distinct de l'AFTU : les terminus sont des données de parcours, pas des horaires.
 */
export const TATA_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = [
  ['3','Yoff-Village','Petersen'],
  ['1','Sandaga','Sud Foire'],
  ['2','Parcelles','Petersen'],
  ['4','Petersen','Yoff'],
  ['5','Parcelles','Sandaga'],
  ['24','Guédiawaye','Université'],
  ['25','Parcelles','Petersen'],
  ['26','Parcelles','Thiaroye'],
  ['27','Guédiawaye','Petersen'],
  ['28','Gadaye','Lat Dior'],
  ['29','Cambérène','Petersen'],
  ['30','Colobane','Gadaye'],
  ['31','Pikine','SHAM'],
  ['32','Guédiawaye','SHAM'],
  ['33','Colobane','Guédiawaye'],
  ['34','Lat Dior','Yoff'],
  ['35','Ngor','Pikine'],
  ['36','Guédiawaye','Ngor'],
  ['37','APIX','UCAD'],
  ['38','Cité Enseignant','Sandaga'],
  ['39','Lat-Dior','Diamalaye'],
  ['40','Jaxaay','Petersen'],
  ['41','Guédiawaye','Rebeuss'],
  ['42','Gadaye','Ouakam Bayé'],
  ['43','Ouakam','Thiaroye'],
  ['44','Mbao','Ouakam'],
  ['46','Guédiawaye','Rebeuss'],
  ['48','Kounoune','Sandaga'],
  ['49','Guédiawaye','Ngor'],
  ['50','Malika','Petersen'],
  ['51','Baux Maraîchers','Terminus non précisé'],
  ['52','Baux Maraîchers','Jaxaay'],
  ['53','Keur Massar','Sébikotane'],
  ['54','Cité Sotrac','Fann'],
  ['55','Petersen','Rufisque'],
  ['56','Keur Massar','Petersen'],
  ['57','Liberté 6','Rufisque'],
  ['58','Comico','SHAM'],
  ['59','Cité Gendarmerie Keur Massar','Diamalaye'],
  ['60','Bargny','Colobane'],
  ['61','Keur Massar','Mamelles'],
  ['62','Médina','Rufisque'],
  ['63','Diamalaye','Terminus non précisé'],
  ['65','Colobane','Kounoune'],
  ['66','Ngorom','Yoff'],
  ['67','Ouakam','Rufisque'],
  ['68','Bargny','Yeumbeul'],
  ['69','Parcelles Assainies','Terminus non précisé'],
  ['70','Diakhaye','Guédiawaye'],
  ['71','Fann Hock','Keur Massar'],
  ['72','Guédiawaye','Kounoune'],
  ['73','Lac Rose','Thiaroye'],
  ['74','Bargny','Tivaouane Peulh'],
  ['75','Colobane','Malika'],
  ['76','Sipresse','Terminus non précisé'],
  ['77','Rufisque Cité Tacco','Liberté 5'],
  ['78','Liberté 5','Terminus non précisé'],
  ['79','Cambérène','Sangalkam'],
  ['80','Darou Thioub','Diamalaye'],
  ['81','Baux Maraîchers','Cité Tawfekh'],
  ['82','Rebeuss','Yeumbeul'],
  ['84','Jaxaay','UCAD'],
].map(([line, origin, destination]) => ({
  line, origin, destination, network: 'tata' as const,
  sourceUrl: line === '77' ? 'https://cafeactu.com/wp-content/uploads/2020/07/TARIFICATION-DES-LIGNES.pdf' : tataSource,
  sourceLabel: line === '77' ? 'Document tarifaire TATA · juillet 2020' : 'MoMove · lignes TATA à Dakar · 09/06/2026',
}))

/** Les séquences détaillées sont la référence la plus complète pour chaque réseau. */
export const AFTU_DETAILED_PUBLIC_LINES: readonly PublicBusLineReference[] = (mobilityLines as unknown as { network: string; code: string; origin: string; destination: string; sourceUrl: string }[])
  .filter((line) => line.network === 'aftu')
  .map((line) => ({
    line: line.code,
    origin: line.origin,
    destination: line.destination,
    network: 'aftu',
    sourceUrl: line.sourceUrl,
    sourceLabel: 'AFTU · itinéraire détaillé du référentiel',
  }))

export const TATA_DETAILED_PUBLIC_LINES: readonly PublicBusLineReference[] = (tataLines as unknown as { code: string; origin: string; destination: string; sourceUrl: string }[])
  .map((line) => ({
    line: line.code,
    origin: line.origin,
    destination: line.destination,
    network: 'tata',
    sourceUrl: line.sourceUrl,
    sourceLabel: 'TATA · itinéraire détaillé du référentiel',
  }))

/** Les lignes TATA sans séquence détaillée restent visibles depuis le catalogue public. */
export const TATA_PUBLIC_FALLBACK_LINES: readonly PublicBusLineReference[] = TATA_PUBLIC_LINE_CATALOG
  .filter((line) => !TATA_DETAILED_PUBLIC_LINES.some((detailed) => detailed.line === line.line))

function normalizeRouteEndpoint(value: string): string {
  return value.replace(/\([^)]*\)/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\bsebikhotane\b/g, 'sebikotane').replace(/\bterminus\b/g, ' ').replace(/\b(rond[ -]?point|giratoire)\b/g, ' ').replace(/\broute principale\b/g, ' ').replace(/\b(gare|des)\b/g, ' ').replace(/\bucad\b/g, 'universite cheikh anta diop').replace(/\bsham\b/g, 'sahm').replace(/\s+/g, ' ').trim()
}

export function detailedRouteKey(line: { code: string; origin: string; destination: string }): string {
  const ends = [normalizeRouteEndpoint(line.origin), normalizeRouteEndpoint(line.destination)].sort()
  return `${line.code}|${ends[0]}|${ends[1]}`
}

/**
 * Numéros dont les catalogues détaillés AFTU et TATA décrivent le même trajet.
 * Les terminus sont comparés sans accents, parenthèses ni variante « Sébikhotane ».
 * Les collisions de numéro dont les terminus diffèrent ne sont pas fusionnées.
 */
/**
 * Normalise une séquence d'arrêts pour comparer deux fiches détaillées.
 * Les mentions de terminus en tête/fin de fiche AFTU ne sont pas des arrêts
 * intermédiaires et sont retirées avant la comparaison.
 */
function normalizeRouteStop(value: string): string {
  return value.replace(/\\([^)]*\\)/g, ' ').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\\bsebikhotane\\b/g, 'sebikotane').replace(/\\bsham\\b/g, 'sahm').replace(/\\s+/g, ' ').trim()
}

function normalizedRouteStops(stops: readonly string[]): string[] {
  const copy = [...stops]
  if (copy.length && /^terminus\\b/i.test(copy[0].trim())) copy.shift()
  if (copy.length && /^terminus\\b/i.test(copy[copy.length - 1].trim())) copy.pop()
  return copy.map(normalizeRouteStop).filter(Boolean)
}

function sameDetailedStopSequence(a: { waypoints?: readonly string[] }, b: { waypoints?: readonly string[] }): boolean {
  const left = normalizedRouteStops(a.waypoints ?? [])
  const right = normalizedRouteStops(b.waypoints ?? [])
  return left.length > 0 && left.length === right.length && left.every((stop, index) => stop === right[index])
}

/**
 * Un trajet AFTU/TATA n'est partagé que si les terminus ET la séquence ordonnée
 * des arrêts détaillés concordent. Un numéro ou des terminus identiques ne suffisent pas.
 */
export const AFTU_TATA_SHARED_ROUTE_KEYS: ReadonlySet<string> = (() => {
  const shared = new Set<string>()
  const detailedAftu = (mobilityLines as unknown as { network: string; code: string; origin: string; destination: string; waypoints?: string[] }[]).filter((line) => line.network === 'aftu')
  const detailedTata = tataLines as unknown as { network: string; code: string; origin: string; destination: string; waypoints?: string[] }[]
  for (const aftu of detailedAftu) {
    const key = detailedRouteKey(aftu)
    const matchingTata = detailedTata.find((tata) => detailedRouteKey(tata) === key)
    if (matchingTata && sameDetailedStopSequence(aftu, matchingTata)) shared.add(key)
  }
  return shared
})()

/** Alias de compatibilité pour les métriques : un numéro peut porter plusieurs
 *  parcours distincts ; cet ensemble ne sert jamais seul à fusionner des fiches. */
export const AFTU_TATA_SHARED_LINE_CODES: ReadonlySet<string> = new Set(
  [...AFTU_TATA_SHARED_ROUTE_KEYS].map((key) => key.slice(0, key.indexOf('|'))),
)

/**
 * Catalogue d’affichage commun. Les doublons confirmés par les séquences
 * détaillées sont fusionnés même si leurs libellés de terminus varient.
 * Les numéros identiques avec des parcours différents restent distincts.
 * Les catalogues sources originaux restent intacts pour la provenance.
 */
export const AFTU_TATA_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = (() => {
  const merged = new Map<string, PublicBusLineReference>()
  const detailedByNetwork = new Map<string, { waypoints?: string[] }>()
  const detailedRecords = [
    ...(mobilityLines as unknown as { network: string; code: string; origin: string; destination: string; waypoints?: string[] }[]).filter((line) => line.network === 'aftu'),
    ...(tataLines as unknown as { network: string; code: string; origin: string; destination: string; waypoints?: string[] }[]),
  ]
  for (const line of [...AFTU_DETAILED_PUBLIC_LINES, ...TATA_DETAILED_PUBLIC_LINES, ...TATA_PUBLIC_FALLBACK_LINES]) {
    const routeKey = detailedRouteKey({ code: line.line, origin: line.origin, destination: line.destination })
    const shared = AFTU_TATA_SHARED_ROUTE_KEYS.has(routeKey)
    const detail = detailedRecords.find((item) => item.network === line.network && detailedRouteKey(item) === routeKey)
    const sequenceKey = detail?.waypoints?.length ? normalizedRouteStops(detail.waypoints).join('>') : 'no-detail'
    const key = shared ? routeKey : `${line.network}|${routeKey}|${sequenceKey}`
    if (!merged.has(key)) merged.set(key, line)
  }
  return [...merged.values()].sort((a, b) => Number(a.line) - Number(b.line) || a.line.localeCompare(b.line) || a.origin.localeCompare(b.origin))
})()

export const TATA_REFERENCE_POLICY = {
  independentScheduleAvailable: false,
  independentRouteCatalogAvailable: true,
  note: 'Les parcours TATA sont intégrés au catalogue commun AFTU / TATA ; la fréquence de référence est partagée.',
} as const
