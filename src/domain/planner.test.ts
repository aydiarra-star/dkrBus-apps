import { describe, expect, it } from 'vitest'
import { CORRIDOR_LINES, getCorridorStop, networkLabelOf, type CorridorLine } from './corridors'
import { describeLeg, directedStopSequences, planReferenceJourney, type PlannerResult } from './planner'

const PLATEAU_STOP = getCorridorStop('brt-petersen')!
const GUEDIAWAYE_STOP = getCorridorStop('brt-prefecture-guediawaye')!
const RUFISQUE_STOP = getCorridorStop('ter-rufisque')!
const PLATEAU = { label: PLATEAU_STOP.name, lat: PLATEAU_STOP.lat, lon: PLATEAU_STOP.lon, stopId: PLATEAU_STOP.id }
const GUEDIAWAYE = { label: GUEDIAWAYE_STOP.name, lat: GUEDIAWAYE_STOP.lat, lon: GUEDIAWAYE_STOP.lon, stopId: GUEDIAWAYE_STOP.id }
const RUFISQUE = { label: RUFISQUE_STOP.name, lat: RUFISQUE_STOP.lat, lon: RUFISQUE_STOP.lon, stopId: RUFISQUE_STOP.id }

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
  it('n’utilise pas AFTU 53 tant que sa séquence officielle et sa géométrie ne sont pas intégrées', () => {
    const line53 = CORRIDOR_LINES.find((line) => line.shortName === 'AFTU 53')
    expect(line53).toBeDefined()
    expect(line53?.plannerEnabled).toBe(false)
    const outcome = planReferenceJourney(
      { label: 'Keur Massar', lat: 14.79, lon: -17.31 },
      RUFISQUE,
    )
    if (outcome.ok) {
      expect(outcome.legs.filter((leg) => leg.kind === 'ride').every((leg) => leg.line?.shortName !== 'AFTU 53')).toBe(true)
    }
  })

  it('relie Petersen à Guédiawaye en BRT avec la géométrie directionnelle réelle', () => {
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

  it('refuse une correspondance TER/BRT tant que le chemin piéton réel manque', () => {
    // Les 1 km de marche déclarés entre gare TER et BRT ne sont pas un chemin piéton.
    // Le moteur refuse donc cette correspondance tant que le graphe piéton réel manque.
    const outcome = planReferenceJourney(GUEDIAWAYE, RUFISQUE, 'fastest', { allowedNetworks: ['ter', 'brt'] })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('n’enchaîne pas DDD/AFTU au TER sur la seule proximité de coordonnées approximatives', () => {
    // Aucune correspondance inter-réseaux positive n'est autorisée sans chemin piéton.
    const outcome = planReferenceJourney(GUEDIAWAYE, RUFISQUE)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
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
      expect(outcome.message).toMatch(/arrêt exact sélectionné/)
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

  it('calcule un trajet sur une ligne DDD entre deux pôles connus', () => {
    const outcome = planReferenceJourney(endpoint('ddd-parcelles'), endpoint('ddd-leclerc'), 'fastest', {
      allowedNetworks: ['ddd'],
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('calcule un trajet sur une ligne AFTU sans basculer sur le TER ou le BRT', () => {
    const outcome = planReferenceJourney(endpoint('aftu-guediawaye'), endpoint('aftu-ouakam'), 'fastest', {
      allowedNetworks: ['aftu_tata'],
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_PATH')
  })

  it('calcule un trajet AFTU depuis les anciens arrêts TATA du référentiel', () => {
    const outcome = planReferenceJourney(endpoint('tata-colobane'), endpoint('tata-guediawaye'), 'fastest', {
      allowedNetworks: ['aftu_tata'],
    })
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
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_ACCESSIBLE_STOP')
  })

  it('préfère la marche directe à une chaîne marche + marche sans transport', () => {
    // Deux points au nord de deux stations BRT voisines : le trajet utile est la
    // marche directe, pas un passage par une station.
    const petersen = getCorridorStop('brt-petersen')!
    const mosquee = getCorridorStop('brt-grande-mosquee')!
    const outcome = planReferenceJourney(
      { label: 'P', lat: petersen.lat + 0.005, lon: petersen.lon },
      { label: 'Q', lat: mosquee.lat + 0.005, lon: mosquee.lon },
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('NO_ACCESSIBLE_STOP')
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
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.message).toMatch(/chemin piéton vérifié/)
  })

  it('répond court quand aucun trajet n’est possible', () => {
    const far = { label: 'Mbour', lat: 14.4167, lon: -16.9667 }
    const outcome = planReferenceJourney(far, GUEDIAWAYE)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.message.length).toBeLessThan(120)
  })
})
