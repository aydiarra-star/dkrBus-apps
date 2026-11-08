export interface EstimatedFrequencyWindow {
  start: string
  end: string
  interval: string
}

export interface EstimatedLineSchedule {
  line: string
  weekday: EstimatedFrequencyWindow | null
  saturday: EstimatedFrequencyWindow | null
  sunday: EstimatedFrequencyWindow | null
  sourceUrl: string
  sourceLabel: string
  note?: string
}

const aftuUrl = (line: string) => `https://transitbycity.com/fr/senegal/dakar/operators/aftu/routes/${line.toLowerCase()}/`
const dddUrl = (line: string) => `https://transitbycity.com/fr/senegal/dakar/operators/dakar-dem-dikk/routes/${line.toLowerCase()}/`
const tb = 'TransitByCity · 28/05/2026'
const w = (start: string, end: string, interval: number | string): EstimatedFrequencyWindow => ({
  start,
  end,
  interval: typeof interval === 'number' ? `${interval} min` : interval,
})

/**
 * Horaires de service et fréquences estimatives de lignes indexées par
 * TransitByCity, dont la dernière actualisation affichée est le 28/05/2026.
 * Les lignes dont l'identifiant ne correspond pas exactement au catalogue
 * officiel actuellement affiché sont volontairement exclues des panneaux.
 * Ces données tierces sont des repères de planification, jamais des horaires
 * officiels ni des prédictions de prochain véhicule.
 */
export const AFTU_ESTIMATED_LINE_SCHEDULES: readonly EstimatedLineSchedule[] = [
  { line: '5', weekday: w('06:00', '23:00', 10), saturday: w('06:00', '23:00', 15), sunday: w('06:00', '23:00', 20), sourceUrl: aftuUrl('5'), sourceLabel: tb },
  { line: '29', weekday: w('05:10', '22:58', 12), saturday: w('05:15', '22:55', 20), sunday: w('05:15', '22:55', 20), sourceUrl: aftuUrl('29'), sourceLabel: tb },
  { line: '30', weekday: w('05:15', '21:51', 12), saturday: w('05:30', '22:30', 30), sunday: w('05:30', '22:30', 30), sourceUrl: aftuUrl('30'), sourceLabel: tb },
  { line: '32', weekday: w('05:00', '21:54', 13), saturday: w('05:20', '22:00', 20), sunday: w('05:20', '22:00', 20), sourceUrl: aftuUrl('32'), sourceLabel: tb },
  { line: '33', weekday: w('04:30', '22:45', 15), saturday: w('04:45', '22:40', 25), sunday: w('04:45', '22:40', 25), sourceUrl: aftuUrl('33'), sourceLabel: tb },
  { line: '36', weekday: w('05:30', '22:30', 15), saturday: w('05:45', '22:05', 20), sunday: w('05:45', '22:05', 20), sourceUrl: aftuUrl('36'), sourceLabel: tb },
  { line: '39', weekday: w('04:50', '22:49', 13), saturday: w('05:00', '22:51', 17), sunday: w('05:00', '22:51', 17), sourceUrl: aftuUrl('39'), sourceLabel: tb },
  { line: '41', weekday: w('05:30', '22:47', 17), saturday: w('05:50', '22:38', 28), sunday: w('05:50', '22:38', 28), sourceUrl: aftuUrl('41'), sourceLabel: tb },
  { line: '42', weekday: w('05:50', '21:50', 15), saturday: w('06:00', '21:50', 25), sunday: w('06:00', '21:50', 25), sourceUrl: aftuUrl('42'), sourceLabel: tb },
  { line: '43', weekday: w('04:40', '23:00', 10), saturday: w('05:00', '23:00', 20), sunday: w('05:00', '23:00', 20), sourceUrl: aftuUrl('43'), sourceLabel: tb },
  { line: '46', weekday: w('04:40', '22:00', 20), saturday: w('05:00', '22:00', 30), sunday: w('05:00', '22:00', 30), sourceUrl: aftuUrl('46'), sourceLabel: tb },
  { line: '47', weekday: w('04:10', '20:58', 12), saturday: w('04:30', '20:56', 17), sunday: w('04:30', '20:56', 17), sourceUrl: aftuUrl('47'), sourceLabel: tb },
  { line: '49', weekday: w('03:55', '20:59', 16), saturday: w('04:00', '21:00', 20), sunday: w('04:00', '21:00', 20), sourceUrl: aftuUrl('49'), sourceLabel: tb },
  { line: '51', weekday: w('04:40', '21:56', 14), saturday: w('05:00', '22:00', 20), sunday: w('05:00', '22:00', 20), sourceUrl: aftuUrl('51'), sourceLabel: tb },
  { line: '53', weekday: w('05:50', '21:59', 17), saturday: w('06:05', '21:51', 22), sunday: w('06:05', '21:51', 22), sourceUrl: aftuUrl('53'), sourceLabel: tb, note: 'Le tracé actuellement enregistré dans l’application doit être réconcilié avec l’itinéraire AFTU avant d’utiliser cette fréquence dans le tableau par arrêt.' },
  { line: '62', weekday: w('04:20', '21:50', 15), saturday: w('04:40', '22:10', 25), sunday: w('04:40', '22:10', 25), sourceUrl: aftuUrl('62'), sourceLabel: tb },
  { line: '63', weekday: w('04:47', '21:54', 13), saturday: w('05:00', '21:00', 24), sunday: w('05:00', '21:00', 24), sourceUrl: aftuUrl('63'), sourceLabel: tb, note: 'Ligne circulaire selon l’index consulté.' },
  { line: '64', weekday: w('04:20', '21:50', 15), saturday: w('04:30', '21:50', 20), sunday: w('04:30', '21:50', 20), sourceUrl: aftuUrl('64'), sourceLabel: tb },
  { line: '66', weekday: w('04:50', '20:50', 20), saturday: w('05:00', '21:00', 30), sunday: w('05:00', '21:00', 30), sourceUrl: aftuUrl('66'), sourceLabel: tb },
  { line: '67', weekday: w('05:10', '22:52', 9), saturday: w('05:20', '22:45', 19), sunday: w('05:20', '22:45', 19), sourceUrl: aftuUrl('67'), sourceLabel: tb },
  { line: '72', weekday: w('05:50', '21:50', 20), saturday: w('06:00', '21:50', 25), sunday: w('06:00', '21:50', 25), sourceUrl: aftuUrl('72'), sourceLabel: tb },
  { line: '73', weekday: w('05:50', '22:55', 25), saturday: w('06:00', '22:55', 35), sunday: w('06:00', '22:55', 35), sourceUrl: aftuUrl('73'), sourceLabel: tb },
  { line: '76', weekday: w('04:55', '21:52', 9), saturday: w('05:05', '21:53', 14), sunday: w('05:05', '21:53', 14), sourceUrl: aftuUrl('76'), sourceLabel: tb },
  { line: '79', weekday: w('06:20', '22:20', 20), saturday: w('06:30', '22:30', 40), sunday: w('06:30', '22:30', 40), sourceUrl: aftuUrl('79'), sourceLabel: tb },
  { line: '80', weekday: w('04:50', '20:40', 25), saturday: w('05:00', '21:00', 30), sunday: w('05:00', '21:00', 30), sourceUrl: aftuUrl('80'), sourceLabel: tb },
  { line: '81', weekday: w('05:30', '22:00', 18), saturday: w('05:40', '21:46', 23), sunday: w('05:40', '21:46', 23), sourceUrl: aftuUrl('81'), sourceLabel: tb },
  { line: '84', weekday: w('03:50', '21:48', 14), saturday: w('04:00', '22:00', 18), sunday: w('04:00', '22:00', 18), sourceUrl: aftuUrl('84'), sourceLabel: tb },
]

export const DDD_ESTIMATED_LINE_SCHEDULES: readonly EstimatedLineSchedule[] = [
  { line: '1', weekday: null, saturday: null, sunday: null, sourceUrl: 'https://fr.linkedin.com/posts/dakar-dem-dikk_dakardemdikk-mobility-urbain-activity-7356651804501102593-rCq3', sourceLabel: 'Dakar Dem Dikk · départs publiés', note: 'Parcelles Assainies : premier départ 05:30, dernier 20:30 · Leclerc : premier départ 06:30, dernier 21:00.' },
  { line: '6', weekday: w('04:30', '21:25', 7), saturday: w('05:00', '22:00', 12), sunday: w('05:00', '22:00', 17), sourceUrl: dddUrl('6'), sourceLabel: tb },
  { line: '12', weekday: w('06:00', '21:52', 17), saturday: w('06:00', '21:43', 23), sunday: w('06:00', '21:57', 33), sourceUrl: dddUrl('12'), sourceLabel: tb },
  { line: '16A', weekday: w('05:15', '21:58', 17), saturday: w('05:40', '22:00', 20), sunday: w('05:40', '22:00', 20), sourceUrl: dddUrl('16a'), sourceLabel: tb },
  { line: '16B', weekday: w('05:00', '23:30', 15), saturday: w('06:00', '22:40', 25), sunday: w('06:00', '23:00', 30), sourceUrl: dddUrl('16b'), sourceLabel: tb },
  { line: '217', weekday: w('05:45', '19:30', 25), saturday: w('06:30', '20:00', 20), sunday: w('07:00', '20:00', 25), sourceUrl: dddUrl('217'), sourceLabel: tb },
  { line: '218', weekday: w('05:45', '19:30', 25), saturday: w('06:30', '20:00', 20), sunday: null, sourceUrl: dddUrl('218'), sourceLabel: tb, note: 'Pas de service le dimanche selon la fiche consultée.' },
  { line: '219', weekday: w('06:40', '20:40', 20), saturday: w('07:00', '19:55', 25), sunday: w('08:30', '20:10', 25), sourceUrl: dddUrl('219'), sourceLabel: tb },
  { line: '227', weekday: w('06:30', '20:30', 30), saturday: w('06:30', '20:30', 30), sunday: w('07:00', '21:00', 30), sourceUrl: dddUrl('227'), sourceLabel: tb },
]
