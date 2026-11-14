import { describe, expect, it } from 'vitest'
import { getConnectedNetworkCount, NETWORK_SOURCES, VERIFIED_ALERTS, VERIFIED_ROUTES, VERIFIED_STOPS } from './network'

describe('initial transport catalogue', () => {
  it('does not claim any network connection before a source is configured', () => {
    expect(getConnectedNetworkCount()).toBe(0)
    expect(NETWORK_SOURCES.every((network) => network.status === 'NOT_CONNECTED')).toBe(true)
  })

  it('starts without fabricated routes, stops, or alerts', () => {
    expect(VERIFIED_ROUTES).toHaveLength(0)
    expect(VERIFIED_STOPS).toHaveLength(0)
    expect(VERIFIED_ALERTS).toHaveLength(0)
  })

  it('records official DDD and AFTU network counts without inventing line frequencies', () => {
    const ddd = NETWORK_SOURCES.find((network) => network.id === 'ddd')
    const aftu = NETWORK_SOURCES.find((network) => network.id === 'aftu_tata')
    expect(ddd?.referenceData).toMatchObject({ lineCount: 38, vehicleCount: 400, frequencyStatus: 'UNKNOWN' })
    expect(aftu?.referenceData).toMatchObject({ lineCount: 72, vehicleCount: 2300, gieCount: 14, frequencyStatus: 'UNKNOWN' })
    expect(ddd?.status).toBe('NOT_CONNECTED')
    expect(aftu?.status).toBe('NOT_CONNECTED')
    expect(ddd?.referenceData?.officialFrequencies).toEqual([])
    expect(aftu?.referenceData?.officialFrequencies).toEqual([])
  })

  it('expose une seule entrée de réseau pour AFTU / TATA', () => {
    const unified = NETWORK_SOURCES.filter((network) => network.id === 'aftu_tata')
    expect(unified).toHaveLength(1)
    expect(unified[0]).toMatchObject({ label: 'AFTU / TATA', referenceData: { lineCount: 72, vehicleCount: 2300, gieCount: 14, serviceStart: '06:00', serviceEnd: '22:50' } })
    expect(NETWORK_SOURCES.map((network) => network.id)).toEqual(['ter', 'brt', 'ddd', 'aftu_tata'])
  })
})
