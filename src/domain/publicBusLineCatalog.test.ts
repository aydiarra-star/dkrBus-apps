import { describe, expect, it } from 'vitest'
import {
  AFTU_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  TATA_REFERENCE_POLICY,
} from './publicBusLineCatalog'

describe('catalogues de lignes publiques indépendants', () => {
  it('sépare les lignes TATA des références AFTU', () => {
    expect(TATA_PUBLIC_LINE_CATALOG.length).toBeGreaterThan(40)
    expect(TATA_PUBLIC_LINE_CATALOG.every((line) => line.network === 'tata')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.every((line) => line.network === 'aftu')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '37' && line.origin === 'APIX' && line.destination === 'UCAD')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '53' && line.origin === 'Keur Massar' && line.destination === 'Sébikotane')).toBe(true)
  })

  it('ne transforme pas un catalogue de parcours en horaires', () => {
    expect(TATA_REFERENCE_POLICY.independentRouteCatalogAvailable).toBe(true)
    expect(TATA_REFERENCE_POLICY.independentScheduleAvailable).toBe(false)
  })

  it('conserve les réseaux DDD et AFTU dans leurs propres catalogues', () => {
    expect(DDD_PUBLIC_LINE_CATALOG.every((line) => line.network === 'ddd')).toBe(true)
    expect(DDD_PUBLIC_LINE_CATALOG.some((line) => line.line === '102' && line.origin === 'Cambérène 2' && line.destination === 'Terrain Colobane')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '91' && line.origin === 'APIX' && line.destination === 'Dougar')).toBe(true)
  })
})
