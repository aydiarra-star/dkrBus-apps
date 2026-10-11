import { describe, expect, it } from 'vitest'
import { OFFLINE_CAPABILITIES, SETTINGS_SECTIONS, preferencesSummary, settingsSectionFor } from './settings'
import { DEFAULT_PREFERENCES } from './preferences'

describe('écrans Paramètres : sections réellement activées', () => {
  it('couvre les huit réglages demandés, chacun avec sa conséquence affichée', () => {
    expect(SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      'mobility', 'language', 'accessibility', 'units', 'privacy', 'sources', 'legal', 'offline',
    ])
    for (const section of SETTINGS_SECTIONS) {
      expect(section.effect.length, section.id).toBeGreaterThan(20)
      expect(section.label, section.id).not.toMatch(/#|[A-Z]{6,}/)
      expect(section.anchor, section.id).toMatch(/^[a-z0-9-]+$/)
    }
    expect(settingsSectionFor('preferences-hors-ligne')?.id).toBe('offline')
    expect(settingsSectionFor('inconnu')).toBeUndefined()
  })

  it('le mode hors ligne dit ce qu’il ne peut pas faire', () => {
    const offline = OFFLINE_CAPABILITIES.filter((capability) => !capability.available).map((capability) => capability.id)
    expect(offline).toEqual(['map', 'realtime'])
    for (const capability of OFFLINE_CAPABILITIES) expect(capability.detail.length).toBeGreaterThan(10)
  })

  it('résume les réglages courants avec leurs valeurs réelles', () => {
    const summary = preferencesSummary(DEFAULT_PREFERENCES)
    expect(summary.join('\n')).toContain('TER, BRT, DDD, AFTU, TATA')
    expect(summary.join('\n')).toMatch(/langue de la question/i)
    // Un résumé ne doit jamais contenir un code interne ni un identifiant brut.
    for (const line of summary) expect(line).not.toMatch(/undefined|NaN|\[object/)
    expect(summary.join('\n')).toContain('demandée à chaque usage')
    const refused = preferencesSummary({
      ...DEFAULT_PREFERENCES,
      mobility: { ...DEFAULT_PREFERENCES.mobility, networks: { ter: false, brt: false, ddd: false, aftu: false, tata: false } },
      privacy: { ...DEFAULT_PREFERENCES.privacy, gps: 'never' },
    })
    expect(refused.join('\n')).toContain('aucun')
    expect(refused.join('\n')).toContain('jamais demandée')
  })
})
