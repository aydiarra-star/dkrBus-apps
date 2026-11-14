import { describe, expect, it } from 'vitest'
import line85 from './aftu-85-directions.json'
import line86 from './aftu-86-directions.json'
import line87 from './aftu-87-directions.json'
import line88 from './aftu-88-directions.json'
import line89 from './aftu-89-directions.json'
import line91 from './aftu-91-directions.json'
import {
  AFTU_OFFICIAL_INDEX_CHECKED_ON,
  AFTU_OFFICIAL_INDEX_CROSSWALK,
  AFTU_OFFICIAL_INDEX_URL,
  getAftuOfficialIndexCrosswalk,
} from './aftuOfficialIndexCrosswalk'

describe('official AFTU public index crosswalk', () => {
  it('records the official corridor titles in their correct line-number positions', () => {
    expect(AFTU_OFFICIAL_INDEX_CHECKED_ON).toBe('2026-11-14')
    expect(AFTU_OFFICIAL_INDEX_URL).toBe('https://aftu-senegal.org/infos-pratiques/')
    expect(AFTU_OFFICIAL_INDEX_CROSSWALK.map(({ line }) => line)).toEqual([
      '85', '86', '87', '88', '89', '91',
    ])
    expect(getAftuOfficialIndexCrosswalk('88')?.officialCorridor).toBe('MTOA – Liberté 5')
    expect(getAftuOfficialIndexCrosswalk('89')?.officialCorridor).toBe('Bargny – Croisement Niague (Cité SICAP)')
    expect(getAftuOfficialIndexCrosswalk('91')?.officialCorridor).toBe('APIX – Dougar')
    expect(getAftuOfficialIndexCrosswalk('90')).toBeNull()
  })

  it('keeps the stored line 88 sequence distinct from the index corridor title', () => {
    expect(line88.stopCount).toEqual({ outbound: 78, inbound: 81 })
    expect(line88.directions.outbound.waypoints[0]).toBe('Terminus 88')
    expect(line88.directions.outbound.waypoints.at(-1)).toBe('Terminus Liberté 5')
    expect(line88.directions.inbound.waypoints[0]).toBe('Terminus Liberté 5')
    expect(line88.directions.inbound.waypoints.at(-1)).toBe('Terminus 88')
    expect(line88.directions.outbound.waypoints).toContain('Station Mtoa')
    expect(getAftuOfficialIndexCrosswalk('88')?.status).toBe('corridor_overlap_endpoint_identity_unconfirmed')
  })

  it('keeps the stored line 89 sequence and does not rename Terminus 89 automatically', () => {
    expect(line89.stopCount).toEqual({ outbound: 55, inbound: 53 })
    expect(line89.directions.outbound.waypoints[0]).toBe('Terminus 89')
    expect(line89.directions.outbound.waypoints.at(-1)).toBe('Poste Courant Bargny Près De La Gare Ter')
    expect(line89.directions.inbound.waypoints[0]).toBe('Poste Courant Bargny Près De La Gare Ter')
    expect(line89.directions.inbound.waypoints.at(-1)).toBe('Terminus 89')
    expect(line89.directions.outbound.waypoints.some((stop: string) => stop.includes('Croisement Niague'))).toBe(true)
    expect(getAftuOfficialIndexCrosswalk('89')?.status).toBe('corridor_overlap_endpoint_identity_unconfirmed')
  })

  it('records the official line 91 corridor as a partial overlap, not a replacement', () => {
    const allStops = [...line91.directions.outbound.waypoints, ...line91.directions.inbound.waypoints]
    expect(line91.stopCount).toEqual({ outbound: 70, inbound: 70 })
    expect(line91.directions.outbound.waypoints[0]).toBe('Losso (Départ)')
    expect(line91.directions.inbound.waypoints.at(-1)).toBe('Losso (Terminus)')
    expect(allStops.some((stop: string) => stop.includes('Apix'))).toBe(true)
    expect(allStops.some((stop: string) => stop.includes('Dougar Peulh'))).toBe(true)
    expect(getAftuOfficialIndexCrosswalk('91')?.status).toBe('corridor_overlap_with_possible_extension')
  })

  it('does not treat official corridor titles as complete stop sequences', () => {
    expect(AFTU_OFFICIAL_INDEX_CROSSWALK.every((item) => item.stopSequenceValidatedByIndex === false)).toBe(true)
    expect(line85.stopCount).toEqual({ outbound: 89, inbound: 95 })
    expect(line86.directions.outbound.waypoints).toHaveLength(68)
    expect(line87.directions.outbound.waypoints).toHaveLength(68)
  })
})
