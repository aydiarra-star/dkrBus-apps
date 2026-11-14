import { describe, expect, it } from 'vitest'
import { AFTU_CETUD_SCHEDULE_SETTINGS as settings } from './aftuScheduleSettings'

describe('paramètres horaires officiels CETUD — AFTU', () => {
  it('conserve la provenance CETUD et le statut de référence validée', () => {
    expect(settings.source).toMatchObject({
      authority: 'CETUD',
      status: 'official-reference',
      validatedByProjectOwner: true,
    })
  })

  it('protège les plages de service et les intervalles de fréquence', () => {
    expect(settings.generalServiceWindow).toEqual({ start: '05:30', end: '22:00' })
    expect(settings.peakPeriods).toEqual([
      { start: '06:00', end: '09:00' },
      { start: '17:00', end: '20:00' },
    ])
    expect(settings.peakIntervalMinutes).toEqual({ min: 10, max: 15 })
    expect(settings.offPeakIntervalMinutes).toEqual({ min: 25, max: 40 })
  })

  it('protège les paramètres de parcours documentés pour la ligne 90', () => {
    expect(settings.line90).toEqual({
      averageJourneyMinutes: { min: 75, max: 90 },
      outboundStops: 82,
      inboundStops: 82,
    })
  })
})
