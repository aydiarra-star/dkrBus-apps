import { describe, expect, it } from 'vitest'
import { CORRIDOR_LINES, getCorridorStop, networkLabelOf, type CorridorLine } from './corridors'
import { describeLeg, directedStopSequences, planReferenceJourney, type PlannerResult } from './planner'

const PLATEAU = { label: 'Plateau (point carte)', lat: 14.6735, lon: -17.4375 }
// Point à ~110 m de la station BRT « Préfecture de Guédiawaye » (position OSM).
const GUEDIAWAYE = { label: 'Guédiawaye (point carte)', lat: 14.7725, lon: -17.3860 }
const RUFISQUE = { label: 'Rufisque (point carte)', lat: 14.7145, lon: -17.2725 }

describe('libellés publics des réseaux', () => {
  it('présente AFTU comme identité unique pour les dessertes AFTU/TATA', () => {
    expect(networkLabelOf('aftu-guediawaye')).toBe('AFTU')
    expect(networkLabelOf('tata-guediawaye')).toBe('AFTU')
  })
})

describe('séquences directionnelles des lignes', () => {
  it('conserve les deux sens historiques tant qu’aucune direction explicite n’est fournie', () => {
    const ter = CORRIDOR_LINES.find((line) => line.id === 'ter-dakar-diamniadio')!
    const sequences = directedStopSequences(ter)
    expect(sequences).toHaveLength(2)
    expect(sequences[0]).toEqual(ter.stopIds)
    expect(sequences[1]).toEqual([...ter.stopIds].reverse())
  })

  it('n’inverse jamais une séquence quand les sens documentés sont fournis', () => {
    const base = CORRIDOR_LINES.find((line) => line.id === 'ddd-1')!
    const outbound = ['ddd-parcelles', 'ddd-grand-yoff', 'ddd-leclerc']
    const explicit = { ...base, directions: [outbound] } as CorridorLine
    expect(directedStopSequences(explicit)).toEqual([outbound])
    expect(directedStopSequences(explicit)).not.toContain([...outbound].reverse())
  })
})

describe('calculateur multimodal de référence', () => {
  it('n’active pas les corridors DDD/AFTU/TATA sans géométrie et séquences directionnelles vérifiées', () => {
    const unverifiedBusLines = CORRIDOR_LINES.filter((line) => line.network === 'ddd' || line.network === 'aftu_tata')
    expect(unverifiedBusLines.map((line) => line.id)).toEqual([
      'ddd-1', 'ddd-2', 'ddd-3', 'aftu-1', 'aftu-2', 'aftu-3', 'tata-1',
    ])
    expect(unverifiedBusLines.every((line) => line.plannerEnabled === false)).toBe(true)

    const dddStart = getCorridorStop('ddd-parcelles')!
    const dddEnd = getCorridorStop('ddd-leclerc')!
    const outcome = planReferenceJourney(
      { label: dddStart.name, lat: dddStart.lat, lon: dddStart.lon, stopId: dddStart.id },
      { label: dddEnd.name, lat: dddEnd.lat, lon: dddEnd.lon, stopId: dddEnd.id },
      'fastest',
      { allowedNetworks: ['ddd'] },
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('calcule Dakar → Pikine sur le TER lorsque les deux gares sont choisies comme points de référence', () => {
    const dakar = getCorridorStop('ter-dakar')!
    const pikine = getCorridorStop('ter-pikine')!
    const outcome = planReferenceJourney(
      { label: dakar.name, lat: dakar.lat, lon: dakar.lon, stopId: dakar.id },
      { label: pikine.name, lat: pikine.lat, lon: pikine.lon, stopId: pikine.id },
      'fastest',
      { allowedNetworks: ['ter'] },
    )
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.networksUsed).toEqual(['ter'])
    expect(outcome.legs.filter((leg) => leg.kind === 'ride').map((leg) => leg.line?.shortName)).toEqual(['TER'])
    expect(outcome.legs[0]?.from).toBe('Dakar')
    expect(outcome.legs.at(-1)?.to).toBe('Pikine')
  })

  it('retrouve aussi Dakar → Pikine depuis les coordonnées exactes des gares sans identifiants d’arrêt', () => {
    const dakar = getCorridorStop('ter-dakar')!
    const pikine = getCorridorStop('ter-pikine')!
    const outcome = planReferenceJourney(
      { label: 'Dakar', lat: dakar.lat, lon: dakar.lon },
      { label: 'Pikine', lat: pikine.lat, lon: pikine.lon },
      'fastest',
      { allowedNetworks: ['ter'], maxAccessM: 50 },
    )
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.networksUsed).toEqual(['ter'])
    expect(outcome.legs.some((leg) => leg.kind === 'ride' && leg.line?.network === 'ter')).toBe(true)
  })

  it('relie le Plateau à Guédiawaye en BRT sans inventer de correspondance', () => {
    const outcome = planReferenceJourney(PLATEAU, GUEDIAWAYE)
    expect(outcome.ok).toBe(true)
    const result = outcome as PlannerResult
    const rides = result.legs.filter((leg) => leg.kind === 'ride')
    expect(rides.length).toBe(1)
    expect(rides[0].line?.shortName).toBe('B1')
    expect(rides[0].from).toContain('Petersen')
    expect(result.transfers).toBe(0)
    expect(result.totalMinutes).toBeGreaterThan(20)
    expect(result.totalMinutes).toBeLessThan(180)
    expect(result.limitation).toContain('réseau de référence')
  })

  it('combine BRT et TER avec la correspondance marchable déclarée pour Rufisque', () => {
    // Départ près du terminus BRT (Guédiawaye) vers Rufisque, desservi par le seul TER.
    // Sans le BRT, la gare TER la plus proche est à plus d'un kilomètre : le moteur
    // doit donc emprunter la correspondance déclarée Petersen ↔ gare de Dakar.
    const outcome = planReferenceJourney(GUEDIAWAYE, RUFISQUE, 'fastest', { allowedNetworks: ['ter', 'brt'] })
    expect(outcome.ok).toBe(true)
    const result = outcome as PlannerResult
    const lines = result.legs.filter((leg) => leg.kind === 'ride').map((leg) => leg.line?.shortName)
    expect(lines).toContain('B1')
    expect(lines).toContain('TER')
    expect(result.transfers).toBeGreaterThanOrEqual(1)
    expect(result.boardedLines).toEqual(expect.arrayContaining(['B1', 'TER']))
    expect(result.legs.filter((leg) => leg.kind === 'walk_transfer').some((leg) => leg.note?.includes('marche de référence'))).toBe(true)
  })

  it('n’enchaîne pas DDD/AFTU au TER sur la seule proximité de coordonnées approximatives', () => {
    // Les correspondances DDD/AFTU/TATA non confirmées ne sont pas des liens du graphe.
    // Le trajet multimodal reste possible via les deux liaisons TER ↔ BRT déclarées.
    const outcome = planReferenceJourney(GUEDIAWAYE, RUFISQUE)
    expect(outcome.ok).toBe(true)
    const result = outcome as PlannerResult
    expect(result.boardedLines).toEqual(expect.arrayContaining(['B1', 'TER']))
    expect(result.networksUsed.every((network) => network === 'brt' || network === 'ter')).toBe(true)
    for (const leg of result.legs.filter((entry) => entry.kind === 'walk_transfer')) {
      expect(leg.note).toMatch(/marche de référence/)
    }
    expect(result.legs.filter((leg) => leg.kind === 'ride').at(-1)?.to).toBe('Rufisque')
  })

  it('calcule les trois variantes sur le même réseau et expose leurs métriques', () => {
    const fastest = planReferenceJourney(GUEDIAWAYE, RUFISQUE, 'fastest')
    const fewerTransfers = planReferenceJourney(GUEDIAWAYE, RUFISQUE, 'fewerTransfers')
    const lessWalking = planReferenceJourney(GUEDIAWAYE, RUFISQUE, 'lessWalking')
    for (const outcome of [fastest, fewerTransfers, lessWalking]) {
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      expect(outcome.totalMinutes).toBeGreaterThan(0)
      expect(outcome.totalWalkM).toBeGreaterThanOrEqual(0)
      expect(outcome.transfers).toBeGreaterThanOrEqual(0)
      expect(outcome.legs.some((leg) => leg.kind === 'ride')).toBe(true)
    }
  })

  it('refuse un départ trop éloigné du réseau de référence au lieu de deviner', () => {
    const far = { label: 'Mbour', lat: 14.4167, lon: -16.9667 }
    const outcome = planReferenceJourney(far, GUEDIAWAYE)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.reason).toBe('NO_ACCESSIBLE_STOP')
      // Le message reste mesuré : un rayon, une raison, aucune ligne inventée.
      expect(outcome.message).toMatch(/1,2 km/)
      expect(outcome.message).toMatch(/réseau de référence/)
    }
  })

  it('refuse un trajet entre deux points identiques', () => {
    const outcome = planReferenceJourney(PLATEAU, PLATEAU)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('SAME_POINT')
  })

  it('accepte un arrêt de référence choisi explicitement comme départ', () => {
    const stop = getCorridorStop('brt-grand-medine')!
    const origin = { label: stop.name, lat: stop.lat, lon: stop.lon, stopId: stop.id }
    const outcome = planReferenceJourney(origin, RUFISQUE)
    expect(outcome.ok).toBe(true)
    const result = outcome as PlannerResult
    // Le trajet part bien de l’arrêt choisi : soit on y monte directement,
    // soit une marche d’accès démarre de là (vers une gare proche, par exemple).
    expect(result.legs[0].from).toBe(stop.name)
  })

  it('décrit chaque jambe dans un français lisible', () => {
    const outcome = planReferenceJourney(PLATEAU, GUEDIAWAYE) as PlannerResult
    const texts = outcome.legs.map(describeLeg)
    expect(texts[0]).toMatch(/Marcher/)
    expect(texts.some((text) => text.startsWith('B1'))).toBe(true)
  })

  it('compte la marche totale et reste cohérent avec la somme des jambes', () => {
    const outcome = planReferenceJourney(PLATEAU, GUEDIAWAYE) as PlannerResult
    const legSum = outcome.legs.reduce((total, leg) => total + leg.minutes, 0)
    expect(Math.abs(legSum - outcome.totalMinutes)).toBeLessThanOrEqual(outcome.legs.length + 2)
    expect(outcome.totalWalkM).toBeGreaterThanOrEqual(0)
  })
})


describe('couverture des réseaux de bus dans le moteur multimodal', () => {
  function endpoint(stopId: string) {
    const stop = getCorridorStop(stopId)!
    return { label: stop.name, lat: stop.lat, lon: stop.lon, stopId: stop.id }
  }

  it('refuse DDD 1 tant que son sens commercial et sa géométrie routière ne sont pas validés', () => {
    const outcome = planReferenceJourney(endpoint('ddd-parcelles'), endpoint('ddd-leclerc'), 'fastest', { allowedNetworks: ['ddd'] })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('refuse AFTU 42 tant que les arrêts et la géométrie des deux sens ne sont pas validés', () => {
    const outcome = planReferenceJourney(endpoint('aftu-guediawaye'), endpoint('aftu-ouakam'), 'fastest', { allowedNetworks: ['aftu_tata'] })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('refuse le corridor TATA historique tant que son numéro, ses arrêts et son retour ne sont pas vérifiés', () => {
    const outcome = planReferenceJourney(endpoint('tata-colobane'), endpoint('tata-guediawaye'), 'fastest', { allowedNetworks: ['aftu_tata'] })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })
})

describe('cohérence des coûts du calculateur', () => {
  it('ne propose pas un détour à pied quand aucun véhicule n’est emprunté', () => {
    // Deux points à ~110 m l’un de l’autre, mais chacun à ~1,2 km de la gare de
    // Dakar : la chaîne « marche vers la gare puis marche vers la destination »
    // faisait 2,4 km et 30 min pour un déplacement de 2 min à pied.
    const dakar = getCorridorStop('ter-dakar')!
    const a = { label: 'A', lat: dakar.lat + 0.0107, lon: dakar.lon }
    const b = { label: 'B', lat: dakar.lat + 0.0107, lon: dakar.lon + 0.001 }
    const outcome = planReferenceJourney(a, b)
    expect(outcome.ok).toBe(true)
    const result = outcome as PlannerResult
    expect(result.legs).toHaveLength(1)
    expect(result.legs[0].kind).toBe('walk_direct')
    expect(result.boardedLines).toHaveLength(0)
    expect(result.totalMinutes).toBeLessThanOrEqual(3)
    expect(result.totalWalkM).toBeLessThan(200)
  })

  it('préfère la marche directe à une chaîne marche + marche sans transport', () => {
    // Deux points au nord de deux stations BRT voisines : le trajet utile est la
    // marche directe, pas un passage par une station.
    const petersen = getCorridorStop('brt-petersen')!
    const mosquee = getCorridorStop('brt-grande-mosquee')!
    const outcome = planReferenceJourney(
      { label: 'P', lat: petersen.lat + 0.005, lon: petersen.lon },
      { label: 'Q', lat: mosquee.lat + 0.005, lon: mosquee.lon },
    ) as PlannerResult
    expect(outcome.legs.filter((leg) => leg.kind === 'ride')).toHaveLength(0)
    expect(outcome.legs).toHaveLength(1)
    expect(outcome.legs[0].kind).toBe('walk_direct')
    expect(outcome.totalWalkM).toBeLessThan(900)
  })

  it('conserve les trajets qui empruntent réellement un véhicule', () => {
    const outcome = planReferenceJourney(PLATEAU, GUEDIAWAYE) as PlannerResult
    expect(outcome.legs.some((leg) => leg.kind === 'ride')).toBe(true)
    expect(outcome.legs.some((leg) => leg.kind === 'walk_direct')).toBe(false)
  })

  it('décrit la marche directe dans un français lisible', () => {
    const dakar = getCorridorStop('ter-dakar')!
    const outcome = planReferenceJourney(
      { label: 'A', lat: dakar.lat + 0.0107, lon: dakar.lon },
      { label: 'B', lat: dakar.lat + 0.0107, lon: dakar.lon + 0.001 },
    ) as PlannerResult
    expect(describeLeg(outcome.legs[0])).toMatch(/Trajet à pied .* : A → B/)
  })

  it('répond court quand aucun trajet n’est possible', () => {
    const far = { label: 'Mbour', lat: 14.4167, lon: -16.9667 }
    const outcome = planReferenceJourney(far, GUEDIAWAYE)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.message.length).toBeLessThan(120)
  })
})
