import { describe, expect, it } from 'vitest'
import {
  AFTU_PUBLIC_LINE_CATALOG,
  AFTU_TATA_PUBLIC_LINE_CATALOG,
  AFTU_TATA_SHARED_LINE_CODES,
  AFTU_TATA_SHARED_ROUTE_KEYS,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  TATA_REFERENCE_POLICY,
  groupPublicBusLinesByCode,
} from './publicBusLineCatalog'

describe('catalogues sources et réseau unifié AFTU / TATA', () => {
  it('ne fusionne que les itinéraires dont la séquence ordonnée des arrêts est identique', () => {
    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
    const keys = AFTU_TATA_PUBLIC_LINE_CATALOG.map((line) => {
      const ends = [normalize(line.origin), normalize(line.destination)].sort()
      return `${line.line}|${ends[0]}|${ends[1]}`
    })
    // Les terminus identiques peuvent désormais rester en deux fiches si les arrêts diffèrent.
    expect(new Set(keys).size).toBeLessThan(keys.length)
    expect(AFTU_TATA_SHARED_ROUTE_KEYS.size).toBe(11)
    expect(AFTU_TATA_SHARED_LINE_CODES.size).toBe(11)
    // Les lignes 4, 33 et 53 ont une séquence détaillée commune après normalisation ; les lignes 5, 39 et 42 restent distinctes.
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '1')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '4')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '33')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '5')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '39')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '42')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '65')).toHaveLength(2)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '37' && line.origin === 'Cité APIX' && line.destination === 'UCAD (Claudel)')).toBe(true)
  })
  it('sépare les lignes TATA des références AFTU', () => {
    expect(TATA_PUBLIC_LINE_CATALOG.length).toBeGreaterThan(40)
    expect(TATA_PUBLIC_LINE_CATALOG.every((line) => line.network === 'tata')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.every((line) => line.network === 'aftu')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '37' && line.origin === 'APIX' && line.destination === 'UCAD')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '53' && line.origin === 'Keur Massar' && line.destination === 'Sébikotane')).toBe(true)
  })

  it('ne duplique aucun numéro dans chaque mobilité source', () => {
    for (const catalogue of [DDD_PUBLIC_LINE_CATALOG, AFTU_PUBLIC_LINE_CATALOG, TATA_PUBLIC_LINE_CATALOG]) {
      expect(new Set(catalogue.map((line) => line.line)).size).toBe(catalogue.length)
    }
  })

  it('affiche une seule entrée par numéro tout en conservant les variantes d’itinéraire distinctes', () => {
    const groups = groupPublicBusLinesByCode(AFTU_TATA_PUBLIC_LINE_CATALOG)
    expect(groups).toHaveLength(72)
    expect(new Set(groups.map((group) => group.line)).size).toBe(groups.length)
    expect(groups.find((group) => group.line === '5')?.variants.map((line) => line.network).sort()).toEqual(['aftu', 'tata'])
    expect(groups.find((group) => group.line === '65')?.variants.map((line) => line.network).sort()).toEqual(['aftu', 'tata'])
    expect(groups.reduce((total, group) => total + group.variants.length, 0)).toBe(AFTU_TATA_PUBLIC_LINE_CATALOG.length)
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
