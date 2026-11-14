/**
 * Corridors displayed by the official AFTU public index, kept separate from
 * the detailed directional lists collected for Dakar Bus. Index titles are
 * corridor references, not complete ordered stop sequences.
 */
export type AftuIndexCrosscheckStatus =
  | 'corridor_endpoints_not_equivalent'
  | 'corridor_overlap_endpoint_identity_unconfirmed'
  | 'corridor_overlap_with_possible_extension'

export interface AftuOfficialIndexCrosswalkEntry {
  line: string
  officialCorridor: string
  status: AftuIndexCrosscheckStatus
  observation: string
  stopSequenceValidatedByIndex: false
}

export const AFTU_OFFICIAL_INDEX_URL = 'https://aftu-senegal.org/infos-pratiques/'
export const AFTU_OFFICIAL_INDEX_CHECKED_ON = '2026-11-14'

export const AFTU_OFFICIAL_INDEX_CROSSWALK: readonly AftuOfficialIndexCrosswalkEntry[] = [
  {
    line: '85',
    officialCorridor: 'Banoba – Liberté 5',
    status: 'corridor_endpoints_not_equivalent',
    observation: 'La séquence enregistrée va de « Terminus De La Ligne 73 » à « Terminus Liberté 5 » et inclut des repères de Lac Rose ; Banoba n’est pas identifié explicitement comme équivalent de son premier terminus.',
    stopSequenceValidatedByIndex: false,
  },
  {
    line: '86',
    officialCorridor: 'Tournalou Boune – Toubab Dialaw',
    status: 'corridor_endpoints_not_equivalent',
    observation: 'La séquence enregistrée va de Yeumbeul à « Terminus 86 / Touba Ngayame ». Les deux extrémités publiées par l’index ne sont pas identifiées textuellement dans les extrémités de la séquence.',
    stopSequenceValidatedByIndex: false,
  },
  {
    line: '87',
    officialCorridor: 'Bambilor – Mosquée Massalikou Djinaine',
    status: 'corridor_endpoints_not_equivalent',
    observation: 'La séquence enregistrée va de « Terminus 79 87 » à « Maristes Terminus 87 ». Le corridor affiché par l’index est différent ; conserver la séquence CETUD transmise sans la remplacer.',
    stopSequenceValidatedByIndex: false,
  },
  {
    line: '88',
    officialCorridor: 'MTOA – Liberté 5',
    status: 'corridor_overlap_endpoint_identity_unconfirmed',
    observation: 'La séquence enregistrée va de « Terminus 88 » à « Terminus Liberté 5 » et contient « Station Mtoa » comme arrêt intermédiaire. Le lien entre « Terminus 88 » et MTOA n’est pas établi par le seul index.',
    stopSequenceValidatedByIndex: false,
  },
  {
    line: '89',
    officialCorridor: 'Bargny – Croisement Niague (Cité SICAP)',
    status: 'corridor_overlap_endpoint_identity_unconfirmed',
    observation: 'La séquence enregistrée relie « Terminus 89 » à « Poste Courant Bargny près de la gare TER » et contient des repères de Niague, dont « Croisement Niague ». L’équivalence de « Terminus 89 » avec le terminus officiel Croisement Niague reste à confirmer.',
    stopSequenceValidatedByIndex: false,
  },
  {
    line: '91',
    officialCorridor: 'APIX – Dougar',
    status: 'corridor_overlap_with_possible_extension',
    observation: 'Les listes CETUD enregistrées vont de Losso à « Terminus 91 » / « Chez Lo électricien » et contiennent des repères de Cité APIX et Dougar Peulh. Le corridor APIX–Dougar semble inclus dans le parcours, mais les extrémités Losso et Chez Lo suggèrent une extension ou une variante à confirmer.',
    stopSequenceValidatedByIndex: false,
  },
] as const

export const getAftuOfficialIndexCrosswalk = (line: string) =>
  AFTU_OFFICIAL_INDEX_CROSSWALK.find((item) => item.line === line) ?? null
