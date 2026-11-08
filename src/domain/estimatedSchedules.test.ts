import { describe, expect, it } from 'vitest'
import { AFTU_ESTIMATED_LINE_SCHEDULES, DDD_ESTIMATED_LINE_SCHEDULES } from './estimatedSchedules'

describe('affiches horaires estimatives des réseaux', () => {
  it('recense les 28 lignes AFTU indexées et conserve les plages de semaine et de week-end', () => {
    expect(AFTU_ESTIMATED_LINE_SCHEDULES).toHaveLength(28)
    expect(AFTU_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '42')).toMatchObject({
      weekday: { start: '05:50', end: '21:50', interval: '15 min' },
      saturday: { start: '06:00', end: '21:50', interval: '25 min' },
      sunday: { start: '06:00', end: '21:50', interval: '25 min' },
    })
    expect(AFTU_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '5')?.sunday?.interval).toBe('20 min')
  })

  it('recense les 13 lignes DDD indexées et ajoute les départs publiés de la ligne 1', () => {
    expect(DDD_ESTIMATED_LINE_SCHEDULES).toHaveLength(14)
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '1')).toMatchObject({
      weekday: null,
      saturday: null,
      sunday: null,
    })
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '403')?.weekday?.interval).toBe('12 min')
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '15')?.note).toContain('69 arrêts')
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '15')?.note).toContain('repère de planification')
    expect(DDD_ESTIMATED_LINE_SCHEDULES.find((line) => line.line === '218')?.sunday).toBeNull()
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
