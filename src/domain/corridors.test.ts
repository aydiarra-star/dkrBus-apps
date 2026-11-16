import { describe, expect, it } from 'vitest'
import { OFFICIAL_REFERENCE_FREQUENCIES } from './frequencies'
import {
  ALL_CORRIDOR_STOPS,
  BRT_STOPS,
  CORRIDOR_LINES,
  CORRIDOR_NETWORKS,
  DAKAR_REGION_BOUNDS,
  CORRIDOR_TRANSFERS,
  INTERMODAL_TRANSFERS,
  TER_STOPS,
  getCorridorStop,
  haversineMeters,
  linesServingStop,
  nearestCorridorStops,
  searchCorridorStops,
} from './corridors'

describe('réseau de référence TER/BRT', () => {
  it('porte les 14 gares TER jusqu’à AIBD et les 23 stations BRT annoncées publiquement', () => {
    expect(TER_STOPS).toHaveLength(14)
    expect(BRT_STOPS).toHaveLength(23)
    expect(TER_STOPS[13]).toMatchObject({ id: 'ter-aibd', lat: 14.67227, lon: -17.06456, osmNodeId: 14160412786 })
  })

  it('verrouille la séquence officielle des 23 stations BRT', () => {
    // Séquence publiée (CETUD / SunuBRT), sens Plateau → Guédiawaye. Toute
    // modification de cette liste doit être justifiée par une source publique.
    expect(BRT_STOPS.map((stop) => stop.name)).toEqual([
      'Petersen – Papa Gueye Fall',
      'Grande Mosquée',
      'Place de la Nation',
      'Dial Diop',
      'Grand Dakar',
      'Liberté 1',
      'Sacré-Cœur',
      'Liberté 5',
      'Liberté 6',
      'Khar Yalla',
      'Scat Urbam',
      'Cardinal Hyacinthe Thiandoum',
      'Grand Médine',
      'Police des Parcelles',
      'Croisement 22',
      'Parcelles',
      'Ndingala',
      'Golf Sud',
      'Dalal Jamm',
      'Fith Mith',
      'Golf Nord',
      'Gueule Tapée',
      'Préfecture de Guédiawaye',
    ])
    // Chaque station porte le nœud OpenStreetMap qui justifie sa position.
    const nodes = BRT_STOPS.map((stop) => stop.osmNodeId)
    expect(nodes.every((node): node is number => typeof node === 'number' && node > 0)).toBe(true)
    expect(new Set(nodes).size).toBe(BRT_STOPS.length)
    expect(BRT_STOPS[0]).toMatchObject({ id: 'brt-petersen', lat: 14.6766438, lon: -17.4406354 })
    expect(BRT_STOPS[BRT_STOPS.length - 1]).toMatchObject({
      id: 'brt-prefecture-guediawaye',
      lat: 14.7719791,
      lon: -17.3868591,
    })
  })

  it('enchaîne les stations BRT sans saut invraisemblable (positions exactes, pas d’interpolation)', () => {
    for (let index = 0; index < BRT_STOPS.length - 1; index += 1) {
      const distance = haversineMeters(BRT_STOPS[index], BRT_STOPS[index + 1])
      expect(distance).toBeGreaterThan(300)
      expect(distance).toBeLessThan(1700)
    }
    const total = BRT_STOPS.slice(1).reduce(
      (sum, stop, index) => sum + haversineMeters(BRT_STOPS[index], stop),
      0,
    )
    // Corridor officiel : 18,3 km ; la somme des segments entre stations
    // (vol d’oiseau, sans détour de voirie) doit rester du même ordre.
    expect(total / 1000).toBeGreaterThan(16)
    expect(total / 1000).toBeLessThan(19)
  })

  it('déclare la desserte semi-express B3 sur les seules stations annoncées', () => {
    const b1 = CORRIDOR_LINES.find((line) => line.id === 'brt-b1')
    expect(b1?.expressStopIds).toEqual([
      'brt-petersen',
      'brt-place-nation',
      'brt-khar-yallah',
      'brt-croisement-22',
      'brt-parcelles',
      'brt-gueule-tapee',
      'brt-prefecture-guediawaye',
    ])
  })

  it('relie TER et BRT par des correspondances marchables cohérentes avec les positions', () => {
    for (const transfer of CORRIDOR_TRANSFERS) {
      const from = getCorridorStop(transfer.fromStopId)
      const to = getCorridorStop(transfer.toStopId)
      expect(from).not.toBeNull()
      expect(to).not.toBeNull()
      // Une marche déclarée ne peut pas être plus courte que la ligne droite
      // entre les deux positions, ni dépasser une correspondance urbaine.
      expect(transfer.walkM).toBeGreaterThanOrEqual(Math.floor(haversineMeters(from!, to!)))
      expect(transfer.walkM).toBeLessThan(2500)
    }
  })

  it('n’active aucune correspondance fondée uniquement sur des coordonnées de quartier approximatives', () => {
    expect(INTERMODAL_TRANSFERS).toEqual(CORRIDOR_TRANSFERS.map((transfer) => ({ ...transfer, declared: true })))
    expect(INTERMODAL_TRANSFERS).toHaveLength(6)
    expect(INTERMODAL_TRANSFERS.every((transfer) => transfer.declared === true)).toBe(true)
  })

  it('active les trois transferts documentés dans le pôle d’échange Petersen', () => {
    const petersenTransfers = CORRIDOR_TRANSFERS.filter((transfer) =>
      [transfer.fromStopId, transfer.toStopId].every((id) => id.includes('petersen')),
    )
    expect(petersenTransfers).toHaveLength(3)
    expect(petersenTransfers.map((transfer) => [transfer.fromStopId, transfer.toStopId])).toEqual([
      ['brt-petersen', 'ddd-petersen'],
      ['brt-petersen', 'aftu-petersen'],
      ['ddd-petersen', 'aftu-petersen'],
    ])
    expect(petersenTransfers.every((transfer) => transfer.walkM === 0)).toBe(true)
  })

  it('active la correspondance BRT ↔ DDD au pôle terminal documenté de Guédiawaye', () => {
    const guediawayeTransfers = CORRIDOR_TRANSFERS.filter((transfer) =>
      [transfer.fromStopId, transfer.toStopId].every((id) => id.includes('guediawaye')),
    )
    expect(guediawayeTransfers).toHaveLength(1)
    expect(guediawayeTransfers[0]).toMatchObject({
      fromStopId: 'brt-prefecture-guediawaye',
      toStopId: 'ddd-guediawaye',
      walkM: 0,
    })
  })

  it('affiche les anciennes dessertes TATA sous le seul nom public AFTU', () => {
    const legacyLine = CORRIDOR_LINES.find((line) => line.id === 'tata-1')!
    expect(CORRIDOR_NETWORKS.aftu_tata.label).toBe('AFTU')
    expect(legacyLine.shortName).toBe('AFTU')
    expect(legacyLine.longName).not.toContain('TATA')
    expect(legacyLine.serviceWindow).toContain('AFTU')
    expect(ALL_CORRIDOR_STOPS.filter((stop) => stop.id.startsWith('tata-')).every((stop) => stop.note === 'AFTU')).toBe(true)
  })

  it('garantit des identifiants uniques et un ordre de desserte cohérent', () => {
    const ids = ALL_CORRIDOR_STOPS.map((stop) => stop.id)
    expect(new Set(ids).size).toBe(ids.length)
    TER_STOPS.forEach((stop, index) => expect(stop.order).toBe(index))
    BRT_STOPS.forEach((stop, index) => expect(stop.order).toBe(index))
  })

  it('place tous les arrêts dans l’enveloppe régionale affichée', () => {
    for (const stop of ALL_CORRIDOR_STOPS) {
      expect(stop.lat).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLat)
      expect(stop.lat).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLat)
      expect(stop.lon).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLon)
      expect(stop.lon).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLon)
    }
  })

  it('englobe Almadies et Bargny dans le cadrage de la carte', () => {
    // Pointe des Almadies ~ (14.7479, -17.5277) ; Bargny ~ (14.73, -17.0) hors BRT mais Rufisque/Bargny TER inclus.
    expect(DAKAR_REGION_BOUNDS.minLon).toBeLessThanOrEqual(-17.53)
    const bargny = TER_STOPS.find((stop) => stop.name === 'Bargny')
    expect(bargny).toBeDefined()
    expect(bargny!.lon).toBeGreaterThan(DAKAR_REGION_BOUNDS.minLon)
    expect(bargny!.lon).toBeLessThan(DAKAR_REGION_BOUNDS.maxLon)
  })

  it('couvre les dessertes périphériques au-delà de Dakar-ville', () => {
    expect(DAKAR_REGION_BOUNDS.minLat).toBeLessThanOrEqual(14.61)
    expect(DAKAR_REGION_BOUNDS.maxLat).toBeGreaterThanOrEqual(14.83)
    expect(DAKAR_REGION_BOUNDS.minLon).toBeLessThanOrEqual(-17.51)
    expect(DAKAR_REGION_BOUNDS.maxLon).toBeGreaterThanOrEqual(-17.14)
  })

  it('retrouve un arrêt malgré les accents et les alias', () => {
    expect(searchCorridorStops('guediawaye')[0]?.id).toBe('brt-prefecture-guediawaye')
    expect(searchCorridorStops('Guédiawaye')[0]?.id).toBe('brt-prefecture-guediawaye')
    expect(searchCorridorStops('petersen')[0]?.id).toBe('brt-petersen')
    expect(searchCorridorStops('diamniadio')[0]?.id).toBe('ter-diamniadio')
    expect(searchCorridorStops('Keur Mbaye Fall')[0]?.id).toBe('ter-mbao')
    expect(searchCorridorStops('Mbao')[0]?.name).toBe('Keur Mbaye Fall')
    expect(searchCorridorStops('Keur Massar').some((stop) => stop.id === 'ter-mbao')).toBe(false)
    expect(searchCorridorStops('aéroport blaise diagne')[0]?.id).toBe('ter-aibd')
    expect(searchCorridorStops('AIBD')[0]?.id).toBe('ter-aibd')
  })

  it('ne renvoie rien plutôt que deviner un lieu inconnu', () => {
    expect(searchCorridorStops('tour eiffel')).toHaveLength(0)
    expect(searchCorridorStops('')).toHaveLength(0)
  })

  it('associe chaque arrêt aux lignes qui le desservent réellement', () => {
    expect(linesServingStop('ter-rufisque').map((line) => line.shortName)).toEqual(['TER'])
    expect(linesServingStop('brt-parcelles').map((line) => line.shortName)).toEqual(['B1'])
    expect(linesServingStop('inconnu')).toHaveLength(0)
  })

  it('calcule des distances plausibles (Dakar → Diamniadio ≈ 25 km à vol d’oiseau)', () => {
    const dakar = TER_STOPS[0]
    const diamniadio = TER_STOPS.find((stop) => stop.id === 'ter-diamniadio')!
    const distance = haversineMeters(dakar, diamniadio)
    expect(distance).toBeGreaterThan(20_000)
    expect(distance).toBeLessThan(30_000)
  })

  it('liste les arrêts les plus proches d’un point', () => {
    const near = nearestCorridorStops({ lat: 14.6761, lon: -17.4336 }, 1)
    expect(near[0]?.stop.id).toBe('ter-dakar')
    expect(near[0]?.distanceM).toBeLessThan(100)
  })

  it('déclare des lignes dont les arrêts existent tous', () => {
    for (const line of CORRIDOR_LINES) {
      for (const stopId of line.stopIds) {
        expect(ALL_CORRIDOR_STOPS.some((stop) => stop.id === stopId)).toBe(true)
      }
    }
  })
})

describe('source unique des fréquences', () => {
  it('dérive le headway du calculateur des fréquences officielles, sans le recopier', () => {
    const ter = CORRIDOR_LINES.find((line) => line.network === 'ter')!
    const brt = CORRIDOR_LINES.find((line) => line.network === 'brt')!
    // Le calculateur retient prudemment le maximum officiel déclaré.
    expect(ter.headwayMin).toBe(Math.max(...OFFICIAL_REFERENCE_FREQUENCIES.ter.map((f) => f.headwayMinutes)))
    expect(brt.headwayMin).toBe(Math.max(...OFFICIAL_REFERENCE_FREQUENCIES.brt.map((f) => f.headwayMinutes)))
    expect(ter.headwayMin).toBe(20)
    expect(brt.headwayMin).toBe(6)
    // Les références officielles elles-mêmes ne bougent pas.
    expect(OFFICIAL_REFERENCE_FREQUENCIES.brt.map((f) => f.headwayMinutes)).toEqual([6])
    expect(OFFICIAL_REFERENCE_FREQUENCIES.ter.map((f) => f.headwayMinutes)).toEqual([10, 20, 20])
  })
})

  it('active la correspondance DDD 227 ↔ AFTU 60 au terminus commun de Keur Massar', () => {
    const transfer = CORRIDOR_TRANSFERS.find((item) =>
      [item.fromStopId, item.toStopId].includes('ddd-keur-massar-227')
      && [item.fromStopId, item.toStopId].includes('aftu-keur-massar-60'),
    )
    expect(transfer).toMatchObject({
      fromStopId: 'ddd-keur-massar-227',
      toStopId: 'aftu-keur-massar-60',
      walkM: 0,
    })
    expect(CORRIDOR_LINES.find((line) => line.id === 'ddd-227')?.shortName).toBe('DDD 227')
    expect(CORRIDOR_LINES.find((line) => line.id === 'aftu-60')?.shortName).toBe('AFTU 60')
  })