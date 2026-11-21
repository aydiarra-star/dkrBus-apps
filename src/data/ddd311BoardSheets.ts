/** Moovit, route 18051435, timetables updated 16 November 2026. Each row
 * is one numbered occurrence; the end calls have no published name. Both
 * directions have 42 calls but different orders. Store elapsed minutes for
 * recurring runs, including the departures crossing a change of pace. */
const url = 'https://moovitapp.com/index/fr/transport_en_commun-'
const calls = (names: Record<number, string>) => Array.from({ length: 42 }, (_, i) => names[i + 1] ?? 'Arrêt De Bus')
const suffix = (base: number[], last: number[]) => [...base.slice(0, base.length - last.length), ...last]

const rn1Quiet = [0,0,2,4,5,6,7,7,8,9,9,10,12,13,15,16,17,18,19,20,21,22,23,23,24,25,26,27,28,28,30,31,32,34,34,35,35,36,37,37,39,41]
const rn1Peak = [0,1,2,5,6,8,8,9,10,11,11,12,14,16,18,20,20,22,23,25,26,26,28,28,29,30,32,32,33,34,36,37,39,40,41,42,43,43,44,45,47,49]
const rn1First = [0,0,2,4,5,6,6,7,7,8,9,9,11,12,13,15,16,17,18,19,20,20,21,22,22,23,24,25,25,26,28,29,30,31,32,33,33,33,34,35,38,40]
const lacQuiet = [0,1,3,3,4,5,6,6,7,8,9,10,12,13,13,14,15,16,17,17,18,19,20,21,22,23,24,26,27,29,30,31,31,32,33,33,34,35,36,38,40,41]
const lacPeak = [0,2,3,4,5,6,7,7,8,9,11,12,14,15,16,17,19,20,20,21,22,23,24,25,27,28,29,31,32,34,36,37,38,39,40,40,41,42,43,46,48,49]
const sheet = (page: string, table: string) => ({
  source: `${url}line-311-Dakar-5996-1618037-18051435-${page}`,
  timetable: `${url}time-311-Dakar-5996-1618037-18051435-${table}-0`,
})
export const DDD311_SHEETS = [
  {
    ...sheet('1','4256190'), from: 'Lac Rose', to: 'RN 1',
    week: { weekday:[{ start:'06:30', end:'20:00', every:30 }], saturday:[{ start:'07:00', end:'19:45', every:45 }], sunday:[] },
    points: calls({4:'École Elémentaire Niaga',5:'Cem Niaga',8:'Marché De Niaga',19:'Route Du Lac Rose / Route De Keur Massar',23:'Mosquée',33:'Cimetiére De Keur Massar',34:'École Keur Massar',41:'Garage Keur Massar'}),
    quiet: rn1Quiet, busy: rn1Peak, byOrigin: {
      '06:30': rn1First,
      '09:15': suffix(rn1Peak,[46,48]),
      '09:30': suffix(rn1Peak,[31,32,33,33,35,36,37,39,39,40,40,41,42,42,44,46]),
      '14:30': suffix(rn1Quiet,[33,34,35,36,36,37,38,39,41,43]),
      '19:30': suffix(rn1Peak,[31,32,32,33,35,36,37,38,38,39,39,40,41,41,43,45]),
      '19:45': suffix(rn1Peak,[17,19,19,20,22,23,23,24,25,25,26,27,28,29,29,30,31,32,34,35,35,36,36,37,38,38,40,41]),
      '20:00': suffix(rn1First,[30,31,32,32,33,33,34,34,36,38]),
    },
  },
  {
    ...sheet('0','4256191'), from: 'RN 1', to: 'Lac Rose',
    week: { weekday:[{ start:'07:00', end:'20:00', every:30 }], saturday:[{ start:'07:30', end:'19:30', every:45 }], sunday:[] },
    points: calls({2:'Garage Keur Massar',3:'Roue De Keur Massar / Bvar. Ainoumady',9:'École Keur Massar',10:'Cimetiére De Keur Massar',20:'Mosquée',24:'Route De Keur Massar / Route Du Lac Rose',35:'Marché De Niaga',38:'Cem Niaga',39:'École Elémentaire Niaga'}),
    quiet: lacQuiet, busy: lacPeak, byOrigin: {
      '09:30': suffix(lacPeak,[35,36,37,38,38,39,39,40,41,44,45,46]),
      '09:45': suffix(lacPeak,[18,19,19,20,21,21,22,23,25,26,27,28,30,31,33,33,34,35,36,36,37,38,39,41,42,43]),
      '14:30': suffix(lacQuiet,[32,33,33,34,34,36,37,40,42,43]),
      '19:30': suffix(lacPeak,[35,36,36,37,38,38,39,40,40,43,44,45]),
      '20:00': [0,1,3,3,4,5,5,6,6,7,8,9,11,12,12,13,14,15,15,16,17,17,18,19,20,21,22,24,25,26,28,28,29,30,30,31,31,32,33,35,37,38],
    },
  },
] as const

// Column membership on the two printed tables (weekday and Saturday); no
// cadence expansion or default peak-hour rule is evidence of a source cell.
// Compress only columns whose 42 printed elapsed minutes are identical.
const [rn1, lac] = DDD311_SHEETS
const col = (origins: string, elapsed: readonly number[]) => ({ origins: origins.split(' '), elapsed })
const regularPeaks = '07:00 07:30 08:00 08:30 09:00 15:00 15:30 16:00 16:30 17:00 17:30 18:00 18:30 19:00'
const middle = '10:00 10:30 11:00 11:30 12:00 12:30 13:00 13:30 14:00'
export const DDD311_PRINTED = [
  { sheet: rn1, weekday: [col('06:30',rn1First), col(regularPeaks,rn1Peak), col('09:30',rn1.byOrigin['09:30']), col(middle,rn1Quiet),
      col('14:30',rn1.byOrigin['14:30']), col('19:30',rn1.byOrigin['19:30']), col('20:00',rn1.byOrigin['20:00'])],
    saturday: [col('07:00 07:45 08:30 15:15 16:00 16:45 17:30 18:15 19:00',rn1Peak), col('09:15',rn1.byOrigin['09:15']),
      col('10:00 10:45 11:30 12:15 13:00 13:45',rn1Quiet), col('14:30',rn1.byOrigin['14:30']), col('19:45',rn1.byOrigin['19:45'])] },
  { sheet: lac, weekday: [col(regularPeaks,lacPeak), col('09:30',lac.byOrigin['09:30']), col(middle,lacQuiet),
      col('14:30',lac.byOrigin['14:30']), col('19:30',lac.byOrigin['19:30']), col('20:00',lac.byOrigin['20:00'])],
    saturday: [col('07:30 08:15 09:00 15:00 15:45 16:30 17:15 18:00 18:45',lacPeak), col('09:45',lac.byOrigin['09:45']),
      col('10:30 11:15 12:00 12:45 13:30 14:15',lacQuiet), col('19:30',lac.byOrigin['19:30'])] },
] as const
