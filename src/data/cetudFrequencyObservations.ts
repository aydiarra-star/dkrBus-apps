/**
 * Observations de fréquence publiées dans le rapport officiel CETUD/CUREM
 * « Étude de la situation de référence du projet BRT », tome 2, juillet 2020.
 *
 * Les intervalles sont mesurés par site et par sens, pas par numéro de ligne.
 * Ne jamais les recopier comme fréquence propre à une ligne sans preuve de
 * correspondance entre cette ligne et le site observé.
 */
export type FrequencyNetwork = 'AFTU' | 'DDD'
export type FrequencyPeriod = 'weekday' | 'saturday'

export interface CetudFrequencyObservation {
  network: FrequencyNetwork
  period: FrequencyPeriod
  site: string
  towardCityMinutes: number | null
  towardSuburbsMinutes: number | null
  table: 48 | 49 | 52 | 53
  observationSource: 'CUREM_EFOV_2016'
  reportPublishedOn: '2020-07'
  sourceUrl: string
}

const sourceUrl = 'https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf'

function rows(
  network: FrequencyNetwork,
  period: FrequencyPeriod,
  table: 48 | 49 | 52 | 53,
  values: readonly (readonly [string, number | null, number | null])[],
): CetudFrequencyObservation[] {
  return values.map(([site, towardCityMinutes, towardSuburbsMinutes]) => ({
    network, period, site, towardCityMinutes, towardSuburbsMinutes,
    table, observationSource: 'CUREM_EFOV_2016',
    reportPublishedOn: '2020-07', sourceUrl,
  }))
}

export const CETUD_FREQUENCY_OBSERVATIONS: readonly CetudFrequencyObservation[] = [
  ...rows('AFTU', 'weekday', 48, [
    ['2 voies entre JVC et Liberté 6', 9, 7],
    ['Est du croisement route des Niayes / route de Grand Yoff', 6, 6],
    ['Allées Papa Gueye Fall (Grande Mosquée)', 6, 3],
    ['École Manguier, face LONASE, avenue Cheikh Anta Diop', 4, 4],
    ['Avant Poste Médina, avenue Blaise Diagne', 1, 3],
    ['Avenue Bourguiba, face SENELEC Castors', 4, 3],
    ["BICIS Jet d’eau, vers Liberté 5", 7, 8],
    ["Boulevard Dial Diop, Inspection d’Académie", 15, 16],
    ['Bourguiba face PAMECAS, croisement rue 10', 5, 4],
    ['Cambérène, marché Gueule Tapée', 5, 13],
    ['Colobane IPRES', 11, 10],
    ['Corniche, hôpital Dalal Diam', 7, 8],
    ['Deux voies Camp Pénal, face prison', 7, 9],
    ['Route des Niayes, station Oil Libya', 7, 7],
    ['Nouvelle station Ciel Oil, rond-point Cambérène', 6, 4],
    ['Pôle échange Grand Médine vers unité 26', 5, 10],
    ['Pôle échange vers Police Parcelles, Patte d’Oie', 2, 4],
    ['Route des Niayes, croisement 22 vers unité 13', 18, 14],
    ['Route des Niayes, près de LPA', 7, 7],
    ['Rue 10, face Casino', 8, 9],
    ['Sud CEM Canada, C3S, route des Niayes', 5, 6],
  ]),
  ...rows('AFTU', 'saturday', 49, [
    ['2 voies entre JVC et Liberté 6', 9, 8],
    ['École Manguier, face LONASE, avenue Cheikh Anta Diop', 5, 4],
    ['Avenue Bourguiba, face SENELEC Castors', 6, 3],
    ["Boulevard Dial Diop, Inspection d’Académie", 10, 19],
    ['Colobane IPRES', 13, 10],
    ['Route des Niayes, station Oil Libya', 7, 8],
    ['Nouvelle station Ciel Oil, rond-point Cambérène', 5, 4],
    ['Route des Niayes, près de LPA', 7, 8],
  ]),
  ...rows('DDD', 'weekday', 52, [
    ['2 voies entre JVC et Liberté 6', 16, 15],
    ['Allées Papa Gueye Fall, Grande Mosquée', 10, 16],
    ['École Manguier, face LONASE, avenue Cheikh Anta Diop', 8, 9],
    ['Avant Poste Médina, avenue Blaise Diagne', 6, 11],
    ['Avenue Bourguiba, face SENELEC Castors', 11, 9],
    ['Avenue Faidherbe, sens BDT (Bamba Ndiaye)', 11, 17],
    ['Avenue Malick Sy, face polyclinique', 14, 22],
    ["BICIS Jet d’eau, vers Liberté 5", 11, 16],
    ["Boulevard Dial Diop, Inspection d’Académie", 22, 25],
    ['Bourguiba face PAMECAS, croisement rue 10', 8, 3],
    ['Colobane IPRES', 14, 15],
    ['Corniche, hôpital Dalal Diam', 29, 45],
    ['Deux voies Camp Pénal, face prison', 14, 18],
    ['Route des Niayes, station Oil Libya', 27, 29],
    ['Nouvelle station Ciel Oil, rond-point Cambérène', 10, 12],
    ['Pôle échange Grand Médine vers unité 26', 25, 52],
    ['Pôle échange vers Police Parcelles, Patte d’Oie', 12, 17],
    ['Route des Niayes, croisement 22 vers unité 13', 20, 19],
    ['Route des Niayes, près de LPA', 12, 13],
    ['Rue 10, face supermarché Casino', 27, 29],
    ['Rue Émile Badiane avant avenue Blaise Diagne', null, 12],
    ['Sud CEM SCAM ex Canada, C3S, route des Niayes', 13, 11],
  ]),
  ...rows('DDD', 'saturday', 53, [
    ['2 voies entre JVC et Liberté 6', 22, 21],
    ['École Manguier, face LONASE, avenue Cheikh Anta Diop', 11, 11],
    ['Avenue Bourguiba, face SENELEC Castors', 20, 13],
    ["Boulevard Dial Diop, Inspection d’Académie", 27, 31],
    ['Colobane IPRES', 19, 17],
    ['Route des Niayes, station Oil Libya', 39, 40],
    ['Nouvelle station Ciel Oil, rond-point Cambérène', 14, 15],
    ['Route des Niayes, près de LPA', 15, 17],
  ]),
]
