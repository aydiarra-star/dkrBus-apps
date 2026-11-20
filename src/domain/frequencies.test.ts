import { describe, expect, it } from 'vitest'
import {
  FREQUENCY_SOURCES,
  NETWORK_REFERENCE_DATA,
  OFFICIAL_FREQUENCY_VARIANTS,
  OFFICIAL_REFERENCE_FREQUENCIES,
  formatFrequencyPeriod,
  formatVerificationDate,
  type OfficialFrequency,
} from './frequencies'

describe('références officielles de fréquence', () => {
  it('enregistre le BRT B1 à six minutes sans le confondre avec un prochain passage', () => {
    const [brt] = OFFICIAL_REFERENCE_FREQUENCIES.brt
    expect(brt).toMatchObject({
      status: 'OFFICIAL_REFERENCE',
      headwayMinutes: 6,
      serviceStart: '06:00',
      serviceEnd: '21:00',
      scope: 'B1 · Guédiawaye ↔ Petersen · 23 stations',
    })
    expect(brt.days).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
    expect(brt.source).toMatchObject({
      authority: 'CETUD',
      sourceUrl: 'https://www.sunubrt.sn',
      verifiedAt: null,
      verificationStatus: 'UNVERIFIED_IN_REPOSITORY',
    })
    expect(formatFrequencyPeriod(brt)).toContain('06:00–21:00 · 6 min')
    expect(brt.label).toBe('Toutes les 6 minutes')
  })

  it('distingue les fréquences TER par segment et par jour', () => {
    const [weekdayTrunk, weekdayAirport, sundayTrunk, sundayAirport] = OFFICIAL_REFERENCE_FREQUENCIES.ter
    expect([weekdayTrunk.headwayMinutes, weekdayAirport.headwayMinutes, sundayTrunk.headwayMinutes, sundayAirport.headwayMinutes]).toEqual([8, 24, 20, 30])
    expect([weekdayTrunk.serviceStart, weekdayTrunk.serviceEnd]).toEqual(['05:35', '22:00'])
    expect([weekdayAirport.serviceStart, weekdayAirport.serviceEnd]).toEqual(['05:35', '22:00'])
    expect([sundayTrunk.serviceStart, sundayTrunk.serviceEnd]).toEqual(['06:30', '22:00'])
    expect([sundayAirport.serviceStart, sundayAirport.serviceEnd]).toEqual(['06:17', '22:00'])
    expect(weekdayTrunk.routeSegment).toBe('DAKAR_DIAMNIADIO')
    expect(weekdayAirport.routeSegment).toBe('DIAMNIADIO_AIBD')
    expect(sundayTrunk.routeSegment).toBe('DAKAR_DIAMNIADIO')
    expect(sundayAirport.routeSegment).toBe('DIAMNIADIO_AIBD')
    expect(weekdayTrunk.days).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
    expect(sundayAirport.days).toEqual(['SUN'])
    expect(sundayAirport.appliesToPublicHolidays).toBe(true)
    expect(weekdayTrunk.excludesPublicHolidays).toBe(true)
    expect(weekdayTrunk.status).toBe('SCHEDULED')
    expect(weekdayTrunk.source).toMatchObject({
      authority: 'TER_DAKAR',
      sourceUrl: 'https://aps.sn/train-express-regional-la-phase-diamniadio-aibd-inauguree-un-investissement-de-plus-de-300-milliards-fcfa/',
      publishedAt: '2026-09-28',
      verifiedAt: '2026-11-20',
      verificationStatus: 'VERIFIED_OFFICIAL',
    })
    expect(NETWORK_REFERENCE_DATA.ter).toMatchObject({
      coverage: 'Dakar ↔ AIBD via Diamniadio',
      stationCount: 14,
      frequencyLabel: '8 min Dakar–Diamniadio · 24 min Diamniadio–AIBD',
    })
  })

  it('keeps DDD and AFTU fleet counts separate from unavailable line frequencies', () => {
    expect(NETWORK_REFERENCE_DATA.ddd).toMatchObject({
      lineCount: 38,
      vehicleCount: 400,
      serviceStart: '05:30',
      serviceEnd: '21:00',
      serviceWindow: 'Premiers départs : 05:30–06:00 · derniers : 20:30–21:00',
      sourceAuthority: 'CETUD',
      frequencyStatus: 'UNKNOWN',
      frequencyLabel: 'Fréquences non publiées ligne par ligne',
      officialFrequencies: [],
    })
    expect(NETWORK_REFERENCE_DATA.aftu_tata).toMatchObject({
      lineCount: 72,
      vehicleCount: 2300,
      gieCount: 14,
      serviceStart: '06:00',
      serviceEnd: '22:50',
      sourceAuthority: 'CETUD',
      frequencyStatus: 'UNKNOWN',
      frequencyLabel: 'Intervalle moyen partagé : 11,6 min · créneau projeté : 12 min',
      officialFrequencies: [],
    })
    expect(NETWORK_REFERENCE_DATA.aftu_tata.lineCount).not.toBe(71)
    expect(NETWORK_REFERENCE_DATA.ddd.source).toMatchObject({
      authority: 'CETUD',
      sourceUrl: 'https://cetud.sn',
      verifiedAt: null,
      verificationStatus: 'UNVERIFIED_IN_REPOSITORY',
    })
  })

  it('publie une seule identité publique AFTU', () => {
    expect(NETWORK_REFERENCE_DATA.aftu_tata).toMatchObject({
      id: 'aftu_tata',
      label: 'AFTU',
      shortName: 'AFTU',
      operator: 'AFTU',
      coverage: 'Réseau de minibus AFTU',
      lineCount: 72,
      vehicleCount: 2300,
      frequencyStatus: 'UNKNOWN',
      serviceEnd: '22:50',
    })
  })

  it('uses only source URLs already recorded in the repository', () => {
    expect(FREQUENCY_SOURCES.brt.sourceUrl).toBe('https://www.sunubrt.sn')
    expect(FREQUENCY_SOURCES.ter.sourceUrl).toBe('https://www.senersa.sn')
    expect(FREQUENCY_SOURCES.terPhase2.sourceUrl).toContain('aps.sn/train-express-regional')
    expect(FREQUENCY_SOURCES.cetud.sourceUrl).toBe('https://cetud.sn')
    for (const source of [FREQUENCY_SOURCES.brt, FREQUENCY_SOURCES.ter, FREQUENCY_SOURCES.cetud]) {
      expect(source.sourceUrl).toMatch(/^https:\/\//)
      expect(source.verifiedAt).toBeNull()
      expect(source.verificationStatus).toBe('UNVERIFIED_IN_REPOSITORY')
    }
    expect(FREQUENCY_SOURCES.terPhase2).toMatchObject({
      publishedAt: '2026-09-28',
      verifiedAt: '2026-11-20',
      verificationStatus: 'VERIFIED_OFFICIAL',
    })
  })

  it('can store an exceptional TER variant without replacing the permanent reference', () => {
    const permanent = OFFICIAL_REFERENCE_FREQUENCIES.ter[0]
    const exceptional: OfficialFrequency = {
      ...permanent,
      headwayMinutes: 5,
      serviceVariant: {
        type: 'EXCEPTIONAL',
        validFrom: '2026-12-01T00:00:00Z',
        validUntil: '2026-12-02T00:00:00Z',
      },
    }
    expect(permanent.headwayMinutes).toBe(8)
    expect(exceptional.headwayMinutes).toBe(5)
    expect(exceptional.serviceVariant?.type).toBe('EXCEPTIONAL')
    // Aucun renfort (dont 3 min sur le BRT) n'est affirmé sans source vérifiée.
    expect(OFFICIAL_FREQUENCY_VARIANTS).toEqual([])
  })

  it('does not invent an online verification date', () => {
    expect(formatVerificationDate(null)).toBe('non vérifiée en ligne')
    expect(formatVerificationDate('2026-10-08')).toBe('08/10/2026')
    expect(formatVerificationDate('date inconnue')).toBe('date inconnue')
  })
})
