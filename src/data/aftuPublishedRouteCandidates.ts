/**
 * Fiches d'itinéraires publiées sur le site officiel AFTU.
 *
 * Ces descriptions sont conservées comme preuves candidates, pas comme
 * séquences d'arrêts validées pour le calculateur voyageur. Une page décrit
 * généralement un parcours sans donner une liste indépendante complète
 * pour le sens opposé.
 */
export interface AftuPublishedRouteCandidate {
  line: string
  sourceUrl: string
  sourceLabel: string
  publishedOn: string
  retrievedOn: '2026-11-13'
  description: string
  status: 'NEEDS_HUMAN_REVIEW'
  directionCoverage: 'SINGLE_DESCRIPTION_ONLY'
}

const aftuSource = 'AFTU-Sénégal · Fiche itinéraire officielle'

export const AFTU_PUBLISHED_ROUTE_CANDIDATES: readonly AftuPublishedRouteCandidate[] = [
  {
    line: '2',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-2/',
    sourceLabel: aftuSource,
    publishedOn: '2026-05-19',
    retrievedOn: '2026-11-13',
    description: 'Route principale des Parcelles Assainies, Croisement Dior, HLM Grand Médine, marché des Parcelles, route des Niayes, Pont de l’Émergence, giratoire Liberté VI, Front de Terre, rues P et 13, boulevard du Général de Gaulle, rues 39/17 et 22/25/37, avenue Blaise Diagne, avenue Émile Badiane, terminus Petersen. La page mentionne des variantes de retour par certaines rues.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '5',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-5/',
    sourceLabel: aftuSource,
    publishedOn: '2026-05-21',
    retrievedOn: '2026-11-13',
    description: 'Gare des Parcelles Assainies, route de l’Église, route des Niayes, Pont Stade LSS, autoroute Seydina L, Grand Yoff, HOGGY, Front de Terre, avenue Bourguiba, avenue Cheikh Amadou Bamba, rues 39/17, 22/25/37, avenue Blaise Diagne, avenue Émile Badiane, rue Mangin, terminus Petersen.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '29',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-29/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-27',
    retrievedOn: '2026-11-13',
    description: 'Cité Nations Unies (Cambérène), Golf, Cinéma Parcelles, route des Niayes, Police Parcelles, rond-point de Cambérène (Casebi), route des Niayes prolongée, Pont Stade LSS, avenue Hyacinthe Thiandoum, giratoire Liberté VI, piste d’envol, route du Collège Sacré Cœur, avenue Bourguiba, carrefour Seydou N. Tall, avenue Cheikh Anta Diop, avenue Blaise Diagne, terminus Gare Petersen.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '30',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-30/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-27',
    retrievedOn: '2026-11-13',
    description: 'Gadaye, Wakhinane Nimzatt, marché Ndiarème, rue Cheikh Wade, Sam Notaire, stade Amadou Barry, lycée Canada, route des Niayes, rond-point de Cambérène, Police Parcelles, avenue Hyacinthe Thiandoum, giratoire Liberté VI, allées Ababacar Sy, allées Cheikh Sidaty Aïdara, Bopp, cité Port, rocade Fann/Bel Air, terminus Gare de Colobane.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '37',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-37/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-29',
    retrievedOn: '2026-11-13',
    description: 'Terminus APIX, croisement Tivaouane Peulh, cité Sotrac, cité Ainoumady, station Keur Massar, station MTOA, Malika Montagne, Malika, VDN, Gadaye, terminus 49, terminus 30 et 42, Wakhinane, Guédiawaye, Pikine, Technopole, Cambérène, Maristes, Hann, Colobane, lycée Kennedy, Fass, Gueule Tapée, hôpital Abass Ndao, rond-point Fann, terminus UCAD (Claudel).',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '57',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-57/',
    sourceLabel: aftuSource,
    publishedOn: '2026-07-07',
    retrievedOn: '2026-11-13',
    description: 'Rufisque Gouye Mouride, marché Colobane Rufisque, Poste Courant, boulevard Maurice Gueye, route nationale 1, Keur Mbaye Fall, croisement Keur Massar, Poste Thiaroye, Bountou Pikine, croisement Cambérène, Pont de l’Émergence, Grand Yoff, avenue Hyacinthe Thiandoum, terminus rond-point Liberté 6.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '72',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-72/',
    sourceLabel: aftuSource,
    publishedOn: '2026-07-13',
    retrievedOn: '2026-11-13',
    description: 'Guédiawaye Cité des Enseignants, avenue Oumar Foutiyou Tall, Golf Nord, route des Niayes, Police Thiaroye, Poste Thiaroye, route nationale 1, croisement Keur Massar, Keur Mbaye Fall, ZAC Mbao, allées Médina ZAC, cité Capec, HLM Rufisque, rond-point Djouti Ba, boulevard Maurice Gueye, Sonadis Rufisque, hôpital Youssou Mbargane Diop, route de Sangalkam, Keur Daouda Sarr, cité Sagef, cité Baba Guisse, terminus Kounoune.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
]
