export interface DddAdditionalMapRoute {
  id: string
  line: string
  waypoints: readonly { name: string; lat: number; lon: number }[]
}

/** Lignes DDD publiées sans géométrie ArcGIS exploitable dans le registre des couches. */
export const DDD_ADDITIONAL_MAP_ROUTES: readonly DddAdditionalMapRoute[] = [
  {
    id: 'ddd-208',
    line: '208',
    waypoints: [
      { name: 'Bayakh', lat: 14.8296, lon: -17.13656 },
      { name: 'Gorom 1', lat: 14.82145, lon: -17.15298 },
      { name: 'Gorom 2', lat: 14.81114, lon: -17.17098 },
      { name: 'Bambilor', lat: 14.80391, lon: -17.18404 },
      { name: 'Noflaye', lat: 14.78641, lon: -17.2157 },
      { name: 'Sangalkam', lat: 14.77877, lon: -17.22654 },
      { name: 'Keur Ndiaye Lo', lat: 14.74311, lon: -17.24378 },
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
    ],
  },
  {
    id: 'ddd-220',
    line: '220',
    waypoints: [
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
      { name: 'Keur Massar', lat: 14.79, lon: -17.31 },
      { name: 'Malika', lat: 14.80148, lon: -17.3376 },
      { name: 'Carrefour Marché Boubess', lat: 14.77629, lon: -17.37383 },
      { name: 'Guédiawaye', lat: 14.7719791, lon: -17.3868591 },
    ],
  },
  {
    id: 'ddd-227',
    line: '227',
    waypoints: [
      { name: 'Terminus Keur Massar', lat: 14.78542, lon: -17.30922 },
      { name: 'Route de Malika', lat: 14.793653, lon: -17.336456 },
      { name: 'Terminus Guédiawaye', lat: 14.77277, lon: -17.38922 },
      { name: 'Case Ba', lat: 14.756216, lon: -17.42975 },
      { name: 'Terminus Parcelles Assainies', lat: 14.76043, lon: -17.439267 },
    ],
  },
]
