import { describe, expect, it } from 'vitest'
import { answerAssistant } from './assistant'
import { departureAdvice, extractMobilityIntent } from './intent'
import { priceRanking } from './journeyOptions'
import { getCorridorStop } from './corridors'
import type { PlannerEndpoint } from './planner'

const POINT = (id: string): PlannerEndpoint => {
  const stop = getCorridorStop(id)!
  return { label: stop.name, lat: stop.lat, lon: stop.lon, stopId: id }
}

const CONTEXT = { publishedAvailable: false, adminOnline: false }
const NOW = Date.parse('2026-10-10T07:00:00Z')

describe('copilote local à intentions explicites', () => {
  it('reconnaît lieux, comparaison, critères, heure Dakar et lendemain sans inventer de GPS', () => {
    const request = extractMobilityIntent('Compare les trajets de Petersen à Rufisque avant 9 h, moins de marche')
    expect(request).toMatchObject({ origin: { stopId: 'brt-petersen' }, destination: { stopId: 'ter-rufisque' }, compare: true, priority: 'lessWalking', arrivalMinutes: 540 })
    expect(extractMobilityIntent('trajet de Colobane à Bargny demain avant 09:30')).toMatchObject({ tomorrow: true, arrivalMinutes: 570 })
    expect(extractMobilityIntent('bonjour')).toBeNull()
    expect(extractMobilityIntent('je veux aller à Rufisque')?.origin).toBeNull()
  })

  it('classe sur marche et correspondances avec les mesures réelles', () => {
    expect(answerAssistant('Compare les trajets de Petersen à Rufisque, moins de marche', CONTEXT, NOW)).toMatch(/Copilote.*moins de marche/i)
    expect(answerAssistant('Trajet de Guédiawaye à Diamniadio sans correspondance', CONTEXT, NOW)).toContain('Le moins de correspondances')
  })

  it('refuse de classer par prix dès qu’un réseau sans tarif déclaré est dans la chaîne', () => {
    const cheapest = answerAssistant('Quel trajet de Petersen à Rufisque est le moins cher ?', CONTEXT, NOW)
    // Petersen ↔ Rufisque fait intervenir AFTU : aucun tarif n'étant publié pour
    // ce réseau, aucun total n'est avancé — et la raison nomme la ligne manquante.
    expect(cheapest).toMatch(/Aucun tarif publié pour AFTU 1/)
    expect(cheapest).toMatch(/pas comparable/)
    expect(cheapest).not.toMatch(/total de \d+\s*F CFA/i)
  })

  it('classe par prix quand toutes les options comparées ont une grille publiée', () => {
    const ranked = priceRanking(POINT('brt-prefecture-guediawaye'), POINT('ter-rufisque'), { allowedNetworks: ['ter', 'brt'] })
    expect(ranked.status).toBe('ranked')
    if (ranked.status !== 'ranked') return
    // Le chiffre est accompagné de sa source et de sa limite : une somme de
    // tickets, jamais un billet combiné.
    expect(ranked.note).toContain('grilles')
    expect(ranked.note).toContain('billet combiné')
    expect(ranked.ranked.every((entry) => entry.totalCfa > 0)).toBe(true)
    const sorted = [...ranked.ranked].sort((a, b) => a.totalCfa - b.totalCfa)
    expect(ranked.ranked.map((entry) => entry.totalCfa)).toEqual(sorted.map((entry) => entry.totalCfa))
  })

  it('ne promet pas de départ ni de service en calculant une heure cible', () => {
    const text = answerAssistant('Trajet de Petersen à Rufisque avant 9 h', CONTEXT, NOW)
    expect(text).toContain('départ estimé')
    expect(text).toContain('heure de Dakar')
    expect(text).toContain('ni un service à cette heure')
    expect(departureAdvice(540, 60, NOW)).toContain('08:00')
    expect(departureAdvice(540, 60, Date.parse('2026-10-10T12:00:00Z'))).toContain('11/10')
    expect(answerAssistant('Trajet de Petersen à Rufisque avant 25 h', CONTEXT, NOW)).toContain('Heure d’arrivée invalide')
  })

  it('donne l’essentiel sur le lieu connu au lieu d’une phrase toute faite', () => {
    const destinationOnly = answerAssistant('Je veux aller à Rufisque avant 9h', CONTEXT, NOW)
    expect(destinationOnly).toContain('Rufisque')
    expect(destinationOnly).toContain('Itinéraire repère')
    expect(destinationOnly).toContain('Il me manque votre point de départ')
    expect(destinationOnly).not.toContain('Quel est votre point de départ ?')
    expect(destinationOnly).toContain('aucune heure de départ')

    const unknownOrigin = answerAssistant('trajet de Mbour à Rufisque', CONTEXT, NOW)
    expect(unknownOrigin).toContain('Mbour')
    expect(unknownOrigin).toContain('Rufisque')
    expect(unknownOrigin).toContain('Itinéraire repère')
    expect(unknownOrigin).not.toContain('Quel est votre point de départ ?')
  })
})
