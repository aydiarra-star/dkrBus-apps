/**
 * Compréhension du wolof parlé à Dakar — module local, sans service externe.
 *
 * Problème à résoudre : un usager pose sa question à l'oral en wolof. Les moteurs
 * de reconnaissance vocale du navigateur ne transcrivent pas le wolof ; ils rendent
 * donc une phrase wolof **écrite avec l'orthographe du français** (« naka laay def
 * ngir dem garou dakar »). Ce module fait le pont :
 *
 * 1. un repli phonétique appliqué aux deux écritures (wolof standard et rendu
 *    français) ramène « ndakaaru », « Dakar », « garou » et « gare » aux mêmes
 *    formes comparables ;
 * 2. des marqueurs lexicaux wolof non ambigus identifient l'intention (trajet,
 *    arrêt le plus proche, endroit où monter, correspondance, tarif, fréquence,
 *    dernier départ, salutation, remerciement) ;
 * 3. les lieux sont résolus **uniquement** dans le référentiel des arrêts : un
 *    lieu non trouvé n'est pas deviné, il est nommé et la réponse le dit.
 *
 * Emprunts assumés : « gare », « station », « tarif », « correspondance » sont des
 * mots français courants à Dakar. Ils ne suffisent jamais à déclarer une phrase
 * wolof (sinon tout énoncé français sur le train serait classé wolof) ; ils
 * comptent seulement à côté d'un marqueur wolof.
 *
 * Limites : le wolof est une langue à variantes, d'orthographe non uniforme. Ces
 * règles couvrent les formules courantes de déplacement, pas une grammaire
 * complète. Une phrase hors couverture retombe sur une réponse qui explique ce qui
 * manque — jamais sur une invention.
 */

import { ALL_CORRIDOR_STOPS, networkOfStopId, type CorridorStop } from './corridors'

export type WolofIntent =
  | 'journey'
  | 'nearest_stop'
  | 'where_to_board'
  | 'transfers'
  | 'fare'
  | 'frequency'
  | 'last_departure'
  | 'network_coverage'
  | 'offline'
  | 'greeting'
  | 'thanks'
  | 'unknown'

export type WolofCriterion = 'speed' | 'walking' | 'transfers' | 'price'
export type WolofDayPart = 'matin' | 'midi' | 'apres_midi' | 'soir' | 'nuit'

export interface WolofUnderstanding {
  /** La phrase contient au moins un marqueur wolof non ambigu. */
  wolof: boolean
  confidence: 'high' | 'medium' | 'low'
  intent: WolofIntent
  /** Noms des lieux du référentiel reconnus, dans l'ordre d'énonciation. */
  placeNames: string[]
  originText: string | null
  destinationText: string | null
  /** Lieu visé par une question sans départ/destination (« où prendre le BRT »). */
  focusText: string | null
  criterion: WolofCriterion | null
  dayPart: WolofDayPart | null
  tomorrow: boolean
  /** Réseau cité explicitement (ter, brt, ddd, aftu, tata). */
  network: string | null
  lineCode: string | null
  /** La phrase dit « d'ici / ma position » : le départ vient de l'appareil, pas d'un lieu cité. */
  originFromSelf: boolean
  tokens: string[]
}

const VOWEL_PAIRS = ['aa', 'ee', 'ii', 'oo', 'uu'] as const

/**
 * Repli phonétique : les deux écritures (wolof standard et transcription
 * française approximative) sont réduites à une forme commune. Chaque règle est
 * une équivalence de prononciation, pas une suppression arbitraire.
 */
export function foldWolof(value: string): string {
  let folded = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  folded = folded
    .replace(/kh/g, 'k')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'k')
    .replace(/c([aou])/g, 'k$1')
    .replace(/gn/g, 'ny')
    .replace(/gh/g, 'g')
    .replace(/ph/g, 'f')
    .replace(/ou/g, 'u')
    .replace(/z/g, 's')
    .replace(/h/g, '')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/y/g, 'i')
  for (const pair of VOWEL_PAIRS) folded = folded.split(pair).join(pair[0])
  return folded.replace(/\s+/g, ' ').trim()
}

/** Marqueurs wolof non ambigus : leur présence classe la phrase en wolof. */
const WOLOF_STRONG = [
  'naka', 'naka laa', 'nanga', 'maay', 'laay', 'la ngi', 'maa ngi',
  'def', 'ngir', 'yeeg', 'wac', 'jege', 'gen a jege', 'naata', 'ñaata',
  'xaalis', 'njar', 'njarij', 'waxtu', 'saasi', 'suba', 'tast', 'gams',
  'jimran', 'keroob', 'egg', 'joge', 'dem', 'soppi', 'baax', 'deedet',
  'amul', 'am na', 'xam', 'xamaa', 'xamuma', 'soxla', 'fan', 'waaw',
  'jerejef', 'jerëjef', 'noppal', 'noppali', 'yoon', 'tey', 'chend',
  'cinde', 'sunu', 'wax', 'waxal', 'leegi', 'dinaa', 'dinga', 'naka def',
  'gën a', 'nu ngi', 'ñu ngi', 'war na', 'mën na', 'lu tax', 'ndax',
  'lan la', 'mujj', 'bu mujj', 'ci kanam', 'firo', 'wut',
]

/** Emprunts français courants : comptent seulement avec un marqueur wolof. */
const WOLOF_CONTEXTUAL = [
  'gare', 'garu', 'station', 'eskal', 'arret', 'correspondance', 'tarif',
  'ticket', 'horari', 'minit', 'bus', 'ligne', 'quartier',
]

const NETWORK_MENTIONS: readonly { id: string; patterns: readonly string[] }[] = [
  { id: 'ter', patterns: ['ter', 'train', 'senter', 'seter'] },
  { id: 'brt', patterns: ['brt', 'sunubrt', 'b1', 'b2', 'b3'] },
  { id: 'ddd', patterns: ['ddd', 'dikk'] },
  { id: 'aftu', patterns: ['aftu'] },
  { id: 'tata', patterns: ['tata'] },
]

/**
 * Exonymes et formes parlées, résolus vers un arrêt du référentiel.
 * La valeur est l'identifiant d'arrêt ; rien n'est ajouté au référentiel.
 */
/**
 * Formes comprises (exonymes wolof, transcriptions approximatives) vers un arrêt
 * du référentiel. Exportée pour que l'aide et les tests listent exactement ce
 * qui est reconnu — aucune de ces formes n'ajoute un lieu au référentiel.
 */
export const PLACE_ALIASES: Readonly<Record<string, string>> = {
  'garu ndakaaru': 'ter-dakar',
  'gare ndakaaru': 'ter-dakar',
  'garu dakar': 'ter-dakar',
  'ndakaaru': 'ter-dakar',
  'pikiin': 'ter-pikine',
  'pikeen': 'ter-pikine',
  'tiarooj': 'ter-thiaroye',
  'caryot': 'ter-thiaroye',
  'baux maraichers': 'ter-baux-maraichers',
  'marasye': 'ter-baux-maraichers',
  'keur mbai fal': 'ter-mbao',
  'keur masar': 'ddd-keur-massar',
  'masar': 'ddd-keur-massar',
  'bargni': 'ter-bargny',
  'diamniaw': 'ter-diamniadio',
  'peterseun': 'brt-petersen',
  'petersen': 'brt-petersen',
  'guediaway': 'brt-prefecture-guediawaye',
  'gediawi': 'brt-prefecture-guediawaye',
  'palis aseni': 'brt-parcelles',
  'aseni': 'brt-parcelles',
  'gran yof': 'ddd-grand-yoff',
  'walam': 'ddd-ouakam',
  'almapi': 'ddd-almadies',
  'almadi': 'ddd-almadies',
  'ger yaala': 'brt-khar-yallah',
  'liberte': 'brt-liberte-6',
  'leklerc': 'ddd-leclerc',
  'medina': 'brt-grand-medine',
  'gooltape': 'brt-gueule-tapee',
  'grand medine': 'brt-grand-medine',
}

/** Lieux reconnus dans la phrase, par ordre d'apparition.
 *  Le premier énoncé est traité comme le départ, le dernier comme la destination. */
/** Un lieu peut être partagé par plusieurs réseaux : la clé est regroupée avec
 *  tous les arrêts qui la portent, et le choix se fait à la reconnaissance. */
const PLACE_KEYS: readonly { key: string; stops: CorridorStop[] }[] = (() => {
  const byKey = new Map<string, CorridorStop[]>()
  const push = (key: string, stop: CorridorStop) => {
    if (!key || key.length < 4) return
    const list = byKey.get(key) ?? []
    if (!list.some((entry) => entry.id === stop.id)) list.push(stop)
    byKey.set(key, list)
  }
  for (const stop of ALL_CORRIDOR_STOPS) {
    push(foldWolof(stop.name), stop)
    if (stop.shortName) push(foldWolof(stop.shortName), stop)
    for (const alias of stop.aliases) push(foldWolof(alias), stop)
  }
  for (const [alias, stopId] of Object.entries(PLACE_ALIASES)) {
    const stop = ALL_CORRIDOR_STOPS.find((candidate) => candidate.id === stopId)
    if (stop) push(foldWolof(alias), stop)
  }
  // Les formes longues d'abord : « parcelles assainies » avant « parcelles ».
  return [...byKey.entries()].map(([key, stops]) => ({ key, stops })).sort((a, b) => b.key.length - a.key.length)
})()

const NETWORK_PRIORITY = ['ter', 'brt', 'ddd', 'aftu', 'tata'] as const

/** Un même quartier est enregistré sur plusieurs réseaux : on retient l'arrêt du
 *  réseau le mieux documenté (TER, puis BRT), sauf si un réseau est cité. */
function preferredStop(stops: readonly CorridorStop[], preferredNetwork: string | null): CorridorStop | null {
  if (stops.length === 0) return null
  const rank = (stop: CorridorStop): number => {
    const network = networkOfStopId(stop.id)
    if (preferredNetwork && network === preferredNetwork) return -1
    const index = NETWORK_PRIORITY.indexOf(network as (typeof NETWORK_PRIORITY)[number])
    return index < 0 ? NETWORK_PRIORITY.length : index
  }
  return [...stops].sort((a, b) => rank(a) - rank(b))[0]
}

function matches(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

const INTENTS = {
  journey: [/\bdem\b/, /\bngir dem\b/, /\bnaka\b.*\bdem\b/, /\bjoge\b/, /\bitinere\b/, /\btraje\b/, /\bdiminan\b/],
  // Les motifs sont écrits contre la forme réduite : « correspondance » devient
  // « korespondance » sous la folding phonétique, un motif orthographié ne
  // matcherait jamais une phrase wolof.
  transfers: [/\bsoppi\b/, /\bk[oa]rr?[eo]sp\w*/, /\br?[eo]sp[oa]nd\w*/, /\bchanger\b/, /\bwac\b.*\byeg\b/, /\btransfert\b/],
  nearest: [/\bgen a jege\b/, /\bgën a jege\b/, /\bjege\b/, /\bproximite\b/, /\bpres de moi\b/, /\bautour de moi\b/],
  board: [/\bfan\b.*\b(jel|yeg|neg|monte|prendre)\b/, /\bfi nu (jel|yeg)\b/, /\bo(u|ù) (prendre|monter)\b/, /\b(arret|station|eskal)\b.*\b(fan|ou|u)\b/, /\bfan la\b/],
  // Le tarif exige un mot explicite de prix : « ñaata » seul peut porter sur une
  // fréquence ou une distance, et classer ces questions en tarif serait une
  // réponse à côté.
  fare: [/\bnjarij\b/, /\bnjar\b/, /\bxaalis\b/, /\btarif\b/, /\bprix\b/, /\bticket\b/, /\bfrancs?\b/, /\bcout\w*/, /\bcombien (ça )?coute/],
  frequency: [/\bminit\b/, /\bfre[kc]u?e?n[sc]e?\b/, /\bcadence\b/, /\bwaxtu\b/, /\bsaasi\b/, /\bheure\b/, /\bdans combien\b/, /\binterval\w*/],
  lastDeparture: [/\bdernier\b/, /\bmuj\w*/, /\bfin de service\b/, /\bderniere\b/, /\bderniere course\b/],
  coverage: [/\bxam\b.*\brezo\b/, /\bmemoire\b/, /\bque savez\b/, /\bconnais\b/, /\bque sais\b/],
  offline: [/\bhors ligne\b/, /\bsans connexion\b/, /\boffline\b/, /\bmode avion\b/],
  greeting: [/\bnanga\b/, /\bnanga def\b/, /\bsalaam\b/, /\bsalam\b/, /\bbonjour\b/, /\bsalut\b/, /\bsubac?\b(?!.*\bdem\b)/],
  thanks: [/\bjerejef\b/, /\bjerëjef\b/, /\bmerci\b/, /\bnoppali\b/, /\bnoppal\b/],
} as const

const CRITERIONS = {
  speed: [/\bgën a (yagg|yaag|gaw|geg)\b/, /\bgen a (yag|gaw|geg)\b/, /\bplus rapide\b/, /\ble plus court\b/, /\bvyt\b/],
  walking: [/\bdox\b.*\bfuf\b/, /\bfuf\b.*\bdox\b/, /\bmoins de marche\b/, /\bmoins marcher\b/],
  // « amul soppi » (aucune correspondance) est une demande explicite de trajet
  // direct, pas une simple mention de correspondance.
  transfers: [/\bsoppi\b.*\bfuf\b/, /\bfuf\b.*\bsoppi\b/, /\bamul soppi\b/, /\bmoins de correspondance\b/, /\bsans correspondance\b/],
  price: [/\bxaalis\b.*\bfuf\b/, /\bmoins cher\b/, /\bpas cher\b/, /\bbon marche\b/],
} as const

const DAY_PARTS: readonly { part: WolofDayPart; patterns: readonly RegExp[] }[] = [
  { part: 'matin', patterns: [/\bsubac?\b/, /\bmatinee\b/, /\bmatin\b/] },
  { part: 'midi', patterns: [/\btast\b/, /\bmidi\b/] },
  { part: 'apres_midi', patterns: [/\bgams\b/, /\bapres midi\b/] },
  { part: 'soir', patterns: [/\bjimran\w*/, /\bsoir\b/] },
  { part: 'nuit', patterns: [/\bkeroob\b/, /\bnuit\b/] },
]

const TOMORROW_PATTERN = /\b(chende|chendeh|guinor|tomorrow|demain)\b/

/** Lieux du référentiel cités dans une phrase réduite, avec leur position. */
export function wolofPlaceSpans(folded: string, preferredNetwork: string | null = null): { at: number; to: number; stop: CorridorStop }[] {
  // Les clés sont triées de la plus longue à la plus courte : une forme courte
  // comprise dans une forme déjà reconnue (« parcelles » dans « parcelles
  // assainies ») ne crée pas un second lieu.
  const groups: { at: number; from: number; to: number; stops: CorridorStop[] }[] = []
  for (const entry of PLACE_KEYS) {
    const at = folded.indexOf(entry.key)
    if (at < 0) continue
    const to = at + entry.key.length
    if (groups.some((group) => at < group.to && to > group.from)) continue
    groups.push({ at, from: at, to, stops: entry.stops })
  }
  return groups
    .sort((a, b) => a.at - b.at)
    .map((group) => ({ at: group.at, to: group.to, stop: preferredStop(group.stops, preferredNetwork)! }))
    .filter((entry) => entry.stop)
}

/** Lieux du référentiel cités dans une phrase déjà réduite. */
export function wolofPlaceMentions(folded: string, preferredNetwork: string | null = null): CorridorStop[] {
  return wolofPlaceSpans(folded, preferredNetwork).map((entry) => entry.stop)
}

// Les indices de rôle sont cherchés avant chaque lieu, dans la fenêtre de mots
// qui le précède : « aller à Dakar, je suis à Keur Mbaye Fall » ne se lit pas
// dans l'ordre des lieux mais selon ces repères.
const ORIGIN_CUES = /\b(?:joge|jóge|depuis|je suis a|je pars de|beug a joge|partir de|goodiu ci)\b/
const DESTINATION_CUES = /\b(?:dem|gis|vers|aller a|rejoindre|arriver a|a la|bis)\b/
const CUE_WINDOW = 26

function roleOfMention(folded: string, at: number): 'origin' | 'destination' | 'neutral' {
  const before = folded.slice(Math.max(0, at - CUE_WINDOW), at)
  const originAt = before.search(ORIGIN_CUES)
  const destinationAt = before.search(DESTINATION_CUES)
  if (originAt >= 0 && originAt > destinationAt) return 'origin'
  if (destinationAt >= 0) return 'destination'
  return 'neutral'
}

/** Départ et destination tels que la phrase les assigne, jamais devinés. */
export function wolofJourneyEndpoints(folded: string, preferredNetwork: string | null = null): { origin: CorridorStop | null; destination: CorridorStop | null } {
  const entries = wolofPlaceSpans(folded, preferredNetwork)
    .map((entry) => ({ ...entry, role: roleOfMention(folded, entry.at) }))
  if (entries.length === 0) return { origin: null, destination: null }
  if (entries.length === 1) {
    const only = entries[0]!
    // Un lieu unique avec un indice de départ reste un départ : la réponse
    // demandera la destination. Sans indice, il s'agit de la destination visée.
    return only.role === 'origin' ? { origin: only.stop, destination: null } : { origin: null, destination: only.stop }
  }
  const originEntry = entries.find((entry) => entry.role === 'origin') ?? null
  const destinationEntry = [...entries].reverse().find((entry) => entry.role === 'destination' && entry.stop !== originEntry?.stop) ?? null
  const origin = originEntry?.stop ?? entries[0]!.stop
  const destination = destinationEntry?.stop ?? [...entries].reverse().find((entry) => entry.stop !== origin)?.stop ?? null
  return { origin, destination }
}

export function understandWolof(question: string): WolofUnderstanding {
  const folded = foldWolof(question)
  const tokens = folded.split(' ').filter(Boolean)
  const strongHits = WOLOF_STRONG.filter((marker) => (marker.includes(' ') ? folded.includes(marker) : tokens.includes(foldWolof(marker))))
  const contextualHits = WOLOF_CONTEXTUAL.filter((marker) => folded.includes(foldWolof(marker)))
  const wolof = strongHits.length > 0
  const confidence: WolofUnderstanding['confidence'] = strongHits.length >= 3 ? 'high' : strongHits.length >= 1 && (strongHits.length + contextualHits.length) >= 2 ? 'medium' : strongHits.length >= 1 ? 'medium' : 'low'

  const network = NETWORK_MENTIONS.find((candidate) => candidate.patterns.some((pattern) => new RegExp(`\\b${pattern}\\b`).test(folded)))?.id ?? null
  const places = wolofPlaceMentions(folded, network)
  const lineCode = /\b(?:lig[n]?|ligne|bus|numero|nimero)\s*0*(\d{1,3}[a-z]?)\b/.exec(folded)?.[1]?.toUpperCase() ?? null

  const saysJourney = matches(folded, INTENTS.journey)
  let intent: WolofIntent = 'unknown'
  if (matches(folded, INTENTS.greeting) && tokens.length <= 4 && !saysJourney) intent = 'greeting'
  else if (matches(folded, INTENTS.thanks) && tokens.length <= 5 && !saysJourney) intent = 'thanks'
  else if (saysJourney && (places.length >= 2 || matches(folded, [/\bnaka\b/, /\bjoge\b/]))) intent = 'journey'
  else if (matches(folded, INTENTS.transfers)) intent = 'transfers'
  else if (matches(folded, INTENTS.nearest) && !matches(folded, INTENTS.board)) intent = 'nearest_stop'
  else if (matches(folded, INTENTS.board)) intent = 'where_to_board'
  else if (matches(folded, INTENTS.lastDeparture)) intent = 'last_departure'
  else if (matches(folded, INTENTS.frequency)) intent = 'frequency'
  else if (matches(folded, INTENTS.fare)) intent = 'fare'
  else if (matches(folded, INTENTS.offline)) intent = 'offline'
  else if (matches(folded, INTENTS.coverage)) intent = 'network_coverage'
  else if (saysJourney || places.length >= 2) intent = 'journey'

  // Motifs écrits contre la forme réduite, y compris « ma fi » (je suis là) et
  // les emprunts français que la reconnaissance vocale rend tels quels.
  const originFromSelf = /\b(?:sama position|sa position|sama posision|fi ma nekk|fii laa nekk|ma fi|ici|je suis ici|sama bereb)\b/.test(folded)
  const criterion = (Object.keys(CRITERIONS) as WolofCriterion[]).find((key) => matches(folded, CRITERIONS[key])) ?? null
  const dayPart = DAY_PARTS.find((entry) => matches(folded, entry.patterns))?.part ?? null

  // Le rôle de chaque lieu suit les mots de la phrase (« je suis à », « dem »),
  // pas leur ordre d'apparition : une réponse dans le sens inverse serait une
  // erreur de trajet, pas une nuance.
  const endpoints = wolofJourneyEndpoints(folded, network)
  const saysOriginOnly = places.length === 1 && /\bjoge\b/.test(folded)
  const origin = intent === 'journey' ? (places.length >= 2 ? endpoints.origin : saysOriginOnly ? places[0] : null) : null
  const destination = intent === 'journey' ? (places.length >= 2 ? endpoints.destination : places.length === 1 && !origin ? places[0] : null) : null
  const focus = intent === 'journey' ? null : places[0] ?? null

  return {
    wolof,
    confidence,
    intent,
    placeNames: places.map((stop) => stop.name),
    originText: origin ? origin.name : null,
    destinationText: destination ? destination.name : null,
    focusText: focus ? focus.name : null,
    criterion,
    dayPart,
    tomorrow: TOMORROW_PATTERN.test(folded),
    network,
    lineCode,
    originFromSelf,
    tokens,
  }
}

/** Arrêts du référentiel qui correspondent à un énoncé wolof ou francisé. */
export function resolveWolofPlace(text: string, preferredNetwork: string | null = null): CorridorStop[] {
  const folded = foldWolof(text)
  if (!folded) return []
  const exact = PLACE_KEYS.filter((entry) => entry.key === folded)
  if (exact.length > 0) {
    return dedupeStops(exact.flatMap((entry) => preferredListOf(entry.stops, preferredNetwork)))
  }
  const contained = PLACE_KEYS.filter((entry) => folded.includes(entry.key))
  if (contained.length > 0) {
    return wolofPlaceMentions(folded, preferredNetwork)
  }
  // Forme partielle : seulement si l'énoncé est assez long pour ne rien faire
  // collider avec la moitié de la ville (« dak » ne doit rien résoudre).
  if (folded.length >= 5) {
    const partial = PLACE_KEYS.filter((entry) => entry.key.includes(folded)).flatMap((entry) => entry.stops)
    if (partial.length > 0) return dedupeStops(partial)
  }
  return []
}

function preferredListOf(stops: readonly CorridorStop[], preferredNetwork: string | null): CorridorStop[] {
  const preferred = preferredStop(stops, preferredNetwork)
  return preferred ? [preferred] : []
}

function dedupeStops(stops: readonly CorridorStop[]): CorridorStop[] {
  const seen = new Set<string>()
  const out: CorridorStop[] = []
  for (const stop of stops) {
    if (seen.has(stop.name)) continue
    seen.add(stop.name)
    out.push(stop)
  }
  return out
}

/** Signal de langue, utilisé par la détection FR/WO et par la voix. */
export function wolofSignal(text: string): { score: number; markers: string[] } {
  const folded = foldWolof(text)
  const tokens = folded.split(' ').filter(Boolean)
  const markers = WOLOF_STRONG.filter((marker) => (marker.includes(' ') ? folded.includes(marker) : tokens.includes(foldWolof(marker))))
  return { score: markers.length, markers }
}

export const WOLOF_HELP_TEXT =
  'Mën naa la tontu ci wolof walla ci français. Mbindal walla waxal : « naka laay def ngir dem Gare de Dakar », « station BRT bi gën a jege », « ñaata la tarif bi », « lan la correspondance à Petersen ».'

/** Traduction lisible des intentions, pour l'aide et les réponses courtes. */
export const INTENT_LABELS: Record<WolofIntent, string> = {
  journey: 'Yoon (itinéraire)',
  nearest_stop: 'Arrêt bi gën a jege',
  where_to_board: 'Fan nga wara yég',
  transfers: 'Correspondance',
  fare: 'Tarif',
  frequency: 'Fréquence',
  last_departure: 'Dernier départ',
  network_coverage: 'Li ma xam',
  offline: 'Hors ligne',
  greeting: 'Salaam',
  thanks: 'Jërëjëf',
  unknown: 'Laaj bu leerul',
}
