/**
 * État d'affichage des réseaux de transport en fonction de l'heure locale de Dakar.
 *
 * Dakar (Africa/Dakar) est UTC+00 toute l'année : les composantes UTC de l'instant
 * sont l'heure locale légale. Aucune conversion de fuseau n'est appliquée.
 *
 * Règles de gestion des états d'affichage :
 *
 * | Plage horaire                                              | État      | Action                                              |
 * |------------------------------------------------------------|-----------|-----------------------------------------------------|
 * | Après fin du service jusqu'à (Début - 1h)                  | FINISHED  | « Fin de service » (masquer le compte à rebours)    |
 * | Entre (Début - 1h) et Démarrage                            | UPCOMING  | Afficher compte à rebours / créneau 1er départ      |
 * | Pendant les heures d'ouverture                             | ACTIVE    | Intervalle et temps d'attente habituel              |
 *
 * La fenêtre « UPCOMING » (reprise annoncée) couvre la dernière heure avant
 * le démarrage effectif : par exemple pour un service démarrant à 06h00,
 * la bascule se fait à 05h00 — l'usager voit « Reprise dans 47 min · créneau 06:00 ».
 *
 * Ce module ne produit aucune donnée temps réel : il projette l'amplitude
 * de service déclarée (debut, fin) sur l'horloge de Dakar.
 */

export type ServiceDisplayStatus = 'FINISHED' | 'UPCOMING' | 'ACTIVE'

export interface ServiceDisplayState {
  status: ServiceDisplayStatus
  /** Libellé affiché à l'usager (court, pas de code technique). */
  label: string
  /** Si vrai, le composant peut afficher un compte à rebours ou un créneau. */
  showCountdown: boolean
}

/** « 06:00 » → 360 (minutes après minuit). Null si format invalide. */
function parseClockMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Minutes courantes après minuit (heure de Dakar = UTC). */
function currentMinutesSinceMidnight(utcNow: number): number {
  const date = new Date(utcNow)
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

/**
 * Calcule l'état d'affichage d'un réseau de transport.
 *
 * @param utcNow     Instant courant en ms (UTC = heure de Dakar).
 * @param startTime  Heure de début de service, format « HH:MM » (heure de Dakar).
 * @param endTime    Heure de fin de service, format « HH:MM » (heure de Dakar).
 * @returns          État d'affichage : statut, libellé et visibilité du compte à rebours.
 */
export function getServiceDisplayState(
  utcNow: number,
  startTime: string,
  endTime: string,
): ServiceDisplayState {
  if (!Number.isFinite(utcNow)) {
    return { status: 'FINISHED', label: 'Fin de service', showCountdown: false }
  }

  const startMinutes = parseClockMinutes(startTime)
  const endMinutes = parseClockMinutes(endTime)

  // Données invalides : afficher « Fin de service » sans inventer un créneau.
  if (startMinutes === null || endMinutes === null) {
    return { status: 'FINISHED', label: 'Fin de service', showCountdown: false }
  }

  const now = currentMinutesSinceMidnight(utcNow)
  // Seuil de reprise annoncée : 60 minutes avant le démarrage effectif.
  const upcomingThreshold = startMinutes - 60

  // Service en cours : entre le début et la fin déclarés.
  if (now >= startMinutes && now < endMinutes) {
    return {
      status: 'ACTIVE',
      label: 'En service',
      showCountdown: true,
    }
  }

  // Fenêtre de reprise annoncée : entre (début - 1h) et le début.
  // Gère aussi le cas minuit (upcomingThreshold < 0) pour un service très matinal.
  const isUpcoming = upcomingThreshold >= 0
    ? now >= upcomingThreshold && now < startMinutes
    : (now >= (upcomingThreshold + 24 * 60) || now < startMinutes) && now < startMinutes

  if (isUpcoming) {
    const minutesUntilStart = now < startMinutes
      ? startMinutes - now
      : startMinutes + (24 * 60 - now)
    const countdownLabel = formatCountdownLabel(minutesUntilStart)
    return {
      status: 'UPCOMING',
      label: `Reprise ${countdownLabel}`,
      showCountdown: true,
    }
  }

  // Tout le reste : fin de service (après la fin ou avant la fenêtre de reprise).
  return {
    status: 'FINISHED',
    label: 'Fin de service',
    showCountdown: false,
  }
}

/**
 * Libellé de compte à rebours pour la fenêtre UPCOMING.
 * « 47 min » ou « 1 h 13 » — jamais « 0 min ».
 */
function formatCountdownLabel(minutes: number): string {
  if (minutes < 1) return 'imminente'
  if (minutes < 60) return `dans ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `dans ${hours} h` : `dans ${hours} h ${String(rest).padStart(2, '0')}`
}

/**
 * Détermine si le compte à rebours / le créneau de passage doit être affiché
 * pour un réseau donné, en combinant l'état de service et le passage calculé.
 *
 * Un passage existe mais le service est terminé → masquer le décompte.
 * Un passage existe et le service est en reprise → afficher.
 * Un passage existe et le service est actif → afficher.
 */
export function shouldShowPassage(state: ServiceDisplayState): boolean {
  return state.showCountdown
}
