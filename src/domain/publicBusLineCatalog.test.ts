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
  sameDetailedRouteDirection,
} from './publicBusLineCatalog'

describe('catalogues sources et réseau unifié AFTU / TATA', () => {
  it('affiche une seule fiche par numéro, car Tata est le nom usuel des minibus AFTU', () => {
    const codes = AFTU_TATA_PUBLIC_LINE_CATALOG.map((line) => line.line)
    expect(new Set(codes).size).toBe(codes.length)
    expect(AFTU_TATA_SHARED_ROUTE_KEYS.size).toBe(0)
    expect(AFTU_TATA_SHARED_LINE_CODES.size).toBe(0)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '84')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.find((line) => line.line === '84')?.network).toBe('aftu')
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.filter((line) => line.line === '90')).toHaveLength(1)
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.find((line) => line.line === '90')?.origin).toBe('Terminus 90 (Départ)')
    expect(AFTU_TATA_PUBLIC_LINE_CATALOG.find((line) => line.line === '90')?.destination).toBe('Deni Birame Ndao Nord (Terminus)')
  })
  it('conserve les catalogues sources pour vérification, sans les afficher comme deux réseaux', () => {
    expect(TATA_PUBLIC_LINE_CATALOG.length).toBeGreaterThan(40)
    expect(TATA_PUBLIC_LINE_CATALOG.every((line) => line.network === 'tata')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.every((line) => line.network === 'aftu')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '37' && line.origin === 'APIX' && line.destination === 'UCAD')).toBe(true)
    expect(TATA_PUBLIC_LINE_CATALOG.some((line) => line.line === '53' && line.origin === 'Keur Massar' && line.destination === 'Sébikotane')).toBe(true)
  })

  it('ne partage jamais deux fiches dont le sens des terminus est inversé', () => {
    expect(sameDetailedRouteDirection(
      { origin: 'Colobane', destination: 'Jaxaay' },
      { origin: 'Jaxaay', destination: 'Colobane' },
    )).toBe(false)
    expect(sameDetailedRouteDirection(
      { origin: 'Colobane', destination: 'Jaxaay' },
      { origin: 'Colobane', destination: 'Jaxaay' },
    )).toBe(true)
  })

  it('ne duplique aucun numéro dans chaque mobilité source', () => {
    for (const catalogue of [DDD_PUBLIC_LINE_CATALOG, AFTU_PUBLIC_LINE_CATALOG, TATA_PUBLIC_LINE_CATALOG]) {
      expect(new Set(catalogue.map((line) => line.line)).size).toBe(catalogue.length)
    }
  })

  it('regroupe une seule fiche par numéro dans le réseau commun', () => {
    const groups = groupPublicBusLinesByCode(AFTU_TATA_PUBLIC_LINE_CATALOG)
    expect(groups).toHaveLength(AFTU_TATA_PUBLIC_LINE_CATALOG.length)
    expect(new Set(groups.map((group) => group.line)).size).toBe(groups.length)
    expect(groups.find((group) => group.line === '84')?.variants).toHaveLength(1)
    expect(groups.find((group) => group.line === '90')?.variants).toHaveLength(1)
  })
  it('ne transforme pas un catalogue de parcours en horaires', () => {
    expect(TATA_REFERENCE_POLICY.independentRouteCatalogAvailable).toBe(false)
    expect(TATA_REFERENCE_POLICY.independentScheduleAvailable).toBe(false)
  })

  it('enregistre la ligne AFTU 84 avec ses terminus détaillés', () => {
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '84' && line.origin === 'Jaxaay 2 Pénitence' && line.destination === 'Terminus 84_54Derrière Ucad En Face Canal 4')).toBe(true)
  })

  it('reprend les terminus officiels AFTU de la ligne 85', () => {
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '85' && line.origin === 'Banoba' && line.destination === 'Liberté 5')).toBe(true)
  })

  it('conserve les réseaux DDD et AFTU dans leurs propres catalogues', () => {
    expect(DDD_PUBLIC_LINE_CATALOG.every((line) => line.network === 'ddd')).toBe(true)
    expect(AFTU_PUBLIC_LINE_CATALOG.some((line) => line.line === '91' && line.origin === 'APIX' && line.destination === 'Dougar')).toBe(true)
  })
})
