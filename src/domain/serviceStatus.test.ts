import { describe, expect, it } from 'vitest'
import { getServiceDisplayState } from './serviceStatus'

/** Construit un instant UTC à partir de l'heure et des minutes de Dakar (UTC+0). */
function dakarTime(hours: number, minutes: number): number {
  // Date arbitraire : 2026-10-11 (samedi). Seules les heures/minutes importent.
  return Date.UTC(2026, 9, 11, hours, minutes)
}

describe('getServiceDisplayState', () => {
  describe('BRT (06:00–21:00)', () => {
    const START = '06:00'
    const END = '21:00'

    it('est ACTIVE pendant le service', () => {
      const result = getServiceDisplayState(dakarTime(8, 0), START, END)
      expect(result.status).toBe('ACTIVE')
      expect(result.showCountdown).toBe(true)
      expect(result.label).toBe('En service')
    })

    it('est ACTIVE juste avant la fin', () => {
      const result = getServiceDisplayState(dakarTime(20, 59), START, END)
      expect(result.status).toBe('ACTIVE')
    })

    it('est FINISHED après la fin du service', () => {
      const result = getServiceDisplayState(dakarTime(22, 0), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
      expect(result.label).toBe('Fin de service')
    })

    it('est FINISHED en pleine nuit (avant la fenêtre de reprise)', () => {
      const result = getServiceDisplayState(dakarTime(2, 0), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
      expect(result.label).toBe('Fin de service')
    })

    it('est FINISHED à 4h45 (avant la fenêtre de reprise de 5h00)', () => {
      const result = getServiceDisplayState(dakarTime(4, 45), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })

    it('est UPCOMING à 5h00 (1h avant le démarrage)', () => {
      const result = getServiceDisplayState(dakarTime(5, 0), START, END)
      expect(result.status).toBe('UPCOMING')
      expect(result.showCountdown).toBe(true)
      expect(result.label).toContain('Reprise')
    })

    it('est UPCOMING à 5h30 (30 min avant le démarrage)', () => {
      const result = getServiceDisplayState(dakarTime(5, 30), START, END)
      expect(result.status).toBe('UPCOMING')
      expect(result.showCountdown).toBe(true)
    })

    it('est UPCOMING à 5h59 (1 min avant le démarrage)', () => {
      const result = getServiceDisplayState(dakarTime(5, 59), START, END)
      expect(result.status).toBe('UPCOMING')
      expect(result.showCountdown).toBe(true)
    })
  })

  describe('TER (05:30–22:00)', () => {
    const START = '05:30'
    const END = '22:00'

    it('est ACTIVE à 08h00', () => {
      const result = getServiceDisplayState(dakarTime(8, 0), START, END)
      expect(result.status).toBe('ACTIVE')
    })

    it('est FINISHED à 23h00', () => {
      const result = getServiceDisplayState(dakarTime(23, 0), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })

    it('est FINISHED à 3h00', () => {
      const result = getServiceDisplayState(dakarTime(3, 0), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })

    it('est UPCOMING à 4h30 (1h avant le démarrage à 05:30)', () => {
      const result = getServiceDisplayState(dakarTime(4, 30), START, END)
      expect(result.status).toBe('UPCOMING')
      expect(result.showCountdown).toBe(true)
    })

    it('est FINISHED à 4h29 (avant la fenêtre de reprise)', () => {
      const result = getServiceDisplayState(dakarTime(4, 29), START, END)
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })
  })

  describe('Données invalides', () => {
    it('retourne FINISHED si l\'heure de début est invalide', () => {
      const result = getServiceDisplayState(dakarTime(8, 0), 'invalid', '22:00')
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })

    it('retourne FINISHED si l\'heure de fin est invalide', () => {
      const result = getServiceDisplayState(dakarTime(8, 0), '06:00', 'invalid')
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })

    it('retourne FINISHED si now est NaN', () => {
      const result = getServiceDisplayState(NaN, '06:00', '22:00')
      expect(result.status).toBe('FINISHED')
      expect(result.showCountdown).toBe(false)
    })
  })
})
