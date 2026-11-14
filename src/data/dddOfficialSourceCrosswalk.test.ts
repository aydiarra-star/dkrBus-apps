import { describe, expect, it } from 'vitest'
import {
  DDD_OFFICIAL_SOURCE_CROSSWALK,
  DDD_OFFICIAL_SOURCE_CROSSWALK_CHECKED_ON,
  DDD_OFFICIAL_SOURCE_CROSSWALK_URLS,
  getDddOfficialSourceCrosswalk,
} from './dddOfficialSourceCrosswalk'

describe('DDD official source crosswalk', () => {
  it('records the current official-source comparison without changing passenger data', () => {
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK_CHECKED_ON).toBe('2026-11-14')
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK_URLS.routePage).toBe('https://demdikk.sn/reseau-urbain-dakar/')
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK_URLS.infoPage).toBe('https://demdikk.sn/info-voyageurs/')
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK_URLS.cetudGuide).toContain('guide-mobilite-dakar-joj-2026.pdf')
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK_URLS.arcgis2024).toContain('Dem_dikk_mise_a_jour/FeatureServer')
    expect(DDD_OFFICIAL_SOURCE_CROSSWALK.map(({ line }) => line)).toEqual([
      '1', '4', '6', '12', '7', '9', '10', '13', '16B', '15', '23', '121', '233', '501', '502', '503', 'TAF_TAF / TO1',
    ])
    for (const item of DDD_OFFICIAL_SOURCE_CROSSWALK) {
      expect(item.claims.length).toBeGreaterThan(1)
      expect(item.decision.length).toBeGreaterThan(20)
      expect(item.passengerCatalogueChanged).toBe(false)
      expect(item.reverseSequenceCreated).toBe(false)
    }
  })

  it('records the line 1, 13 and 121 source checks without promoting geometry to passenger stops', () => {
    expect(getDddOfficialSourceCrosswalk('1')?.claims[0].corridor).toContain('22 repères')
    expect(getDddOfficialSourceCrosswalk('1')?.claims.at(-1)?.corridor).toBe('Parcelles Assainies → Leclerc')
    expect(getDddOfficialSourceCrosswalk('13')?.claims[0].corridor).toContain('24 repères')
    expect(getDddOfficialSourceCrosswalk('13')?.decision).toContain('23 points ArcGIS')
    expect(getDddOfficialSourceCrosswalk('121')?.claims[0].corridor).toContain('25 repères')
    expect(getDddOfficialSourceCrosswalk('121')?.decision).toContain('ne pas les dédupliquer')
  })

  it('records the official line 12 and 16B sequences separately from historic ArcGIS corridor evidence', () => {
    expect(getDddOfficialSourceCrosswalk('12')?.claims).toEqual([
      { source: 'ddd_route_page', corridor: 'Guédiawaye → Palais 1 ; séquence publiée de 20 repères' },
      { source: 'ddd_arcgis_2024', corridor: 'Tracé de 24,52 km et 11 champs de segments textuels ; aucune couche de points dédiée ; métadonnée lastEditDate du 6 décembre 2017' },
    ])
    expect(getDddOfficialSourceCrosswalk('16B')?.claims[0].corridor).toContain('27 repères')
    expect(getDddOfficialSourceCrosswalk('16B')?.decision).toContain('ne pas générer de retour')
  })

  it('keeps the line 6, 7, 9, 10, 13 and 121 terminus conflicts explicit', () => {
    expect(getDddOfficialSourceCrosswalk('6')?.claims.map(({ corridor }) => corridor)).toEqual([
      'Guédiawaye → Palais 1',
      'Cambérène 2 → Palais 2',
      'Cambérène → Palais 1',
    ])
    expect(getDddOfficialSourceCrosswalk('7')?.claims.at(-1)?.corridor).toBe('Ouakam → Palais 1')
    expect(getDddOfficialSourceCrosswalk('9')?.claims.at(-1)?.corridor).toBe('Liberté 6 → Palais 1')
    expect(getDddOfficialSourceCrosswalk('10')?.claims.at(-1)?.corridor).toContain('Palais 1')
    expect(getDddOfficialSourceCrosswalk('13')?.claims.at(-1)?.corridor).toBe('Dieuppeul → Palais 1')
    expect(getDddOfficialSourceCrosswalk('121')?.claims.at(2)?.corridor).toBe('HLM Grand Yoff → Leclerc')
    expect(getDddOfficialSourceCrosswalk('121')?.claims.at(-1)?.source).toBe('ddd_arcgis_2024')
  })

  it('records the line 23 title/last-stop conflict and the limited ArcGIS crosscheck', () => {
    const line = getDddOfficialSourceCrosswalk('23')!
    expect(line.kind).toBe('published_title_sequence_conflict')
    expect(line.claims[0].corridor).toContain('dernier repère publié : Terminus Palais 2')
    expect(line.claims[1].corridor).toContain('54 points codés LIgne_23')
    expect(line.decision).toContain('aucune fusion ni correction automatique')
  })

  it('does not merge line-number variants or distinct TAF TAF services', () => {
    expect(getDddOfficialSourceCrosswalk('15')?.kind).toBe('source_identifier_granularity')
    expect(getDddOfficialSourceCrosswalk('502')?.claims.at(-1)?.corridor).toContain('502A')
    expect(getDddOfficialSourceCrosswalk('503')?.claims.at(-1)?.corridor).toContain('503A')
    expect(getDddOfficialSourceCrosswalk('TAF_TAF / TO1')?.kind).toBe('distinct_service_identifiers')
  })

  it('retains the line 233 sequence/title and line 501 corridor discrepancies', () => {
    expect(getDddOfficialSourceCrosswalk('233')?.kind).toBe('published_title_sequence_conflict')
    expect(getDddOfficialSourceCrosswalk('501')?.claims.map(({ corridor }) => corridor)).toEqual([
      'Palais 2 → Leclerc',
      'Gare de Dakar → Palais 2',
    ])
    expect(getDddOfficialSourceCrosswalk('unknown')).toBeNull()
  })
})
