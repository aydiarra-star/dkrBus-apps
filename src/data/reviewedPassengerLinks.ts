import type { Dataset } from '../routing/model'

/** Passenger admission list, maintained by source review, NOT an import of
 * candidate maps, archives or survey submissions. See the field checklist in
 * docs/raccordement-lieux-arrets.md. No Dakar footway currently qualifies. */
export const REVIEWED_PASSENGER_LINKS: Dataset = {
  places: [], patterns: [], graphPatterns: [], platformBindings: [], footways: [],
}
