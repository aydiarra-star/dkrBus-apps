/**
 * Sources secondaires récentes qui exposent des séquences DDD séparées
 * par direction. Les listes de Moovit ne sont pas importées ici : elles
 * doivent être rapprochées des repères officiels et des géométries avant usage.
 */
export const DDD_MOOVIT_DIRECTIONAL_CANDIDATES = [
  {
    line: '7',
    direction: 'to_ouakam',
    from: 'Gare Palais',
    to: 'Rue Okm 60, 67',
    occurrenceCount: 29,
    sourceUpdatedOn: '2026-11-07',
    sourceUrl: 'https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-0',
    status: 'SECONDARY_SOURCE_NEEDS_RECONCILIATION',
  },
  {
    line: '7',
    direction: 'to_palais',
    from: 'Rue Okm 60, 67',
    to: 'Gare Palais',
    occurrenceCount: 27,
    sourceUpdatedOn: '2026-11-14',
    sourceUrl: 'https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-1',
    status: 'SECONDARY_SOURCE_NEEDS_RECONCILIATION',
  },
  {
    line: '13',
    direction: 'to_palais',
    from: 'Terminus Liberté 5',
    to: 'Gare Palais',
    occurrenceCount: 30,
    sourceUpdatedOn: '2026-11-14',
    sourceUrl: 'https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-1',
    status: 'SECONDARY_SOURCE_NEEDS_RECONCILIATION',
  },
  {
    line: '13',
    direction: 'to_liberte_5',
    from: 'Gare Palais',
    to: 'Terminus Liberté 5',
    occurrenceCount: 30,
    sourceUpdatedOn: '2026-11-14',
    sourceUrl: 'https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-0',
    status: 'SECONDARY_SOURCE_NEEDS_RECONCILIATION',
  },
] as const

export const DDD_MOOVIT_DIRECTIONAL_CANDIDATE_RETRIEVED_ON = '2026-11-17' as const
