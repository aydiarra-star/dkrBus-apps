import { describe, expect, it } from 'vitest'
import { AFTU_ESTIMATED_LINE_SCHEDULES, DDD_ESTIMATED_LINE_SCHEDULES } from './estimatedSchedules'

describe('affiches horaires estimatives des réseaux', () => {
  it('recense les 27 lignes AFTU dont l’identifiant concorde avec le catalogue et conserve les plages de semaine et de week-end', () => {
    expect(AFTU_ESTIMATED_LINE_SCHEDULES).toHaveLength(27)
    expect(AFTU_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '42')).toMatchObject({
      weekday: { start: '05:50', end: '21:50', interval: '15 min' },
      saturday: { start: '06:00', end: '21:50', interval: '25 min' },
      sunday: { start: '06:00', end: '21:50', interval: '25 min' },
    })
    expect(AFTU_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '5')?.sunday?.interval).toBe('20 min')
  })

  it('recense les 9 lignes DDD dont l’identifiant concorde avec le catalogue et conserve la ligne 1 sans fréquence', () => {
    expect(DDD_ESTIMATED_LINE_SCHEDULES).toHaveLength(10)
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '1')).toMatchObject({
      weekday: null,
      saturday: null,
      sunday: null,
    })
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '218')?.sunday).toBeNull()
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '319')).toMatchObject({
      weekday: { start: '06:55', end: '21:48', interval: '19 min' },
      saturday: { start: '07:05', end: '21:35', interval: '29 min' },
      sunday: { start: '07:05', end: '21:35', interval: '29 min' },
      sourceLabel: 'Moovit · horaires de la ligne 319',
    })
    expect(DDD_ESTIMATED_LINE_SCHEDULES.some((line) => ['2A', '15', '403', '404B'].includes(line.line))).toBe(false)
    expect(AFTU_ESTIMATED_LINE_SCHEDULES.some((line) => line.line === '2B')).toBe(false)
  })

  it('ne laisse aucune plage de service incomplète pour les lignes estimées', () => {
    for (const line of [...AFTU_ESTIMATED_LINE_SCHEDULES, ...DDD_ESTIMATED_LINE_SCHEDULES]) {
      for (const window of [line.weekday, line.saturday, line.sunday]) {
        if (!window) continue
        expect(window.start).toMatch(/^\d{2}:\d{2}$/)
        expect(window.end).toMatch(/^\d{2}:\d{2}$/)
        expect(window.interval.length).toBeGreaterThan(0)
      }
      expect(line.sourceUrl).toMatch(/^https:\/\//)
    }
  })
})
