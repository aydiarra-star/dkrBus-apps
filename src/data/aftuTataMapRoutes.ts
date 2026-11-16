export interface AftuTataRouteWaypoint {
  name: string
  lat: number
  lon: number
}

export interface AftuTataMapRoute {
  id: string
  line: string
  waypoints: readonly AftuTataRouteWaypoint[]
}

/**
 * Corridors de lignes AFTU publiées, ordonnés à partir des itinéraires décrits
 * par l'opérateur. Les points sont des lieux/arrêts de référence OSM.
 * La géométrie routière est calculée entre ces points pour la carte seulement ;
 * elle ne constitue pas une trace GPS de véhicule et n'entre pas dans le planner.
 */
export const AFTU_TATA_MAP_ROUTES: readonly AftuTataMapRoute[] = [
  {
    id: 'aftu-3',
    line: '3',
    waypoints: [
      { name: 'Yoff', lat: 14.7619, lon: -17.4807 },
      { name: 'Grand Yoff', lat: 14.755, lon: -17.46 },
      { name: 'Colobane', lat: 14.7003482, lon: -17.4416523 },
      { name: 'Petersen', lat: 14.6766438, lon: -17.4406354 },
    ],
  },
  {
    id: 'aftu-35',
    line: '35',
    waypoints: [
      { name: 'Ngor', lat: 14.74879, lon: -17.51496 },
      { name: 'Yoff', lat: 14.7619, lon: -17.4807 },
      { name: 'Pikine', lat: 14.7498644, lon: -17.3916937 },
    ],
  },
  {
    id: 'aftu-59',
    line: '59',
    waypoints: [
      { name: 'Colobane', lat: 14.7003482, lon: -17.4416523 },
      { name: 'Diamaguène / Sicap Mbao', lat: 14.7561, lon: -17.3516 },
      { name: 'Mbao', lat: 14.74154, lon: -17.32615 },
      { name: 'Keur Massar', lat: 14.79, lon: -17.31 },
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
      { name: 'Bargny', lat: 14.6938, lon: -17.2297 },
    ],
  },
  {
    id: 'aftu-60',
    line: '60',
    waypoints: [
      { name: 'Keur Massar', lat: 14.78542, lon: -17.30922 },
      { name: 'Carrefour Grand Mbao', lat: 14.73753, lon: -17.30952 },
      { name: 'Thiaroy', lat: 14.7504, lon: -17.3776 },
      { name: 'Rond-point Ngor', lat: 14.74894, lon: -17.5144 },
      { name: 'Almadies', lat: 14.73475, lon: -17.50863 },
    ],
  },
  {
    id: 'aftu-66',
    line: '66',
    waypoints: [
      { name: 'Rufisque / Thiawlène', lat: 14.7159649, lon: -17.2699985 },
      { name: 'Mbao', lat: 14.74154, lon: -17.32615 },
      { name: 'Diamaguène / Sicap Mbao', lat: 14.7561, lon: -17.3516 },
      { name: 'Mermoz', lat: 14.70745, lon: -17.4744 },
      { name: 'Cité Avion', lat: 14.72223, lon: -17.48069 },
      { name: 'Ouakam', lat: 14.72474, lon: -17.48507 },
    ],
  },
  {
    id: 'aftu-73',
    line: '73',
    waypoints: [
      { name: 'Bargny', lat: 14.6938, lon: -17.2297 },
      { name: 'Rufisque', lat: 14.7159649, lon: -17.2699985 },
      { name: 'Keur Massar', lat: 14.79, lon: -17.31 },
      { name: 'Tivaouane Peulh', lat: 14.80535, lon: -17.28099 },
    ],
  },
  {
    id: 'aftu-78',
    line: '78',
    waypoints: [
      { name: 'Sangalkam', lat: 14.77877, lon: -17.22654 },
      { name: 'Ndiakhirate Digue', lat: 14.76881, lon: -17.22725 },
      { name: 'Niacourab', lat: 14.78385, lon: -17.27373 },
      { name: 'Tivaouane Peulh', lat: 14.80535, lon: -17.28099 },
      { name: 'Malika', lat: 14.80148, lon: -17.3376 },
      { name: 'Guédiawaye', lat: 14.7719791, lon: -17.3868591 },
      { name: 'Cambérène', lat: 14.771, lon: -17.4237 },
    ],
  },
  {
    id: 'aftu-80',
    line: '80',
    waypoints: [
      { name: 'Cambérène', lat: 14.771, lon: -17.4237 },
      { name: 'Pikine', lat: 14.7498644, lon: -17.3916937 },
      { name: 'Yeumbeul', lat: 14.764913, lon: -17.3565049 },
      { name: 'Malika', lat: 14.80148, lon: -17.3376 },
      { name: 'Keur Massar', lat: 14.79, lon: -17.31 },
      { name: 'Tivaouane Peulh', lat: 14.80535, lon: -17.28099 },
      { name: 'Niacourab', lat: 14.78385, lon: -17.27373 },
    ],
  },
  {
    id: 'aftu-86',
    line: '86',
    waypoints: [
      { name: 'Toubab Dialaw', lat: 14.60653, lon: -17.14706 },
      { name: 'Boune', lat: 14.76623, lon: -17.33729 },
    ],
  },
  {
    id: 'aftu-89',
    line: '89',
    waypoints: [
      { name: 'Bargny', lat: 14.6938, lon: -17.2297 },
      { name: 'Marché de Niague', lat: 14.80986, lon: -17.25161 },
    ],
  },
  {
    id: 'aftu-87',
    line: '87',
    waypoints: [
      { name: 'Bambilor', lat: 14.80391, lon: -17.18404 },
      { name: 'Keur Ndiaye Lo', lat: 14.74311, lon: -17.24378 },
      { name: 'Pikine', lat: 14.7498644, lon: -17.3916937 },
      { name: 'Mosquée Massalikoul Djinane', lat: 14.70107, lon: -17.44864 },
    ],
  },
]
