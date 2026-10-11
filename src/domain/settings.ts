/**
 * Écrans « Paramètres » : sections réellement activées, dans l'ordre d'aide.
 *
 * Une section n'existe ici que si elle commande quelque chose d'observable dans
 * l'application. Le module ne stocke rien : il décrit la correspondance entre la
 * section, la préférence concernée (`preferences.ts`) et la conséquence visible,
 * pour que l'interface et les tests parlent de la même liste.
 */

import type { Preferences } from './preferences'

export type SettingsSectionId =
  | 'mobility'
  | 'language'
  | 'accessibility'
  | 'units'
  | 'privacy'
  | 'sources'
  | 'legal'
  | 'offline'

export interface SettingsSection {
  id: SettingsSectionId
  label: string
  /** Ce que le réglage change concrètement — affiché sous le titre. */
  effect: string
  /** Touche d'ancrage dans la page, pour un lien direct depuis l'aide. */
  anchor: string
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: 'mobility',
    label: 'Préférences de mobilité',
    effect: 'Filtre les réseaux explorés par le calculateur, ajuste la vitesse de marche et le rayon d’accès.',
    anchor: 'preferences-mobilite',
  },
  {
    id: 'language',
    label: 'Langue',
    effect: 'Choisit la langue de réponse de l’assistant et de la voix, en français ou en wolof.',
    anchor: 'preferences-langue',
  },
  {
    id: 'accessibility',
    label: 'Accessibilité',
    effect: 'Échelle de texte, contraste renforcé, réduction des animations et guidage vocal.',
    anchor: 'preferences-accessibilite',
  },
  {
    id: 'units',
    label: 'Unités et mesures',
    effect: 'Distance en mètres et kilomètres ou en miles, durée en minutes ou en heures.',
    anchor: 'preferences-unites',
  },
  {
    id: 'privacy',
    label: 'Confidentialité et position',
    effect: 'Autorise ou refuse la géolocalisation, le micro et l’historique des lieux sur cet appareil.',
    anchor: 'preferences-confidentialite',
  },
  {
    id: 'sources',
    label: 'Sources de données',
    effect: 'État du réseau de référence, des flux déclarés et des dates de consultation.',
    anchor: 'preferences-sources',
  },
  {
    id: 'legal',
    label: 'Conditions d’utilisation',
    effect: 'Ce que l’application promet, ce qu’elle ne promet pas, et qui publier les données.',
    anchor: 'preferences-cgu',
  },
  {
    id: 'offline',
    label: 'Mode hors ligne',
    effect: 'Télécharge le référentiel (arrêts, lignes, correspondances, tarifs publiés) sur cet appareil.',
    anchor: 'preferences-hors-ligne',
  },
]

export const SETTINGS_SECTION_IDS = SETTINGS_SECTIONS.map((section) => section.id) as readonly SettingsSectionId[]

export function settingsSectionFor(anchor: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((section) => section.anchor === anchor)
}

export interface OfflineCapability {
  id: 'stops' | 'lines' | 'transfers' | 'fares' | 'map' | 'realtime'
  label: string
  available: boolean
  detail: string
}

/**
 * Ce que le mode hors ligne permet vraiment. La liste est courte et honnête :
 * les tuiles de carte et le temps réel dépendent d'un serveur, aucune version
 * locale du référentiel ne les remplace.
 */
export const OFFLINE_CAPABILITIES: readonly OfflineCapability[] = [
  { id: 'stops', label: 'Arrêts et gares du réseau de référence', available: true, detail: 'Noms, coordonnées et pôles d’échange, enregistrés dans le paquet.' },
  { id: 'lines', label: 'Lignes et tracés de référence', available: true, detail: 'Séquences d’arrêts déclarées, pour calculer un itinéraire sans connexion.' },
  { id: 'transfers', label: 'Correspondances', available: true, detail: 'Correspondances déclarées et estimées, avec leur distance et leur battement.' },
  { id: 'fares', label: 'Grilles de tarifs publiées', available: true, detail: 'TER et BRT par zones ; les lignes sans tarif publié le disent.' },
  { id: 'map', label: 'Fond de carte', available: false, detail: 'Les tuiles sont servies en ligne : seule la liste des arrêts reste consultable hors connexion.' },
  { id: 'realtime', label: 'Prochains passages et trafic', available: false, detail: 'Aucune donnée temps réel n’est embarquée ; le hors ligne reste une estimation de référence.' },
]

/** Résumé lu par l'aide et par l'écran : ce que l'utilisateur a choisi. */
export function preferencesSummary(preferences: Preferences): string[] {
  const networks = Object.entries(preferences.mobility.networks).filter(([, enabled]) => enabled).map(([id]) => id.toUpperCase())
  return [
    `Réseaux autorisés : ${networks.length > 0 ? networks.join(', ') : 'aucun — le calcul refusera toute ligne'}.`,
    `Vitesse de marche : ${preferences.mobility.walkSpeed} · rayon d’accès : ${preferences.mobility.accessRadius}.`,
    `Assistant en ${preferences.language.assistant === 'auto' ? 'langue de la question' : preferences.language.assistant === 'wo' ? 'wolof' : 'français'}.`,
    `Texte ${preferences.accessibility.fontScale} · contraste ${preferences.accessibility.contrast} · animations ${preferences.accessibility.reduceMotion ? 'réduites' : 'normales'}.`,
    `Unités : ${preferences.units.distance === 'imperial' ? 'miles' : 'mètres et kilomètres'}.`,
    `Position : ${preferences.privacy.gps === 'never' ? 'jamais demandée' : preferences.privacy.gps === 'always' ? 'demandée automatiquement' : 'demandée à chaque usage'}.`,
  ]
}
