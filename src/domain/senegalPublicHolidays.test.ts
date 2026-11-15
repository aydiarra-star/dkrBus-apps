import { describe, expect, it } from 'vitest'
import { dakarCalendarDate, hasSenegalPublicHolidayCalendar, isSenegalPublicHoliday } from './senegalPublicHolidays'

describe('calendrier des jours fériés sénégalais', () => {
  it('reconnaît les dates confirmées de 2026, y compris les fêtes lunaires', () => {
    for (const date of [
      '2026-03-21', // Korité
      '2026-05-28', // Tabaski
      '2026-06-25', // Tamkharit
      '2026-08-02', // Grand Magal
      '2026-08-25', // Maouloud
      '2026-12-25', // Noël
    ]) {
      expect(isSenegalPublicHoliday(Date.parse(`${date}T12:00:00Z`))).toBe(true)
    }
  })

  it('ne classe pas un jour ordinaire comme férié', () => {
    expect(isSenegalPublicHoliday(Date.parse('2026-12-24T12:00:00Z'))).toBe(false)
  })

  it('utilise la date civile de Dakar en UTC+00', () => {
    expect(dakarCalendarDate(Date.parse('2026-12-25T00:05:00Z'))).toBe('2026-12-25')
    expect(dakarCalendarDate(Number.NaN)).toBeNull()
  })

  it('signale les années pour lesquelles le calendrier est effectivement renseigné', () => {
    expect(hasSenegalPublicHolidayCalendar(Date.parse('2026-12-25T12:00:00Z'))).toBe(true)
    expect(hasSenegalPublicHolidayCalendar(Date.parse('2027-01-01T12:00:00Z'))).toBe(false)
  })
})
