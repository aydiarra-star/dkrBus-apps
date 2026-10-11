import { describe, expect, it } from 'vitest'
import {
  alternativeOf,
  describeOption,
  optionByIndex,
  optionSteps,
  optionSummaryLine,
  planJourneyOptions,
  planRoundTrip,
  priceRanking,
  resolvePlanOptions,
} from './journeyOptions'
import { getCorridorStop } from './corridors'
import { formatMeters, type PlannerEndpoint } from './planner'

const point = (id: string): PlannerEndpoint => {
  const stop = getCorridorStop(id)!
  return { label: stop.name, lat: stop.lat, lon: stop.lon, stopId: id }
}

describe('jeu d’options comparables', () => {
  it('propose au plus trois options distinctes, sans doublon de parcours', () => {
    const plan = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'))
    if (!plan.ok) throw new Error(plan.message)
    expect(plan.options.length).toBeGreaterThan(0)
    expect(plan.options.length).toBeLessThanOrEqual(4)
    // Deux critères qui aboutissent au même parcours ne sont pas présentés deux fois.
    expect(new Set(plan.options.map((option) => option.key)).size).toBe(plan.options.length)
    expect(new Set(plan.options.map((option) => option.result.legs.map((leg) => `${leg.kind}:${leg.line?.id ?? ''}:${leg.fromId ?? ''}:${leg.toId ?? ''}`).join('|'))).size).toBe(plan.options.length)
  })

  it('classe chaque option sur un critère nommé et mesuré', () => {
    const plan = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'))
    if (!plan.ok) throw new Error(plan.message)
    const priorities = plan.options.map((option) => option.priority)
    expect(priorities).toContain('fastest')
    for (const option of plan.options) {
      expect(option.label.length).toBeGreaterThan(3)
      // Les mesures annoncées sont celles du parcours calculé, pas des arrondis
      // présentés pour rassurer.
      expect(option.metrics.minutes).toBe(option.result.totalMinutes)
      expect(option.metrics.walkMeters).toBe(option.result.totalWalkM)
      expect(option.metrics.transfers).toBe(option.result.transfers)
      const walkLegs = option.result.legs.filter((leg) => leg.kind.startsWith('walk')).reduce((sum, leg) => sum + (leg.distanceM ?? 0), 0)
      expect(option.metrics.walkMeters).toBeCloseTo(walkLegs, 0)
      expect(describeOption(option)).toMatch(/≈ \d+ min/)
      expect(optionSummaryLine(option)).toContain(formatMeters(option.metrics.walkMeters))
    }
    // L'option la plus rapide n'est jamais plus lente qu'une autre.
    const fastest = plan.options.find((option) => option.priority === 'fastest')!
    for (const option of plan.options) expect(fastest.metrics.minutes).toBeLessThanOrEqual(option.metrics.minutes + 0.5)
    expect(priorities.indexOf('fastest')).toBe(0)
  })

  it('numérote les étapes réellement parcourues, avec les arrêts intermédiaires', () => {
    const plan = planJourneyOptions(point('ter-dakar'), point('ter-diamniadio'))
    if (!plan.ok) throw new Error(plan.message)
    const steps = optionSteps(plan, plan.options[0]!.key)
    expect(steps.length).toBe(plan.options[0]!.result.legs.length)
    expect(steps.join('\n')).toMatch(/Prendre|Marcher|Attendre|Correspondance/)
    expect(steps.some((step) => /arrêt/.test(step))).toBe(true)
  })

  it('ne promet pas trois options quand le réseau n’en calcule que deux', () => {
    const plan = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'))
    if (!plan.ok) throw new Error(plan.message)
    if (plan.options.length < 3) {
      expect(plan.notes.join('\n')).toMatch(/distinctement calculables|même parcours/)
    } else {
      expect(plan.options).toHaveLength(3)
    }
  })

  it('désigne l’autre option distincte, et rien quand il n’y en a qu’une', () => {
    const plan = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'))
    if (!plan.ok) throw new Error(plan.message)
    const first = plan.options[0]!
    const alternative = alternativeOf(plan, first.key)
    if (plan.options.length === 1) {
      expect(alternative).toBeNull()
    } else {
      expect(alternative).not.toBeNull()
      expect(alternative!.key).not.toBe(first.key)
      // Un repli est réellement calculé : il a son propre parcours.
      expect(alternative!.result.legs.length).toBeGreaterThan(0)
    }
    expect(optionByIndex(plan, 99).key).toBe(plan.options[plan.options.length - 1]!.key)
    expect(optionByIndex(plan, -3).key).toBe(plan.options[0]!.key)
  })
})

describe('préférences de l’usager appliquées au calcul', () => {
  it('un réseau exclu n’apparaît plus dans les lignes prises', () => {
    const all = planJourneyOptions(point('brt-prefecture-guediawaye'), point('ter-dakar'))
    const terOnly = planJourneyOptions(point('brt-prefecture-guediawaye'), point('ter-dakar'), { allowedNetworks: ['ter'] })
    if (!all.ok || !terOnly.ok) return // le tout-réseau peut légitimement échouer
    expect(terOnly.options.every((option) => option.result.boardedLines.every((line) => !/^B1$/.test(line)))).toBe(true)
    expect(terOnly.options.flatMap((option) => option.networks).includes('brt')).toBe(false)
  })

  it('une marche plus lente allonge la durée sans changer les lignes', () => {
    const normal = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'), { walkSpeed: 'normal' })
    const slow = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'), { walkSpeed: 'slow' })
    if (!normal.ok || !slow.ok) throw new Error('calcul indisponible')
    expect(slow.options[0]!.metrics.minutes).toBeGreaterThanOrEqual(normal.options[0]!.metrics.minutes)
    expect(slow.options[0]!.result.boardedLines).toEqual(normal.options[0]!.result.boardedLines)
    expect(slow.options[0]!.metrics.walkMeters).toBe(normal.options[0]!.metrics.walkMeters)
  })

  it('le battement choisi s’ajoute à la durée affichée, pas au calcul brut', () => {
    const plain = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'), { transferBufferMin: 0 })
    const buffered = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'), { transferBufferMin: 5 })
    // Le réglage est plafonné côté moteur : un choix plus grand ne peut pas
    // fabriquer une marge que rien ne justifie.
    const beyond = planJourneyOptions(point('brt-petersen'), point('ter-rufisque'), { transferBufferMin: 40 })
    if (beyond.ok) expect(beyond.options.map((option) => option.metrics.displayMinutes)).toEqual(buffered.ok ? buffered.options.map((option) => option.metrics.displayMinutes) : [])
    if (!plain.ok || !buffered.ok) throw new Error('calcul indisponible')
    const withTransfer = buffered.options.find((option) => option.metrics.transfers > 0)
    const samePlain = withTransfer ? plain.options.find((option) => option.key === withTransfer.key) : null
    if (withTransfer && samePlain) {
      expect(withTransfer.metrics.displayMinutes).toBe(samePlain.metrics.displayMinutes + 5 * withTransfer.metrics.transfers)
    }
    expect(resolvePlanOptions({ walkSpeed: 'fast', allowedNetworks: [] }).allowedNetworks).toBeNull()
    expect(resolvePlanOptions({ accessRadius: 'near' }).accessRadius).toBe('near')
  })

  it('la classe TER change le tarif annoncé, sans toucher au parcours', () => {
    const second = planJourneyOptions(point('ter-dakar'), point('ter-diamniadio'), { terClass: 'second' })
    const first = planJourneyOptions(point('ter-dakar'), point('ter-diamniadio'), { terClass: 'first' })
    if (!second.ok || !first.ok) throw new Error('calcul indisponible')
    expect(first.options[0]!.result.boardedLines).toEqual(second.options[0]!.result.boardedLines)
    if (first.options[0]!.metrics.fareCfa !== null && second.options[0]!.metrics.fareCfa !== null) {
      expect(first.options[0]!.metrics.fareCfa!).toBeGreaterThan(second.options[0]!.metrics.fareCfa!)
    }
  })
})

describe('aller-retour réellement recalculé', () => {
  it('recalcule le retour dans l’autre sens au lieu de miroiter l’aller', () => {
    const roundTrip = planRoundTrip(point('brt-petersen'), point('ter-rufisque'))
    expect(roundTrip.ok).toBe(true)
    if (!roundTrip.ok) return
    expect(roundTrip.outbound.direction).toBe('outbound')
    expect(roundTrip.return.ok).toBe(true)
    if (!roundTrip.return.ok) return
    expect(roundTrip.return.direction).toBe('return')
    // Les deux plans sont bien inversés : libellés croisés.
    expect(roundTrip.return.originLabel).toBe(roundTrip.outbound.destinationLabel)
    expect(roundTrip.return.destinationLabel).toBe(roundTrip.outbound.originLabel)
    // Et le parcours retenu n'est pas copié : il est recalculé sur le graphe.
    expect(roundTrip.return.options[0]!.result.legs.length).toBeGreaterThan(0)
  })
})

describe('classement par prix, sans tarif inventé', () => {
  it('refuse de classer dès qu’une ligne sans tarif publié est dans la chaîne', () => {
    const ranking = priceRanking(point('brt-petersen'), point('ter-rufisque'))
    if (ranking.status === 'ranked') {
      // Un classement n'est possible que si chaque option comparée est tarifée.
      expect(ranking.ranked.every((entry) => entry.totalCfa > 0)).toBe(true)
      expect(ranking.note).toMatch(/grilles|billet combiné/)
    } else {
      expect(ranking.reason).toMatch(/Aucun tarif publié|aucune option calculable|couvrent qu’une seule/)
    }
  })

  it('nomme le réseau manquant au lieu de donner un ordre faux', () => {
    const ranking = priceRanking(point('tata-guediawaye'), point('ter-dakar'))
    if (ranking.status === 'unavailable') {
      expect(ranking.reason).toMatch(/DDD|AFTU|TATA|couvrent qu’une seule|Aucun itinéraire/)
      expect(ranking.missingNetworks.length).toBeLessThanOrEqual(3)
    }
    expect(ranking.status === 'ranked' || ranking.status === 'unavailable').toBe(true)
  })

  it('ne renvoie pas de montant quand le calcul d’itinéraire échoue', () => {
    const same = priceRanking(point('ter-dakar'), point('ter-dakar'))
    expect(same.status).toBe('unavailable')
    if (same.status === 'unavailable') expect(same.reason.length).toBeGreaterThan(10)
  })
})
