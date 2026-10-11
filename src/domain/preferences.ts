/**
 * Préférences de l'application — un seul endroit, réellement appliqué.
 *
 * Chaque réglage de l'écran Paramètres a un effet vérifiable :
 * - les modes favoris et le rayon de marche filtrent réellement le graphe exploré
 *   par le calculateur (`journeyOptions.ts`) ;
 * - la vitesse de marche change les durées de marche affichées et calculées ;
 * - la langue pilote les réponses de l'assistant et la voix ;
 * - l'échelle de police, le contraste et la réduction d'animation posent des
 *   variables CSS sur la racine de l'application ;
 * - les unités décident de l'affichage des distances et des durées ;
 * - la confidentialité commande l'appel à la géolocalisation et l'usage du micro ;
 * - le mode hors ligne déclare si le paquet local est prêt (voir `offlinePack.ts`).
 *
 * Rien n'est stocké sur un serveur : `localStorage` de l'appareil uniquement, et
 * une navigation privée sans stockage fonctionne — les réglages restent alors en
 * mémoire pour la session, sans message d'erreur pour l'usager.
 */

import { useSyncExternalStore } from 'react'
import { MOBILITY_IDS, type MobilityId } from './mobilityColors'
import type { AccessRadiusPreset, WalkSpeedPreset } from './assumptions'
import type { FareClass } from './fares'
import type { AssistantLanguagePreference } from './language'

export const PREFERENCES_STORAGE_KEY = 'dakar-bus:preferences:v1'
/** Clé historique de la langue du copilote : lue pour ne rien perdre au passage. */
export const LEGACY_LANGUAGE_KEY = 'dakar-bus:assistant-language'

export type FontScale = 'compact' | 'normal' | 'large' | 'xl'
export type ContrastMode = 'standard' | 'high'
export type DistanceUnits = 'metric' | 'imperial'
export type DurationFormat = 'minutes' | 'hours'
export type GpsMode = 'ask' | 'always' | 'never'

export interface Preferences {
  mobility: {
    networks: Record<MobilityId, boolean>
    walkSpeed: WalkSpeedPreset
    accessRadius: AccessRadiusPreset
    /** Minutes de battement ajoutées à chaque correspondance. */
    transferBufferMin: number
    terClass: FareClass
    showFares: boolean
  }
  language: {
    /** Langue de l'assistant et des réponses vocales. */
    assistant: AssistantLanguagePreference
    /** Libellés de l'interface (français par défaut, wolof en cours de couverture). */
    interface: Extract<AssistantLanguagePreference, 'fr' | 'wo'>
  }
  accessibility: {
    fontScale: FontScale
    contrast: ContrastMode
    voiceGuidance: boolean
    reduceMotion: boolean
    haptics: boolean
    /** Lecture automatique de la première réponse de l'assistant. */
    announceResults: boolean
  }
  units: {
    distance: DistanceUnits
    duration: DurationFormat
    /** Le franc CFA reste la seule devise publiée par les exploitants. */
    currency: 'XOF'
    clock: '24h'
  }
  privacy: {
    gps: GpsMode
    /** Les témoignages « Direct rue » peuvent rester locaux à l'appareil. */
    shareCommunityReports: boolean
    allowMicrophone: boolean
    keepPlaceHistory: boolean
  }
  offline: {
    /** Télécharger le paquet dès la première connexion, sans l'exiger. */
    autoDownload: boolean
  }
}

export const DEFAULT_PREFERENCES: Preferences = {
  mobility: {
    networks: { ter: true, brt: true, ddd: true, aftu: true, tata: true },
    walkSpeed: 'normal',
    accessRadius: 'normal',
    transferBufferMin: 0,
    terClass: 'second',
    showFares: true,
  },
  language: { assistant: 'auto', interface: 'fr' },
  accessibility: {
    fontScale: 'normal',
    contrast: 'standard',
    voiceGuidance: false,
    reduceMotion: false,
    haptics: true,
    announceResults: false,
  },
  units: { distance: 'metric', duration: 'minutes', currency: 'XOF', clock: '24h' },
  privacy: { gps: 'ask', shareCommunityReports: true, allowMicrophone: true, keepPlaceHistory: true },
  offline: { autoDownload: true },
}

export const FONT_SCALE_STEPS: readonly { id: FontScale; label: string; ratio: number }[] = [
  { id: 'compact', label: 'Serré', ratio: 0.92 },
  { id: 'normal', label: 'Normal', ratio: 1 },
  { id: 'large', label: 'Grand', ratio: 1.12 },
  { id: 'xl', label: 'Très grand', ratio: 1.25 },
]

export const WALK_SPEED_CHOICES: readonly { id: WalkSpeedPreset; label: string; detail: string }[] = [
  { id: 'slow', label: 'Marche lente', detail: 'environ 3,3 km/h — pauses et dénivelés compris' },
  { id: 'normal', label: 'Marche normale', detail: 'environ 4,8 km/h — le réglage par défaut' },
  { id: 'fast', label: 'Marche rapide', detail: 'environ 6 km/h' },
]

export const ACCESS_RADIUS_CHOICES: readonly { id: AccessRadiusPreset; label: string; detail: string }[] = [
  { id: 'near', label: 'Autour de moi', detail: 'jusqu’à 700 m à pied d’un arrêt' },
  { id: 'normal', label: 'Standard', detail: 'jusqu’à 1,2 km à pied d’un arrêt' },
  { id: 'wide', label: 'Large', detail: 'jusqu’à 1,8 km à pied d’un arrêt' },
]

export const NETWORK_CHOICE_LABELS: Record<MobilityId, string> = {
  ter: 'TER',
  brt: 'BRT SunuBRT',
  ddd: 'Dakar Dem Dikk',
  aftu: 'AFTU',
  tata: 'TATA',
}

export const GPS_MODE_CHOICES: readonly { id: GpsMode; label: string; detail: string }[] = [
  { id: 'ask', label: 'Demander à chaque fois', detail: 'Aucune position n’est lue sans votre accord explicite.' },
  { id: 'always', label: 'Toujours proposer', detail: 'La position est demandée à l’ouverture pour les environs et les alertes.' },
  { id: 'never', label: 'Jamais', detail: 'Aucune demande de position. La recherche par nom de lieu reste disponible.' },
]

export const CONTRAST_CHOICES: readonly { id: ContrastMode; label: string; detail: string }[] = [
  { id: 'standard', label: 'Standard', detail: 'Palette validée de l’application, contrastes déjà au-dessus du seuil AA.' },
  { id: 'high', label: 'Contraste renforcé', detail: 'Texte assombri, contours et liens visibles, bordures épaissies.' },
]

export const DISTANCE_UNIT_CHOICES: readonly { id: DistanceUnits; label: string; detail: string }[] = [
  { id: 'metric', label: 'Mètres et kilomètres', detail: 'Unités employées à Dakar pour la marche et les correspondances.' },
  { id: 'imperial', label: 'Miles', detail: 'Affichage impérial pour les distances ; les durées restent en minutes.' },
]

export const DURATION_FORMAT_CHOICES: readonly { id: DurationFormat; label: string; detail: string }[] = [
  { id: 'minutes', label: 'Minutes', detail: 'Comme les grilles de fréquence publiées (6 min, 10 min).' },
  { id: 'hours', label: 'Heures et minutes', detail: 'Pour les trajets longs, au-delà d’une heure.' },
]

export const LANGUAGE_CHOICES: readonly { id: AssistantLanguagePreference; label: string; detail: string }[] = [
  { id: 'auto', label: 'Langue de la question', detail: 'Français si la phrase est en français, wolof si elle est en wolof.' },
  { id: 'fr', label: 'Français', detail: 'Réponses et voix en français, quelle que soit la question.' },
  { id: 'wo', label: 'Wolof', detail: 'Réponses en wolof ; le français reste affiché pour les mentions légales.' },
]

export const INTERFACE_LANGUAGE_CHOICES: readonly { id: 'fr' | 'wo'; label: string; detail: string }[] = [
  { id: 'fr', label: 'Français', detail: 'Libellés complets de l’interface.' },
  { id: 'wo', label: 'Wolof', detail: 'Assistant, voix et réponses de trajet en wolof ; les libellés restent en français tant que la traduction n’est pas validée.' },
]

/**
 * Le battement est plafonné à 5 minutes par correspondance : au-delà, le calcul
 * ne deviendrait pas plus juste — il fabriquerait une marge que rien ne justifie.
 * Les choix proposés s'arrêtent donc au plafond, pour que le réglage annonce ce
 * qu'il fait réellement.
 */
export const TRANSFER_BUFFER_CHOICES: readonly { id: number; label: string; detail: string }[] = [
  { id: 0, label: 'Aucun', detail: 'Durées calculées au plus juste, sans marge de confort.' },
  { id: 2, label: '2 min', detail: 'Petit matelas pour avaler la marche de correspondance.' },
  { id: 3, label: '3 min', detail: 'Battement de référence déjà utilisé par le moteur.' },
  { id: 5, label: '5 min', detail: 'Plafond accepté : au-delà, aucune donnée ne permettrait de promettre plus large.' },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function numberInRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback
}

function networksFrom(raw: unknown, fallback: Record<MobilityId, boolean>): Record<MobilityId, boolean> {
  if (!isRecord(raw)) return { ...fallback }
  const out = { ...fallback }
  for (const id of MOBILITY_IDS) out[id] = bool(raw[id], fallback[id])
  return out
}

/** Nettoie toute charge utile lue du stockage : une valeur inconnue retombe sur
 *  le défaut, elle n'est jamais conservée telle quelle. */
export function sanitizePreferences(raw: unknown, fallback: Preferences = DEFAULT_PREFERENCES): Preferences {
  const root = isRecord(raw) ? raw : {}
  const mobility = isRecord(root.mobility) ? root.mobility : {}
  const language = isRecord(root.language) ? root.language : {}
  const accessibility = isRecord(root.accessibility) ? root.accessibility : {}
  const units = isRecord(root.units) ? root.units : {}
  const privacy = isRecord(root.privacy) ? root.privacy : {}
  const offline = isRecord(root.offline) ? root.offline : {}
  return {
    mobility: {
      networks: networksFrom(mobility.networks, fallback.mobility.networks),
      walkSpeed: oneOf(mobility.walkSpeed, ['slow', 'normal', 'fast'] as const, fallback.mobility.walkSpeed),
      accessRadius: oneOf(mobility.accessRadius, ['near', 'normal', 'wide'] as const, fallback.mobility.accessRadius),
      transferBufferMin: numberInRange(mobility.transferBufferMin, 0, 5, fallback.mobility.transferBufferMin),
      terClass: oneOf(mobility.terClass, ['second', 'first'] as const, fallback.mobility.terClass),
      showFares: bool(mobility.showFares, fallback.mobility.showFares),
    },
    language: {
      assistant: oneOf(language.assistant, ['auto', 'fr', 'wo'] as const, fallback.language.assistant),
      interface: oneOf(language.interface, ['fr', 'wo'] as const, fallback.language.interface),
    },
    accessibility: {
      fontScale: oneOf(accessibility.fontScale, ['compact', 'normal', 'large', 'xl'] as const, fallback.accessibility.fontScale),
      contrast: oneOf(accessibility.contrast, ['standard', 'high'] as const, fallback.accessibility.contrast),
      voiceGuidance: bool(accessibility.voiceGuidance, fallback.accessibility.voiceGuidance),
      reduceMotion: bool(accessibility.reduceMotion, fallback.accessibility.reduceMotion),
      haptics: bool(accessibility.haptics, fallback.accessibility.haptics),
      announceResults: bool(accessibility.announceResults, fallback.accessibility.announceResults),
    },
    units: {
      distance: oneOf(units.distance, ['metric', 'imperial'] as const, fallback.units.distance),
      duration: oneOf(units.duration, ['minutes', 'hours'] as const, fallback.units.duration),
      currency: 'XOF',
      clock: '24h',
    },
    privacy: {
      gps: oneOf(privacy.gps, ['ask', 'always', 'never'] as const, fallback.privacy.gps),
      shareCommunityReports: bool(privacy.shareCommunityReports, fallback.privacy.shareCommunityReports),
      allowMicrophone: bool(privacy.allowMicrophone, fallback.privacy.allowMicrophone),
      keepPlaceHistory: bool(privacy.keepPlaceHistory, fallback.privacy.keepPlaceHistory),
    },
    offline: {
      autoDownload: bool(offline.autoDownload, fallback.offline.autoDownload),
    },
  }
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

/** Lecture au démarrage : la préférence de langue du copilote, enregistrée avant
 *  ce réglage global, est reprise plutôt que perdue. */
export function readStoredPreferences(): Preferences {
  const store = storage()
  let stored: unknown = null
  if (store) {
    try {
      const raw = store.getItem(PREFERENCES_STORAGE_KEY)
      stored = raw ? JSON.parse(raw) : null
    } catch {
      stored = null
    }
  }
  const base = sanitizePreferences(stored)
  if (!stored) {
    try {
      const legacy = store?.getItem(LEGACY_LANGUAGE_KEY)
      if (legacy === 'fr' || legacy === 'wo' || legacy === 'auto') base.language.assistant = legacy
    } catch {
      // Un stockage illisible ne bloque pas l'application : les défauts restent.
    }
  }
  return base
}

let current: Preferences = readStoredPreferences()
const listeners = new Set<() => void>()

function persist(next: Preferences): void {
  try {
    storage()?.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Navigation privée ou quota atteint : les réglages vivent en mémoire.
  }
  try {
    storage()?.setItem(LEGACY_LANGUAGE_KEY, next.language.assistant)
  } catch {
    // Idem : la clé historique est un confort, pas une dépendance.
  }
}

export function getPreferences(): Preferences {
  return current
}

export function subscribePreferences(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(): void {
  for (const listener of listeners) listener()
}

/** Mise à jour partielle, profondeur par section : un appel ne peut pas
 *  écraser une autre section par inadvertance. */
export function updatePreferences<K extends keyof Preferences>(section: K, patch: Partial<Preferences[K]>): Preferences {
  const merged = sanitizePreferences({ ...current, [section]: { ...current[section], ...(patch as Record<string, unknown>) } }, current)
  current = merged
  persist(merged)
  emit()
  return merged
}

export function resetPreferences(): Preferences {
  current = sanitizePreferences(DEFAULT_PREFERENCES)
  persist(current)
  emit()
  return current
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribePreferences, getPreferences, getPreferences)
}

/** Réseaux réellement autorisés par l'usager, dans l'ordre de la palette. */
export function allowedNetworksOf(preferences: Preferences): MobilityId[] {
  return MOBILITY_IDS.filter((id) => preferences.mobility.networks[id])
}

/** Options transmises au calculateur depuis les préférences. */
export function plannerPreferences(preferences: Preferences) {
  return {
    allowedNetworks: allowedNetworksOf(preferences).length > 0 ? allowedNetworksOf(preferences) : null,
    walkSpeed: preferences.mobility.walkSpeed,
    accessRadius: preferences.mobility.accessRadius,
    terClass: preferences.mobility.terClass,
    transferBufferMin: preferences.mobility.transferBufferMin,
  }
}

export function fontScaleRatio(scale: FontScale): number {
  return FONT_SCALE_STEPS.find((step) => step.id === scale)?.ratio ?? 1
}

/** Variables posées sur la racine de l'application par l'écran de réglages. */
export function accessibilityStyle(preferences: Preferences): Record<string, string> {
  return {
    '--app-font-scale': String(fontScaleRatio(preferences.accessibility.fontScale)),
    '--app-motion': preferences.accessibility.reduceMotion ? '0.001s' : '',
    '--app-contrast': preferences.accessibility.contrast === 'high' ? '1' : '0',
  }
}
