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
  },,

  {
    line: '24',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-24/',
    sourceLabel: aftuSource,
    publishedOn: '2026-05-21',
    retrievedOn: '2026-11-13',
    description: 'Terminus Notaire (Guédiawaye), Sapeurs-pompiers de Guédiawaye, prolongement rue 10, route des Niayes, Tally Boubess, sortie Pikine, branche est autoroute, autoroute, échangeur de Hann, route du Front de Terre, avenue Bourguiba, rond-point Seydou N. Tall, avenue Cheikh Anta Diop, terminus Université Cheikh Anta Diop.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '26',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-26/',
    sourceLabel: aftuSource,
    publishedOn: '2026-05-21',
    retrievedOn: '2026-11-13',
    description: 'Terminus Gare des Parcelles Assainies, Groupement national des sapeurs-pompiers, unités de voisinage 10, 11, 7 et 8, Case de Cambérène, unités 5, 6, 4, 3 et 2, route des Niayes (Guédiawaye), croisement Béthio, terminus Guédiawaye.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '31',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-31/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-27',
    retrievedOn: '2026-11-13',
    description: 'Terminus Tally Icotaf x route des Niayes (Pikine), Tally Icotaf, sortie Pikine, Khourounar, cité Lobatt Fall, branche est autoroute, échangeur Patte d’Oie, pont Stade LSS, avenue Hyacinthe Thiandoum, giratoire Liberté VI, piste d’envol, route du Collège Sacré-Cœur, boulevard Dial Diop, canal de la Gueule Tapée, terminus hôpital Abass Ndao.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '32',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-32/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-27',
    retrievedOn: '2026-11-13',
    description: 'Terminus Sahm, Maison du Parti, HLM, cité des Eaux, autoroute, croisement Cambérène, Lobatt Fall, Tally Boumack, route des Niayes, Canada, Corniche, Hamo 6, terminus Serigne Assane.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '33',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-33/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-27',
    retrievedOn: '2026-11-13',
    description: 'Terminus Colobane, rond-point Colobane, Maison du Parti, HLM, Front de Terre, Kharyalla, rond-point Liberté 6, HLM Grand Yoff, pont de l’Émergence, Case-Ba, Fadia, Golf, PAI, lycée Canada, stade Amadou Barry, lycée Limamoulaye, marché Boubess, terminus Serigne Assane.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '38',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-38/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-29',
    retrievedOn: '2026-11-13',
    description: 'Cité des Enseignants, PAI, Golf, Fadia, Case-Ba, Police des Parcelles, Patte d’Oie, Grand Yoff, Castors, Bourguiba, École de Police, rond-point Fann, UCAD, terminus Sahm.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '39',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-39/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-29',
    retrievedOn: '2026-11-13',
    description: 'Terminus Lat-Dior, Poste Médine, rue 6, Gueule Tapée Claudel, École normale, Bourguiba, Castors, Liberté 6, marché Grand Yoff, pont de l’Émergence, Police des Parcelles, croisement 22, Dior, terminus Diamalaye.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
  {
    line: '40',
    sourceUrl: 'https://aftu-senegal.org/map/dakar-urbain-ligne-40/',
    sourceLabel: aftuSource,
    publishedOn: '2026-06-29',
    retrievedOn: '2026-11-13',
    description: 'Terminus Grand Mbao, route nationale 1, Fass Mbao, Poste Thiaroye, route de Yarakh, Cafétéria, Maristes, échangeur de Hann, autoroute, Colobane, terminus Petersen.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_ONLY',
  },
]
