/**
 * Modèles de réponse en wolof pour le copilote.
 *
 * HONNÊTETÉ LINGUISTIQUE : ces modèles sont des phrases wolof de base,
 * construites à partir de formules courantes (salutations, direction,
 * proximité, négation). Ils ne couvrent ni toutes les variantes dialectales,
 * ni la grammaire complète. Ils doivent être validés par des locuteurs
 * compétents avant toute mise en avant ; tant que ce n'est pas fait,
 * l'application l'indique et le français reste toujours disponible.
 * Les noms propres (gares, stations, réseaux) ne sont pas traduits.
 */

import type { PlannerLeg } from './planner'
import { formatMeters } from './planner'

export const WOLOF_VALIDATION_NOTE =
  'Modèles wolof de base — en attente de validation par des locuteurs. Le français reste disponible à tout moment.'

export function woGreeting(): string {
  return `Nanga def ! Maa ngi lay dimbali ci sa yoonu Dakar. Xam naa: 13 gares TER, 23 stations BRT, ak 33 arrêts DDD/AFTU/TATA yi nekk ci référaas bi. Laaj ma, dinaa la tontu ci li ma xam dëgg.\n(${WOLOF_VALIDATION_NOTE})`
}

export function woAskOrigin(): string {
  return 'Waxal ma fan nga jóge : « jóge [bërëb] dem [bërëb] ». Xamuma fan nga nekk, te du ko xalaat ci boppam.'
}

export function woUnknownPlace(): string {
  return 'Bërëb boobu amul ci xibaar yi ma am (référaas TER, BRT, DDD, AFTU, TATA). Li ma xamul, dama koy wax ni mu nekk — du ma jum dara.'
}

export function woJourneyHeader(origin: string, destination: string): string {
  return `Yoon wi : ${origin} → ${destination}. Xayma la ci référaas bi (xayma, du horaire bu dëgg, du temps réel).`
}

export function woLeg(leg: PlannerLeg): string {
  switch (leg.kind) {
    case 'walk_access':
    case 'walk_egress':
      return `Dox ba ${leg.to} (${formatMeters(leg.distanceM)}, ~${leg.minutes} minit).`
    case 'walk_direct':
      return `Dox : ${leg.from} → ${leg.to} (${formatMeters(leg.distanceM)}, ~${leg.minutes} minit).`
    case 'walk_transfer':
      return `Wàccal, dem ci ${leg.to} ngir soppi (${formatMeters(leg.distanceM)}, ~${leg.minutes} minit).`
    case 'ride':
      return `Jël ${leg.line?.shortName ?? 'ligne'} : ${leg.from} → ${leg.to} (~${leg.minutes} minit).`
    case 'wait':
      return `Xaar (~${leg.minutes} min).`
    default:
      return leg.from ?? ''
  }
}

export function woTotal(totalMinutes: number, transfers: number): string {
  const transferNote = transfers > 0 ? ` · ${transfers} correspondance(s)` : ''
  return `Lépp : ~${totalMinutes} minit${transferNote}. Tarifs yi : xamuma lépp — du ko wax.`
}

export function woNearestStop(name: string, distanceM: number, networkLabel: string): string {
  return `Bërëbu dem bi gën a jege mooy ${name} (${networkLabel}), ~${distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`} ci sa wet.`
}

export function woNoLocation(): string {
  return 'Xamuma fan nga nekk. Jëfandikool « Me localiser » ci carte bi, walla waxal ma bërëb bu am solo (gare, station, quartier).'
}

export function woHonestLimit(): string {
  return 'Li ma xam : référaas TER, BRT ak arrêts DDD/AFTU/TATA yi ñu bind fii. Grille de fréquence DDD/AFTU/TATA : amul bu ñu publié — estimation la, du dëgg bu nekk. Temps réel ak position bus : amul fii. Du ma jum dara.'
}

/** Préfixe honnête quand une réponse n'existe qu'en français. */
export function woFrenchFallbackPrefix(): string {
  return '(Tontu bii ci français la — modèles wolof yi soxla nañu vérification)\n'
}

/**
 * Réponses wolof construites sur le calcul réel du moteur : mêmes chiffres que
 * l'écran Trajet, mêmes limites énoncées. Les formes numériques restent en
 * chiffres (c'est l'usage dans les messages) et les noms propres ne sont pas
 * traduits.
 */
import type { JourneyOption, JourneyPlan } from './journeyOptions'

export function woMeters(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function woOptionsIntro(plan: JourneyPlan): string {
  const count = plan.options.length
  const head = count === 1
    ? 'Benn yoon rekk la ma mën a xayma ci référaas bi — du ma yokk yeneen ngir feesl.'
    : count === 2
      ? 'Ñaari yoon yu wuute la ma mën a xayma.'
      : `${count} yoon yu wuute la ma mën a xayma :`
  return `Yoon wi : ${plan.originLabel} → ${plan.destinationLabel}. ${head}`
}

export function woOptionLine(option: JourneyOption, index: number): string {
  const lines = option.result.boardedLines.length > 0 ? option.result.boardedLines.join(' + ') : 'dox rekk'
  const parts = [
    `${index + 1}. ${woCriterion(option)}`,
    lines,
    `~${option.metrics.displayMinutes} minit (marge ±${option.result.uncertaintyMinutes} minit)`,
    `dox ${woMeters(option.metrics.walkMeters)}`,
    option.metrics.transfers === 0 ? 'amul soppi' : `${option.metrics.transfers} soppi`,
    option.metrics.fareCfa !== null ? `${option.metrics.fareCfa} F CFA la` : 'tarif: publication amul',
  ]
  return parts.join(' · ')
}

function woCriterion(option: JourneyOption): string {
  switch (option.priority) {
    case 'fastest': return 'Bi gën a gaw'
    case 'fewerTransfers': return 'Bi gën a népp soppi'
    case 'lessWalking': return 'Bi gën a népp dox'
    case 'lowestFare': return 'Bi gën a yéés'
    default: return 'Yoon'
  }
}

export function woLegs(legs: readonly PlannerLeg[]): string {
  return legs.map((leg, index) => `${index + 1}. ${woLeg(leg)}`).join('\n')
}

export function woJourneySteps(option: JourneyOption): string {
  return `${woCriterion(option)} — étape yi:\n${woLegs(option.result.legs)}`
}

export function woFareNote(option: JourneyOption): string {
  if (option.metrics.fareStatus === 'KNOWN') {
    return `Tarif bi : ${option.metrics.fareCfa} F CFA — somme des tickets ci grille yi TER ak BRT ñu publié. Billet combiné amul : war nga ko vérifier ci guichet bi.`
  }
  if (option.metrics.fareStatus === 'PARTIAL') {
    return `Tarif bu matul : ${option.metrics.fareCfa ?? '—'} F CFA la xam, waaye am na ligne bu ñu publiéwul. Du ma wax li ma xamul.`
  }
  return 'Tarif : DDD/AFTU/TATA — amul bu ñu publié ci mémoire bi ; du ma jum prix.'
}

export function woFareGrid(): string {
  return [
    'Tarifs yi ñu publié (référaas, consultation 2026-10-10):',
    '• TER — 2e classe : 500 F CFA (1 zone), 1 000 F CFA (2 zones), 1 500 F CFA (3 zones) ; 1re classe : 2 500 F CFA.',
    '• BRT — 400 F CFA ci benn zone ; 500 F CFA su fekkee nga traversé borne de zone.',
    '• DDD / AFTU / TATA — tarif par ligne : amul bu ñu publié. Laaj ko ci receveur bi.',
    'Billet combiné TER+BRT amul : somme des tickets la. War nga ko vérifier ci guichet bi.',
  ].join('\n')
}

export function woWhereToBoard(networkLabel: string, stopNames: readonly string[]): string {
  if (stopNames.length === 0) {
    return `${networkLabel}: amul arrêt bu nekk ci mémoire bi — du ma wax fan nga wara yég bu ma xamul.`
  }
  return `${networkLabel} — stations ak pôles yi nekk ci référaas bi :\n${stopNames.slice(0, 6).map((name, index) => `${index + 1}. ${name}`).join('\n')}\nWaxal ma sa bërëb ba ma mën a la wax bi gën a jege.`
}

export function woTransfersAt(stopName: string, entries: readonly string[]): string {
  if (entries.length === 0) {
    return `${stopName}: amul correspondance bu ñu déclarer ci référaas bi. Du ma inventé chemin piéton.`
  }
  return `Correspondances à ${stopName} (ci référaas bi):\n${entries.map((entry) => `• ${entry}`).join('\n')}\nDistances yi : positions déclarées lañu joge, du chemin bu ñu mesuré.`
}

export function woFrequency(networkLabel: string, minutes: number, official: boolean): string {
  return official
    ? `${networkLabel}: fréquence officielle ${minutes} minit (06:00–21:00, grille bu exploitant). Du position bus, du temps réel.`
    : `Grille de fréquence : amul bu ñu publié. Modèle bi ${minutes} minit la jël comme estimation — marge bi gën a rëy.`
}

export function woLastDeparture(networkLabel: string, window: string): string {
  return `Fin de service ${networkLabel}: ${window}. Grille de fréquence la, du heure bu train bu nekk.`
}

export function woMissingOrigin(destinationName: string): string {
  return `Xam naa ne nga dem ${destinationName}, waaye xamuma fan nga jóge. Waxal ma : « jóge [bërëb] dem ${destinationName} », wala « Me localiser » ci carte bi.`
}

export function woUnknownPlaces(names: readonly string[]): string {
  return `Bërëb yii amul ci référaas bi : ${names.join(', ')}. Li ma xamul, dama koy wax ni mu nekk — du ma jum trajet.`
}

export function woThanks(): string {
  return 'Jërëjëf ! Su laaj beneen amee, ma ngi fii.'
}

export function woOfflineReady(counts: { stops: number; lines: number; transfers: number; sizeLabel: string }): string {
  return `Paquet hors ligne : ${counts.stops} arrêts, ${counts.lines} lignes, ${counts.transfers} correspondances (${counts.sizeLabel}). Mën nga laaj yoon te internet amul. Carte (tuiles OSM) : connexion la soxla.`
}

export function woOfflineMissing(): string {
  return 'Paquet hors ligne amul fii. Demal Paramètres → Mode hors ligne → « Télécharger le référentiel ».'
}

/** Le départ vient de la position de l'appareil : c'est dit, pas implicite. */
export function woPositionOrigin(stopName: string, distanceM: number): string {
  return `Départ bu joge ci sa position : ${stopName} (${woMeters(distanceM)} lay jege). Sa localisation du laj bu wóor — su fekkee dafa sori, waxal ma bërëb bi nga nekk.`
}

/** Arrêt d'un réseau le plus près de la position de l'appareil. */
export function woNearestBoarding(stopName: string, distanceM: number, lines: readonly string[]): string {
  return `Yég ci ${stopName} — ${woMeters(distanceM)} la jege${lines.length > 0 ? `, lignes ${lines.join(', ')}` : ''}.`
}

export function woPlanNotes(plan: JourneyPlan): string {
  if (plan.notes.length === 0) return ''
  return `Leeral:\n${plan.notes.map((note) => `• ${note}`).join('\n')}`
}
