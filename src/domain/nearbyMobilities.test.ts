import { describe, expect, it } from 'vitest'
import { haversineMeters } from './corridors'
import {
  NEARBY_MOBILITY_RADIUS_M,
  NEARBY_WALK_LIMIT_MINUTES,
  isWithinWalkingLimit,
  walkingMinutesFromDistance,
  absentNearbyLabel,
  absentNearbyNetworks,
  detectNearbyMobilities,
  groupNearbyMobilities,
  nearbyMobilityCatalogCoversAllNetworks,
} from './nearbyMobilities'

const PETERSEN = { lat: 14.6766438, lon: -17.4406354 }
const COLOMBANE = { lat: 14.7003482, lon: -17.4416523 }

describe('mobilités à proximité', () => {
  it('couvre les cinq mobilités du catalogue, sans en inventer une sixième', () => {
    expect(nearbyMobilityCatalogCoversAllNetworks()).toBe(true)
    expect(NEARBY_WALK_LIMIT_MINUTES).toBe(15)
    expect(NEARBY_MOBILITY_RADIUS_M).toBe(923)
    expect(walkingMinutesFromDistance(923)).toBe(15)
    expect(walkingMinutesFromDistance(924)).toBe(16)
    expect(isWithinWalkingLimit(923)).toBe(true)
    expect(isWithinWalkingLimit(924)).toBe(false)
  })

  it('détecte TER, BRT, DDD et AFTU à Petersen, pas le TATA de Colobane', () => {
    const hits = detectNearbyMobilities(PETERSEN)
    const networks = new Set(hits.map((hit) => hit.network))
    expect(networks).toEqual(new Set(['ter', 'brt', 'ddd', 'aftu']))
    expect(hits.every((hit) => hit.distanceM <= NEARBY_MOBILITY_RADIUS_M && hit.walkMinutes <= NEARBY_WALK_LIMIT_MINUTES)).toBe(true)
    expect(hits.map((hit) => hit.distanceM)).toEqual([...hits.map((hit) => hit.distanceM)].sort((a, b) => a - b))
    const brt = hits.find((hit) => hit.stop.id === 'brt-petersen')
    expect(brt?.distanceM).toBe(0)
    expect(brt?.lineNames).toContain('B1')
    const ddd = hits.find((hit) => hit.stop.id === 'ddd-petersen')
    expect(ddd?.lineNames).toEqual(expect.arrayContaining(['DDD 1', 'DDD 15']))
    expect(absentNearbyLabel(absentNearbyNetworks(groupNearbyMobilities(hits)))).toBe('Aucun arrêt TATA à 15 min à pied maximum.')
  })

  it('réunit les cinq mobilités autour de Colobane, dans l’ordre TER · BRT · DDD · AFTU · TATA', () => {
    const groups = groupNearbyMobilities(detectNearbyMobilities(COLOMBANE))
    expect(groups.map((group) => group.network)).toEqual(['ter', 'ddd', 'aftu', 'tata'])
    expect(absentNearbyNetworks(groups)).toEqual(['brt'])
    expect(absentNearbyLabel(['brt'])).toBe('Aucun arrêt BRT à 15 min à pied maximum.')
    for (const group of groups) {
      const distances = group.hits.map((hit) => hit.distanceM)
      expect(distances).toEqual([...distances].sort((a, b) => a - b))
      expect(group.hits.every((hit) => haversineMeters(COLOMBANE, hit.stop) <= NEARBY_MOBILITY_RADIUS_M && hit.walkMinutes <= NEARBY_WALK_LIMIT_MINUTES)).toBe(true)
    }
  })

  it('ne retient rien hors rayon, ni pour un point invalide', () => {
    expect(detectNearbyMobilities({ lat: 48.8566, lon: 2.3522 })).toEqual([])
    expect(detectNearbyMobilities({ lat: Number.NaN, lon: -17.44 })).toEqual([])
    expect(detectNearbyMobilities(PETERSEN, -1)).toEqual([])
    expect(detectNearbyMobilities(PETERSEN, 0).every((hit) => hit.distanceM === 0)).toBe(true)
  })
})
