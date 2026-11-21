/**
 * Périmètres des deux phases du TER, dérivés de la séquence de gares de
 * référence. Diamniadio est le point de raccord commun aux deux phases.
 *
 * Phase 1 : Dakar → Diamniadio (13 gares, Diamniadio inclus).
 * Phase 2 : Diamniadio → AIBD (2 gares, Diamniadio inclus).
 *
 * Ces listes décrivent le périmètre géographique, pas les missions réellement
 * exploitées ni les trains qui desservent chaque gare. Ne pas en déduire un
 * horaire, un numéro de mission ou une desserte partielle.
 */
import { TER_STOPS } from './corridors'

const DIAMNIADIO_INDEX = TER_STOPS.findIndex((stop) => stop.id === 'ter-diamniadio')

if (DIAMNIADIO_INDEX < 0) {
  throw new Error('Référentiel TER invalide : gare de Diamniadio introuvable')
}

/** Tronc commun de la phase 1, Dakar ↔ Diamniadio : 13 gares. */
export const TER_PHASE_ONE_STOPS = TER_STOPS.slice(0, DIAMNIADIO_INDEX + 1)

/** Extension aéroport de la phase 2, Diamniadio ↔ AIBD : 2 gares. */
export const TER_AIBD_EXTENSION_STOPS = TER_STOPS.slice(DIAMNIADIO_INDEX)

/** Identifiants du tronc commun, dans l'ordre de Dakar vers Diamniadio. */
export const TER_PHASE_ONE_STOP_IDS = TER_PHASE_ONE_STOPS.map((stop) => stop.id)

/** Identifiants de l'extension aéroport, dans l'ordre de Diamniadio vers AIBD. */
export const TER_AIBD_EXTENSION_STOP_IDS = TER_AIBD_EXTENSION_STOPS.map((stop) => stop.id)
