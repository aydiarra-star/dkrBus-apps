/** A few cells of the published weekday schedules, NOT a feed or a mapped
 * network. IDs refer to directional stop sheets, not OSM nodes/GTFS stops.
 * No coordinates, opposite-side aliases, generated intervals or geography.
 * See docs/trajets-bus-medina-maristes.md for ranks and collection scope. */
const base = 'https://moovitapp.com/index/fr/transport_en_commun-'
export const MARISTES_ID = '37702688'
export const timetableStops = [
  { id: '37702749', name: 'Terminus Guédiawaye', slug: 'Terminus_Gu%C3%A9diawaye' },
  { id: '37702627', name: 'Pikine Rue 10, 1858', slug: 'Pikine_Rue_10_1858' },
  { id: MARISTES_ID, name: 'Route des Maristes, 141', slug: 'Route_Des_Maristes_141' },
  { id: '37702002', name: 'Gare de Colobane', slug: 'Gare_De_Colobane' },
  { id: '37702678', name: 'Grands Moulins', slug: 'Grands_Moulins' },
].map(s => ({ id: s.id, name: s.name, url: `${base}${s.slug}-Dakar-stop_${s.id}-5996` }))

export interface TimetableSheet {
  mode: 'ddd' | 'aftu'; line: string; towards: string; url: string
  calls: readonly { id: string; rank: number }[]
  /** One row per actual source trip. Only the three reviewed columns, in order. */
  rows: readonly (readonly [string, string, string])[]
}
export const maristesSheets: readonly TimetableSheet[] = [
  { mode: 'ddd', line: 'DDD 12', towards: 'Palais', url: `${base}time-12-Dakar-5996-1618037-18051468-4256257-0`,
    calls: [{ id: '37702749', rank: 1 }, { id: MARISTES_ID, rank: 37 }, { id: '37702678', rank: 47 }],
    rows: [
      ['05:00','05:26','05:36'], ['05:15','05:41','05:51'], ['05:30','05:56','06:06'],
      ['18:45','19:18','19:32'], ['19:00','19:33','19:47'], ['19:15','19:48','20:01'],
    ] },
  { mode: 'aftu', line: 'AFTU 75', towards: 'Colobane', url: `${base}time-75-Dakar-5996-1618038-18051476-4256273-0`,
    calls: [{ id: '37702627', rank: 24 }, { id: MARISTES_ID, rank: 37 }, { id: '37702002', rank: 52 }],
    rows: [ // origin times at Marché: 04:46, 04:53, 05:00, 05:07, 05:14, 05:21
      ['05:07','05:19','05:31'], ['05:15','05:27','05:39'], ['05:22','05:34','05:46'],
      ['05:29','05:41','05:53'], ['05:36','05:48','06:00'], ['05:43','05:55','06:07'],
      // 18:32, 18:39, 18:46, 18:53, 19:00, 19:07
      ['19:01','19:17','19:33'], ['19:08','19:24','19:40'], ['19:15','19:31','19:47'],
      ['19:22','19:38','19:54'], ['19:29','19:45','20:01'], ['19:36','19:52','20:06'],
    ] },
]
// Application review window for these specific weekday examples, not a claim
// about the operator's expiry date. Never roll them forward into another week.
export const timetableReviewWeek = { first: '2026-11-16', last: '2026-11-20' }
