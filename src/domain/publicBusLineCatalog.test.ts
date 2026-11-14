import { describe, expect, it } from 'vitest'
import {
  AFTU_PUBLIC_LINE_CATALOG,
  AFTU_TATA_PUBLIC_LINE_CATALOG,
  AFTU_TATA_SHARED_LINE_CODES,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  TATA_REFERENCE_POLICY,
} from './publicBusLineCatalog'

describe('catalogues sources et réseau unifié AFTU / TATA', () => {
  it('fusionne les doublons de numéro et de terminus sans écraser les parcours différents', () => {
    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
    const keys = AFTU_TATA_PUBLIC_LINE_CATALOG.map((line) => {
      const ends = [normalize(line.origin), normalize(line.destination)].sort()
      return `${line.line}|${ends[0]}|${ends[1]}`
    })
    expect(new Set(keys).size).toBe(keys.length)
    expect(AFTU_TATA_SHARED_LINE_CODES.size).toBe(47)
    // Les deux lignes 5 ont des terminus distincts : elles doivent rester séparées.
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '5')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG).toHaveLength(90)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '39')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '42')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '37' && line.origin === 'APIX' && line.destination === 'UCAD')).toBe(true)
  })
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

  it('enregistre la ligne AFTU 84 dans le sens Jaxaay 2 vers UCAD', () => {
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '84' && line.origin === 'Jaxaay 2' && line.destination === 'UCAD')).toBe(true)
  })

  it('reprend les terminus officiels AFTU de la ligne 85', () => {
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '85' && line.origin === 'Banoba' && line.destination === 'Liberté 5')).toBe(true)
  })

  it('conserve les réseaux DDD et AFTU dans leurs propres catalogues', () => {
    expect(DDD_PUBLIC_LINE_CATALOG.every((line) => line.network === 'ddd')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '91' && line.origin === 'APIX' && line.destination === 'Dougar')).toBe(true)
  })
})
