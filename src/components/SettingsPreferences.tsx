import { useState, type ReactNode } from 'react'
import { Download, Eraser, RefreshCw, ShieldCheck, Volume2 } from 'lucide-react'
import {
  ACCESS_RADIUS_CHOICES,
  CONTRAST_CHOICES,
  DISTANCE_UNIT_CHOICES,
  DURATION_FORMAT_CHOICES,
  FONT_SCALE_STEPS,
  GPS_MODE_CHOICES,
  INTERFACE_LANGUAGE_CHOICES,
  LANGUAGE_CHOICES,
  NETWORK_CHOICE_LABELS,
  TRANSFER_BUFFER_CHOICES,
  WALK_SPEED_CHOICES,
  resetPreferences,
  updatePreferences,
  type ContrastMode,
  type DistanceUnits,
  type DurationFormat,
  type FontScale,
  type GpsMode,
  type Preferences,
} from '../domain/preferences'
import type { MobilityId } from '../domain/mobilityColors'
import type { AccessRadiusPreset, WalkSpeedPreset } from '../domain/assumptions'
import type { FareClass } from '../domain/fares'
import type { AssistantLanguagePreference } from '../domain/language'
import { MOBILITY_IDS } from '../domain/mobilityColors'
import { MobilityBadge } from './MobilityBadge'
import { OFFLINE_CAPABILITIES, SETTINGS_SECTIONS } from '../domain/settings'
import {
  INTEGRITY_LABELS,
  clearOfflinePack,
  formatBytes,
  formatPackDate,
  offlineCapabilityText,
  offlinePackState,
  saveOfflinePack,
} from '../domain/offlinePack'
import { hasVoiceFor, speechSynthesisSupported, speak } from '../domain/speech'

/** Ligne de réglage : ce que ça change à gauche, la commande à droite. */
function PrefRow({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return (
    <div className="pref-row">
      <div className="pref-copy">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      <div className="pref-control">{children}</div>
    </div>
  )
}

function PrefSwitch({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <PrefRow title={label} detail={detail}>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <span />
      </button>
    </PrefRow>
  )
}

function PrefChoices<T extends string | number>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string
  value: T
  options: readonly { id: T; label: string; detail?: string }[]
  onSelect: (next: T) => void
}) {
  return (
    <div className="pref-choices-wrap">
      <span className="pref-choices-label">{label}</span>
      <div className="pref-choices" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.id)}
            type="button"
            className={`pref-choice${value === option.id ? ' selected' : ''}`}
            aria-pressed={value === option.id}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.label}</strong>
            {option.detail && <small>{option.detail}</small>}
          </button>
        ))}
      </div>
    </div>
  )
}

const TER_CLASS_CHOICES: readonly { id: FareClass; label: string; detail: string }[] = [
  { id: 'second', label: 'Seconde', detail: '500, 1 000 ou 1 500 F CFA selon les zones traversées.' },
  { id: 'first', label: 'Première', detail: '2 500 F CFA quelle que soit la zone, d’après la grille publiée.' },
]

/**
 * Écran Paramètres — les réglages qui changent réellement l'application :
 * chaque interrupteur et chaque choix écrit dans le même magasin que le
 * calculateur d'itinéraires, la voix et l'affichage. Le vert de la charte marque
 * l'état actif ; aucune valeur n'est stockée ailleurs que sur l'appareil.
 */
export function SettingsPreferences({
  preferences,
  onNotify,
  onOpenSection,
  onClearSavedPlaces,
}: {
  preferences: Preferences
  onNotify: (message: string) => void
  onOpenSection?: (anchor: string) => void
  onClearSavedPlaces?: () => void
}) {
  const [offline, setOffline] = useState(() => offlinePackState())
  const [busy, setBusy] = useState(false)
  const mobility = preferences.mobility
  const enabledNetworks = MOBILITY_IDS.filter((id) => mobility.networks[id])

  function set<K extends keyof Preferences>(section: K, patch: Partial<Preferences[K]>, message: string) {
    updatePreferences(section, patch)
    onNotify(message)
  }

  function toggleNetwork(id: MobilityId) {
    const next = !mobility.networks[id]
    if (!next && enabledNetworks.length === 1) {
      onNotify('Au moins un réseau doit rester autorisé : le calcul refuserait toute ligne sinon.')
      return
    }
    set('mobility', { networks: { ...mobility.networks, [id]: next } }, `${NETWORK_CHOICE_LABELS[id]} ${next ? 'autorisé dans le calcul' : 'retiré du calcul'}.`)
  }

  function downloadPack() {
    setBusy(true)
    const result = saveOfflinePack()
    setOffline(offlinePackState())
    setBusy(false)
    onNotify(result.ok
      ? `Paquet hors ligne enregistré : ${result.summary.stops} arrêts, ${result.summary.lines} lignes, ${result.summary.transfers} correspondances (${formatBytes(result.summary.bytes)}).`
      : result.error)
  }

  function removePack() {
    clearOfflinePack()
    setOffline(offlinePackState())
    onNotify('Paquet hors ligne supprimé de cet appareil.')
  }

  function testVoice() {
    const language = preferences.language.assistant === 'wo' ? 'wo' : 'fr'
    if (!speechSynthesisSupported()) {
      onNotify('La synthèse vocale n’est pas disponible sur ce navigateur : les réponses restent affichées à l’écran.')
      return
    }
    if (!hasVoiceFor(language)) {
      onNotify(language === 'wo'
        ? 'Aucune voix wolof n’est installée sur cet appareil : la réponse wolof s’affiche, la lecture reste en français si une voix française existe.'
        : 'Aucune voix française n’est installée sur cet appareil : la lecture n’est pas possible ici.')
      return
    }
    const spoken = language === 'wo'
      ? 'Nanga def. Mën naa la dimbali ci yoon wi ci Dakar. Xayma la ci référaas bi, du temps réel.'
      : 'Bonjour. Je prépare votre itinéraire à partir du réseau de référence dakarois, sans donnée en temps réel.'
    const started = speak({ text: spoken, lang: language })
    if (!started) onNotify('La lecture n’a pas pu démarrer sur cet appareil.')
  }

  return (
    <section className="panel settings-panel settings-preferences" aria-label="Réglages de l’application">
      <div className="panel-heading-row">
        <div>
          <span className="eyebrow">RÉGLAGES</span>
          <h2>Vos préférences</h2>
          <p>Chaque réglage agit sur le calcul, la voix ou l’affichage. Ils restent sur cet appareil.</p>
        </div>
        <span className="explore-icon"><ShieldCheck size={19} /></span>
      </div>

      {SETTINGS_SECTIONS.filter((section) => ['mobility', 'language', 'accessibility', 'units', 'privacy', 'offline'].includes(section.id)).map((section) => (
        <details className="settings-disclosure" key={section.id} id={section.anchor} data-section={section.id}>
          <summary>
            <span>{section.label}</span>
          </summary>
          <div className="settings-disclosure-content">
            <p className="pref-effect">{section.effect}</p>

            {section.id === 'mobility' && (
              <>
                <div className="pref-choices" role="group" aria-label="Réseaux autorisés dans le calcul">
                  {MOBILITY_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`pref-choice pref-network${mobility.networks[id] ? ' selected' : ''}`}
                      aria-pressed={mobility.networks[id]}
                      onClick={() => toggleNetwork(id)}
                    >
                      <MobilityBadge id={id}>{NETWORK_CHOICE_LABELS[id]}</MobilityBadge>
                      <small>{mobility.networks[id] ? 'utilisé dans le calcul' : 'exclu du calcul'}</small>
                    </button>
                  ))}
                </div>
                <PrefChoices
                  label="Vitesse de marche"
                  value={mobility.walkSpeed}
                  options={WALK_SPEED_CHOICES}
                  onSelect={(id) => set('mobility', { walkSpeed: id as WalkSpeedPreset }, `Vitesse de marche : ${WALK_SPEED_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefChoices
                  label="Rayon d’accès à un arrêt"
                  value={mobility.accessRadius}
                  options={ACCESS_RADIUS_CHOICES}
                  onSelect={(id) => set('mobility', { accessRadius: id as AccessRadiusPreset }, `Rayon d’accès : ${ACCESS_RADIUS_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefChoices
                  label="Battement à chaque correspondance"
                  value={mobility.transferBufferMin}
                  options={TRANSFER_BUFFER_CHOICES}
                  onSelect={(id) => set('mobility', { transferBufferMin: id }, `Battement : ${id === 0 ? 'aucun' : `${id} minutes par correspondance`}.`)}
                />
                <PrefChoices
                  label="Classe TER pour le tarif"
                  value={mobility.terClass}
                  options={TER_CLASS_CHOICES}
                  onSelect={(id) => set('mobility', { terClass: id as FareClass }, `Classe TER : ${TER_CLASS_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefSwitch
                  label="Afficher les tarifs"
                  detail="Somme des tickets d’après les grilles publiées. Une ligne sans tarif publié est signalée, jamais chiffrée."
                  checked={mobility.showFares}
                  onChange={(next) => set('mobility', { showFares: next }, next ? 'Tarifs affichés sur chaque option.' : 'Tarifs masqués.')}
                />
                <p className="pref-status">
                  {enabledNetworks.length} réseau{enabledNetworks.length > 1 ? 'x' : ''} autorisé{enabledNetworks.length > 1 ? 's' : ''} dans le calcul : {enabledNetworks.map((id) => NETWORK_CHOICE_LABELS[id]).join(', ')}.
                </p>
              </>
            )}

            {section.id === 'language' && (
              <>
                <PrefChoices
                  label="Langue des réponses"
                  value={preferences.language.assistant}
                  options={LANGUAGE_CHOICES}
                  onSelect={(id) => set('language', { assistant: id as AssistantLanguagePreference }, `Langue des réponses : ${LANGUAGE_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefChoices
                  label="Langue de l’interface"
                  value={preferences.language.interface}
                  options={INTERFACE_LANGUAGE_CHOICES}
                  onSelect={(id) => set('language', { interface: id as 'fr' | 'wo' }, id === 'wo'
                    ? 'L’assistant répond en wolof par défaut ; les libellés de l’interface restent en français, la traduction n’étant pas validée.'
                    : 'Interface et assistant en français.')}
                />
                <PrefRow title="Voix de lecture" detail={speechSynthesisSupported()
                  ? `Une voix est disponible sur cet appareil : ${hasVoiceFor('fr') ? 'française' : 'aucune voix française'}${hasVoiceFor('wo') ? ' et wolof' : ', aucune voix wolof installée'}.`
                  : 'La synthèse vocale n’est pas disponible sur ce navigateur.'}>
                  <button type="button" className="text-action" onClick={testVoice}>
                    <Volume2 size={14} /> Tester la voix
                  </button>
                </PrefRow>
                <p className="pref-status">
                  Les modèles wolof sont des phrases de base en attente de validation par des locuteurs ; le français reste toujours disponible.
                </p>
              </>
            )}

            {section.id === 'accessibility' && (
              <>
                <PrefChoices
                  label="Taille du texte"
                  value={preferences.accessibility.fontScale}
                  options={FONT_SCALE_STEPS.map((step) => ({ id: step.id, label: step.label, detail: `${Math.round(step.ratio * 100)} % du texte affiché` }))}
                  onSelect={(id) => set('accessibility', { fontScale: id as FontScale }, `Taille du texte : ${FONT_SCALE_STEPS.find((step) => step.id === id)?.label ?? id}.`)}
                />
                <PrefChoices
                  label="Contraste"
                  value={preferences.accessibility.contrast}
                  options={CONTRAST_CHOICES}
                  onSelect={(id) => set('accessibility', { contrast: id as ContrastMode }, `Contraste : ${CONTRAST_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefSwitch
                  label="Guidage vocal des réponses"
                  detail="Lit la réponse de l’assistant et l’itinéraire retenu à voix haute."
                  checked={preferences.accessibility.voiceGuidance}
                  onChange={(next) => set('accessibility', { voiceGuidance: next }, next ? 'Guidage vocal activé.' : 'Guidage vocal désactivé.')}
                />
                <PrefSwitch
                  label="Annoncer le premier résultat"
                  detail="À chaque calcul, la première option est lue une seule fois."
                  checked={preferences.accessibility.announceResults}
                  onChange={(next) => set('accessibility', { announceResults: next }, next ? 'Premier résultat annoncé.' : 'Annonce automatique désactivée.')}
                />
                <PrefSwitch
                  label="Réduire les animations"
                  detail="Supprime les transitions de la carte et des panneaux."
                  checked={preferences.accessibility.reduceMotion}
                  onChange={(next) => set('accessibility', { reduceMotion: next }, next ? 'Animations réduites.' : 'Animations normales.')}
                />
                <PrefSwitch
                  label="Vibrations de confirmation"
                  detail="Court retour tactile à la sélection d’un arrêt ou d’un choix."
                  checked={preferences.accessibility.haptics}
                  onChange={(next) => set('accessibility', { haptics: next }, next ? 'Vibrations activées.' : 'Vibrations désactivées.')}
                />
              </>
            )}

            {section.id === 'units' && (
              <>
                <PrefChoices
                  label="Distances"
                  value={preferences.units.distance}
                  options={DISTANCE_UNIT_CHOICES}
                  onSelect={(id) => set('units', { distance: id as DistanceUnits }, `Distances en ${id === 'imperial' ? 'miles' : 'mètres et kilomètres'}.`)}
                />
                <PrefChoices
                  label="Durées"
                  value={preferences.units.duration}
                  options={DURATION_FORMAT_CHOICES}
                  onSelect={(id) => set('units', { duration: id as DurationFormat }, `Durées en ${id === 'hours' ? 'heures et minutes' : 'minutes'}.`)}
                />
                <p className="pref-status">
                  Monnaie : franc CFA, seule devise publiée par les exploitants de Dakar. Horloge : 24 heures, comme les grilles d’horaires consultées. Ces deux réglages ne sont donc pas modifiables.
                </p>
              </>
            )}

            {section.id === 'privacy' && (
              <>
                <PrefChoices
                  label="Position de l’appareil"
                  value={preferences.privacy.gps}
                  options={GPS_MODE_CHOICES}
                  onSelect={(id) => set('privacy', { gps: id as GpsMode }, `Position : ${GPS_MODE_CHOICES.find((choice) => choice.id === id)?.label ?? id}.`)}
                />
                <PrefSwitch
                  label="Micro pour les questions parlées"
                  detail="Le micro n’est jamais ouvert sans que vous touchiez le bouton de dictée."
                  checked={preferences.privacy.allowMicrophone}
                  onChange={(next) => set('privacy', { allowMicrophone: next }, next ? 'Dictée vocale disponible.' : 'Dictée vocale désactivée — la saisie écrite reste disponible.')}
                />
                <PrefSwitch
                  label="Partager les témoignages « Direct rue »"
                  detail="Sans ce réglage, vos signalements restent sur cet appareil."
                  checked={preferences.privacy.shareCommunityReports}
                  onChange={(next) => set('privacy', { shareCommunityReports: next }, next ? 'Témoignages partageables.' : 'Témoignages conservés localement.')}
                />
                <PrefSwitch
                  label="Conserver l’historique des lieux"
                  detail="Vos destinations enregistrées et les lieux cités à l’assistant restent sur cet appareil."
                  checked={preferences.privacy.keepPlaceHistory}
                  onChange={(next) => set('privacy', { keepPlaceHistory: next }, next ? 'Historique conservé localement.' : 'Historique arrêté : rien ne sera retenu après cette session.')}
                />
                <div className="pref-actions">
                  {onClearSavedPlaces && (
                    <button type="button" className="text-action" onClick={() => { onClearSavedPlaces(); onNotify('Destinations enregistrées effacées de cet appareil.') }}>
                      <Eraser size={14} /> Effacer les destinations enregistrées
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => { resetPreferences(); onNotify('Réglages remis aux valeurs par défaut.') }}
                  >
                    <RefreshCw size={14} /> Réinitialiser les réglages
                  </button>
                </div>
                <p className="pref-status">
                  Aucun compte, aucun serveur : ces réglages, vos destinations et vos brouillons sont écrits uniquement dans le stockage local de ce navigateur. Le fond de carte est servi par OpenStreetMap, qui voit donc vos demandes de tuiles.
                </p>
              </>
            )}

            {section.id === 'offline' && (
              <>
                <div className={`pref-offline-state integrity-${offline.integrity}`} role="status">
                  <strong>{INTEGRITY_LABELS[offline.integrity]}</strong>
                  {offline.summary && (
                    <span>
                      {offline.summary.stops} arrêts · {offline.summary.lines} lignes · {offline.summary.transfers} correspondances · {formatBytes(offline.summary.bytes)} · enregistré le {formatPackDate(offline.summary.savedAt)}
                    </span>
                  )}
                  {offline.error && <span className="pref-offline-error">{offline.error}</span>}
                </div>
                <div className="pref-actions">
                  <button type="button" className="ghost-button" onClick={downloadPack} disabled={busy}>
                    <Download size={14} /> {offline.available ? 'Actualiser le paquet' : 'Télécharger le référentiel'}
                  </button>
                  {offline.available && (
                    <button type="button" className="text-action" onClick={removePack}>
                      <Eraser size={14} /> Supprimer de cet appareil
                    </button>
                  )}
                  {onOpenSection && (
                    <button type="button" className="text-action" onClick={() => onOpenSection('preferences-hors-ligne-aide')}>
                      Ce que le mode hors ligne permet
                    </button>
                  )}
                </div>
                <ul className="pref-capabilities">
                  {OFFLINE_CAPABILITIES.map((capability) => (
                    <li key={capability.id} className={capability.available ? 'available' : 'unavailable'}>
                      <strong>{capability.label}</strong>
                      <span>{capability.available ? 'disponible hors ligne' : 'nécessite une connexion'} — {capability.detail}</span>
                    </li>
                  ))}
                </ul>
                <pre className="pref-offline-text">{offlineCapabilityText(offline)}</pre>
                <PrefSwitch
                  label="Télécharger automatiquement à la première connexion"
                  detail="Prépare le paquet sans y être invité, pour qu’un trajet reste calculable sans réseau."
                  checked={preferences.offline.autoDownload}
                  onChange={(next) => set('offline', { autoDownload: next }, next ? 'Paquet préparé automatiquement à la prochaine connexion.' : 'Téléchargement automatique désactivé.')}
                />
              </>
            )}
          </div>
        </details>
      ))}
    </section>
  )
}
