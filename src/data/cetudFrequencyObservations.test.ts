import { describe, expect, it } from 'vitest'
import { CETUD_FREQUENCY_OBSERVATIONS } from './cetudFrequencyObservations'

describe('observations de fréquence CETUD par site et par sens', () => {
  it('conserve les quatre tableaux AFTU et DDD avec leur périmètre exact', () => {
    expect(CETUD_FREQUENCY_OBSERVATIONS.filter((item) => item.network === 'AFTU' && item.period === 'weekday')).toHaveLength(21)
    expect(CETUD_FREQUENCY_OBSERVATIONS.filter((item) => item.network === 'AFTU' && item.period === 'saturday')).toHaveLength(8)
    expect(CETUD_FREQUENCY_OBSERVATIONS.filter((item) => item.network === 'DDD' && item.period === 'weekday')).toHaveLength(22)
    expect(CETUD_FREQUENCY_OBSERVATIONS.filter((item) => item.network === 'DDD' && item.period === 'saturday')).toHaveLength(8)
  })

  it('conserve les intervalles dans les deux sens sans les transformer en fréquences de ligne', () => {
    const aftuJvc = CETUD_FREQUENCY_OBSERVATIONS.find(
      (item) => item.network === 'AFTU' && item.period === 'weekday' && item.site.startsWith('2 voies'),
    )
    expect(aftuJvc).toMatchObject({ towardCityMinutes: 9, towardSuburbsMinutes: 7, table: 48 })

    const dddCorniche = CETUD_FREQUENCY_OBSERVATIONS.find(
      (item) => item.network === 'DDD' && item.period === 'weekday' && item.site.startsWith('Corniche'),
    )
    expect(dddCorniche).toMatchObject({ towardCityMinutes: 29, towardSuburbsMinutes: 45, table: 52 })
  })

  it('garde les valeurs non desservies comme null et trace la source CETUD', () => {
    const row = CETUD_FREQUENCY_OBSERVATIONS.find((item) => item.site.startsWith('Rue Émile Badiane'))
    expect(row?.towardCityMinutes).toBeNull()
    expect(row?.towardSuburbsMinutes).toBe(12)
    expect(row?.observationSource).toBe('CUREM_EFOV_2016')
    expect(row?.reportPublishedOn).toBe('2020-07')
    expect(row?.sourceUrl).toContain('cetud.sn/wp-content/uploads')
  })
})
