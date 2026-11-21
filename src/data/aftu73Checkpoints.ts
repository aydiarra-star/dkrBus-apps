/** Only elapsed whole minutes at three ranked checkpoints of each column
 * (origin, CEM Thiaroye, arrival). Moovit weekly sheets of 16 November 2026.
 * No GTFS IDs, dated runs, stop coordinates or transfer assumptions. */
export interface CheckpointColumns {
  start: string; every: number
  cem: readonly number[] | number
  arrival: readonly number[]
}
interface Sheet {
  page: string; grid: string; from: string; to: string; sequence: number
  origin: string; cemRank: number; terminal: string
  weekday: CheckpointColumns; weekend: CheckpointColumns
}
const base = 'https://moovitapp.com/index/fr/transport_en_commun-'
const line = '73-Dakar-5996-1618038-18051511-'
export const AFTU73_SHEETS: readonly Sheet[] = [
  {
    page: `${base}line-${line}1`, grid: `${base}time-${line}4256342-0`, from: 'Lac Rose', to: 'Thiaroye', sequence: 3305292827,
    origin: 'Terminus 73', cemRank: 74, terminal: 'Dépot Thiaroye',
    weekday: { start: '05:55', every: 28,
      cem: [58,64,72,75,75,75,75,71,66,63,63,63,63,63,63,63,63,63,67,73,75,75,75,75,75,75,75,75,72,65,59,58,58,57,55,54,54],
      arrival: [59,66,74,77,77,77,77,72,68,64,64,64,64,64,64,64,64,64,69,74,77,77,77,77,77,77,77,77,73,67,60,59,59,58,56,55,55] },
    weekend: { start: '06:05', every: 38,
      cem: [58,70,75,75,75,70,64,63,63,63,63,63,63,67,75,75,75,75,75,75,75,66,58,58,57,54,54],
      arrival: [60,72,77,77,77,72,65,64,64,64,64,64,64,69,76,77,77,77,77,77,77,68,59,59,58,55,55] },
  },
  {
    page: `${base}line-${line}0`, grid: `${base}time-${line}4256343-0`, from: 'Thiaroye', to: 'Lac Rose', sequence: 58467874,
    origin: 'Dépot Thiaroye', cemRank: 2, terminal: 'Terminus 73',
    weekday: { start: '05:50', every: 25, cem: 1,
      arrival: [59,63,70,77,77,77,77,76,72,68,64,64,64,64,64,64,64,64,64,64,66,71,77,77,77,77,77,77,77,77,77,76,71,65,59,59,59,58,56,55,55,55] },
    weekend: { start: '06:00', every: 35, cem: 1,
      arrival: [59,69,77,77,77,75,69,64,64,64,64,64,64,64,66,73,77,77,77,77,77,77,75,67,59,59,58,56,55,55] },
  },
]
