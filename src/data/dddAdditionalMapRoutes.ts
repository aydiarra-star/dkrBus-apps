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
      { name: 'Sangalkam', lat: 14.77877, lon: -17.22654 },
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
    ],
  },
  {
    id: 'ddd-220',
    line: '220',
    waypoints: [
      { name: 'Guédiawaye', lat: 14.7719791, lon: -17.3868591 },
      { name: 'Pikine', lat: 14.7498644, lon: -17.3916937 },
      { name: 'Thiaroye', lat: 14.758771, lon: -17.3802989 },
      { name: 'Mbao', lat: 14.74154, lon: -17.32615 },
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
    ],
  },
]
