import { describe, expect, it } from 'vitest'
import {
  GARES_TER_DAKAR_DIAMNIADIO,
  genererHorairesTerDakarDiamniadio,
  TER_DAKAR_DIAMNIADIO_DUREE_MINUTES,
} from './terDakarDiamniadio'

const NOW = Date.parse('2026-10-08T12:00:00.000Z')

describe('moteur TER Dakar ↔ Diamniadio isolé', () => {
  it('déclare exactement les 13 gares du tronc commun, sans AIBD', () => {
    expect(GARES_TER_DAKAR_DIAMNIADIO).toHaveLength(13)
    expect(GARES_TER_DAKAR_DIAMNIADIO[0].id).toBe('ter-dakar')
    expect(GARES_TER_DAKAR_DIAMNIADIO.at(-1)?.id).toBe('ter-diamniadio')
    expect(GARES_TER_DAKAR_DIAMNIADIO.some((gare) => gare.id === 'ter-aibd')).toBe(false)
  })

  it('calcule un seul train aller avec des heures strictement croissantes', () => {
    const schedule = genererHorairesTerDakarDiamniadio('aller', NOW)
    expect(schedule).not.toBeNull()
    expect(schedule!.rows.map((row) => row.decalageMinutes)).toEqual([0, 4, 7, 10, 13, 16, 19, 23, 27, 32, 36, 41, 45])
    expect(schedule!.rows[0].heureFormatee).toBe(schedule!.heureDepart)
    expect(schedule!.rows.at(-1)?.decalageMinutes).toBe(45)
    for (let index = 1; index < schedule!.rows.length; index += 1) {
      expect(Date.parse(schedule!.rows[index].passageAt)).toBeGreaterThan(Date.parse(schedule!.rows[index - 1].passageAt))
    }
  })

  it('inverse exactement les gares et offsets pour le retour', () => {
    const schedule = genererHorairesTerDakarDiamniadio('retour', NOW)
    expect(schedule).not.toBeNull()
    expect(schedule!.rows.map((row) => row.id)).toEqual([...GARES_TER_DAKAR_DIAMNIADIO].reverse().map((gare) => gare.id))
    expect(schedule!.rows.map((row) => row.decalageMinutes)).toEqual([0, 4, 9, 13, 18, 22, 26, 29, 32, 35, 38, 41, 45])
    expect(schedule!.rows[0].nom).toBe('Diamniadio')
    expect(schedule!.rows.at(-1)?.nom).toBe('Dakar - Gare ferroviaire')
    for (let index = 1; index < schedule!.rows.length; index += 1) {
      expect(Date.parse(schedule!.rows[index].passageAt)).toBeGreaterThan(Date.parse(schedule!.rows[index - 1].passageAt))
    }
  })

  it('projette toutes les gares depuis le même départ de train', () => {
    const schedule = genererHorairesTerDakarDiamniadio('aller', NOW)!
    const origin = Date.parse(schedule.departAt)
    for (const row of schedule.rows) {
      expect(Date.parse(row.passageAt) - origin).toBe(row.decalageMinutes * 60_000)
    }
  })

  it('formate Dakar en HH:MM et ne produit jamais de compte à rebours négatif', () => {
    const schedule = genererHorairesTerDakarDiamniadio('aller', NOW)!
    for (const row of schedule.rows) {
      expect(row.heureFormatee).toMatch(/^\d{2}:\d{2}$/)
      expect(row.dansMinutes).toBeGreaterThanOrEqual(0)
    }
  })

  it('conserve une durée de parcours de 45 minutes', () => {
    expect(TER_DAKAR_DIAMNIADIO_DUREE_MINUTES).toBe(45)
    expect(genererHorairesTerDakarDiamniadio('aller', NOW)!.rows.at(-1)!.decalageMinutes).toBe(45)
  })
})
