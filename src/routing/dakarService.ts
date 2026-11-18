import { OFFICIAL_REFERENCE_FREQUENCIES, type ServiceDay } from '../domain/frequencies'
import type { FrequencyWindow, Service } from './model'

const weekdays: readonly ServiceDay[] = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const seconds = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return 3600 * h + 60 * m }
export const phaseOneService: Service = {
  kind: 'frequency', source: 'Grille TER du dépôt · segment Dakar–Diamniadio uniquement',
  windows: OFFICIAL_REFERENCE_FREQUENCIES.ter.filter(f => f.routeSegment === 'DAKAR_DIAMNIADIO').map(f => ({
    start: seconds(f.serviceStart), end: seconds(f.serviceEnd), every: f.headwayMinutes * 60,
    weekdays: f.days.map(d => weekdays.indexOf(d)), holidays: f.appliesToPublicHolidays ? 'include' : f.excludesPublicHolidays ? 'exclude' : 'as-weekday',
  })),
}
// Scoped to passenger routing. The existing BRT display/grid is frozen.
const weekday: FrequencyWindow = { start: 6 * 3600, end: 21 * 3600, every: 360, weekdays: [1,2,3,4,5,6], holidays: 'exclude' }
export function brtService(line: 'B1' | 'B2'): Service {
  return { kind: 'frequency', source: `Référence de calcul ${line} · mission Dakar Bus du 18/11/2026`,
    windows: line === 'B2' ? [weekday] : [weekday,
      { start: 6 * 3600, end: 11 * 3600, every: 600, weekdays: [0], holidays: 'include' },
      { start: 11 * 3600, end: 21 * 3600, every: 420, weekdays: [0], holidays: 'include' },
    ] }
}
