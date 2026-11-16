export type GreaterDakarCoverageNetwork = 'ddd' | 'aftu_tata'

export interface GreaterDakarBusCoveragePoint {
  id: string
  name: string
  lat: number
  lon: number
  osmRef: string
  osmUrl: string
  routes: readonly { network: GreaterDakarCoverageNetwork; line: string }[]
}

/**
 * Repères de localités cités dans les itinéraires publiés DDD/AFTU.
 * Ils servent uniquement à visualiser l'étendue territoriale sur la carte :
 * ce ne sont pas des arrêts voyageurs géolocalisés ni des positions de bus.
 * Les coordonnées sont des points de localité OSM, pas des quais d'arrêt.
 */
export const GREATER_DAKAR_BUS_COVERAGE_POINTS: readonly GreaterDakarBusCoveragePoint[] = [
  {
    id: 'sangalkam',
    name: 'Sangalkam',
    lat: 14.77877,
    lon: -17.22654,
    osmRef: 'way/112591679',
    osmUrl: 'https://www.openstreetmap.org/way/112591679',
    routes: [{ network: 'ddd', line: '208' }, { network: 'aftu_tata', line: '79' }],
  },
  {
    id: 'ndiakhirate-digue',
    name: 'Ndiakhirate Digue',
    lat: 14.76881,
    lon: -17.22725,
    osmRef: 'node/2265123690',
    osmUrl: 'https://www.openstreetmap.org/node/2265123690',
    routes: [{ network: 'aftu_tata', line: '79' }],
  },
  {
    id: 'niacourab',
    name: 'Niacourab',
    lat: 14.78385,
    lon: -17.27373,
    osmRef: 'node/5347945415',
    osmUrl: 'https://www.openstreetmap.org/node/5347945415',
    routes: [{ network: 'aftu_tata', line: '79' }, { network: 'aftu_tata', line: '80' }],
  },
  {
    id: 'tivaouane-peulh',
    name: 'Tivaouane Peulh',
    lat: 14.80535,
    lon: -17.28099,
    osmRef: 'node/2447151791',
    osmUrl: 'https://www.openstreetmap.org/node/2447151791',
    routes: [{ network: 'aftu_tata', line: '74' }, { network: 'aftu_tata', line: '80' }],
  },
  {
    id: 'malika',
    name: 'Malika',
    lat: 14.80148,
    lon: -17.3376,
    osmRef: 'node/2425283072',
    osmUrl: 'https://www.openstreetmap.org/node/2425283072',
    routes: [{ network: 'aftu_tata', line: '75' }, { network: 'aftu_tata', line: '80' }],
  },
  {
    id: 'bambilor',
    name: 'Bambilor',
    lat: 14.80391,
    lon: -17.18404,
    osmRef: 'node/3679532714',
    osmUrl: 'https://www.openstreetmap.org/node/3679532714',
    routes: [{ network: 'aftu_tata', line: '87' }],
  },
  {
    id: 'bargny',
    name: 'Bargny',
    lat: 14.6938,
    lon: -17.2297,
    osmRef: 'node/1250211868',
    osmUrl: 'https://www.openstreetmap.org/node/1250211868',
    routes: [
      { network: 'aftu_tata', line: '60' },
      { network: 'aftu_tata', line: '74' },
      { network: 'aftu_tata', line: '89' },
    ],
  },
  {
    id: 'toubab-dialaw',
    name: 'Toubab Dialaw',
    lat: 14.60653,
    lon: -17.14706,
    osmRef: 'node/2614602780',
    osmUrl: 'https://www.openstreetmap.org/node/2614602780',
    routes: [{ network: 'ddd', line: '228' }, { network: 'aftu_tata', line: '86' }],
  },
  {
    id: 'yene',
    name: 'Yène',
    lat: 14.63908,
    lon: -17.17345,
    osmRef: 'node/2265074387',
    osmUrl: 'https://www.openstreetmap.org/node/2265074387',
    routes: [{ network: 'ddd', line: '228' }],
  },
  {
    id: 'mbao',
    name: 'Mbao',
    lat: 14.74154,
    lon: -17.32615,
    osmRef: 'node/8929811535',
    osmUrl: 'https://www.openstreetmap.org/node/8929811535',
    routes: [{ network: 'aftu_tata', line: '60' }, { network: 'aftu_tata', line: '67' }],
  },
  {
    id: 'diamaguene-sicap-mbao',
    name: 'Diamaguène / Sicap Mbao',
    lat: 14.7561,
    lon: -17.3516,
    osmRef: 'node/8929811542',
    osmUrl: 'https://www.openstreetmap.org/node/8929811542',
    routes: [{ network: 'aftu_tata', line: '60' }, { network: 'aftu_tata', line: '67' }],
  },
  {
    id: 'camberene',
    name: 'Cambérène',
    lat: 14.771,
    lon: -17.4237,
    osmRef: 'node/8928322722',
    osmUrl: 'https://www.openstreetmap.org/node/8928322722',
    routes: [{ network: 'aftu_tata', line: '79' }, { network: 'aftu_tata', line: '80' }],
  },
  {
    id: 'ngor',
    name: 'Ngor',
    lat: 14.74879,
    lon: -17.51496,
    osmRef: 'node/3662979628',
    osmUrl: 'https://www.openstreetmap.org/node/3662979628',
    routes: [{ network: 'aftu_tata', line: '35' }],
  },
  {
    id: 'cite-avion',
    name: 'Cité Avion',
    lat: 14.72223,
    lon: -17.48069,
    osmRef: 'node/13830662040',
    osmUrl: 'https://www.openstreetmap.org/node/13830662040',
    routes: [{ network: 'aftu_tata', line: '67' }],
  },
  {
    id: 'mermoz',
    name: 'Mermoz',
    lat: 14.70745,
    lon: -17.4744,
    osmRef: 'node/562878265',
    osmUrl: 'https://www.openstreetmap.org/node/562878265',
    routes: [{ network: 'aftu_tata', line: '67' }],
  },
  {
    id: 'yoff',
    name: 'Yoff',
    lat: 14.7619,
    lon: -17.4807,
    osmRef: 'way/369004272',
    osmUrl: 'https://www.openstreetmap.org/way/369004272',
    routes: [{ network: 'aftu_tata', line: '3' }],
  },
  {
    id: 'ouakam',
    name: 'Ouakam',
    lat: 14.72474,
    lon: -17.48507,
    osmRef: 'node/1760524533',
    osmUrl: 'https://www.openstreetmap.org/node/1760524533',
    routes: [{ network: 'ddd', line: '217' }, { network: 'aftu_tata', line: '67' }],
  },
  {
    id: 'bayakh',
    name: 'Bayakh',
    lat: 14.8296,
    lon: -17.13656,
    osmRef: 'node/4329431787',
    osmUrl: 'https://www.openstreetmap.org/node/4329431787',
    routes: [{ network: 'ddd', line: '208' }],
  },
]
