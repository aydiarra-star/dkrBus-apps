import type { PlannerEndpoint } from '../domain/planner'
import type { JourneyMemory } from '../domain/conversation'
import { routePreferencesFrom } from '../domain/intent'
import { planDakarJourney } from './dakar'
import { dakarClock, tripSummary } from './presentation'
import type { Network, Query } from './model'

/** The passenger UI injects the SAME dated service into text search and chat.
 * Historical simulation is not a fallback when the verified graph says no. */
export type PassengerLookup = (from: PlannerEndpoint, to: PlannerEndpoint, question: string, lang: 'fr' | 'wo', tripId?: string) => { text: string; memory: JourneyMemory | null }
export function passengerLookup(options: Omit<Query, 'origin' | 'destination'>, network?: Network): PassengerLookup {
  return (from, to, question, lang, tripId) => {
    const mapPoint = (p: PlannerEndpoint) => ({ ...p, lng: p.lon })
    const prefs = routePreferencesFrom(question)
    const header = `${lang === 'wo' ? 'Yoon wi' : 'Trajet'} · ${from.label} → ${to.label}`
    if (prefs.arrivalRequested || prefs.tomorrow) return { text: `${header}. Choisissez la date et l’heure de départ à Dakar dans Trajet ; aucune heure de départ n’est déduite d’une durée approximative.`, memory: null }
    const result = planDakarJourney(mapPoint(from), mapPoint(to), options, network)
    if (!result.ok) {
      const notes = result.documentation?.slice(0, 2).map(d => `Fiche à vérifier, pas un trajet : ${d.line} cite « ${d.fromLabel} » puis « ${d.toLabel} ». ${d.window ?? ''} Source : ${d.source}. Pour vérifier les arrêts et le passage : ${d.operator.name}, ${d.operator.phone}.`)
      const sections = result.connections?.sections.length ? 'Trajet propose des tronçons calculés entre arrêts ; les marches manquantes ne sont pas incluses.' : ''
      const fragment = result.mapSections?.[0]
      const trace = fragment && `Carte uniquement : ${fragment.review.family.toUpperCase()} ${fragment.review.line}, ${fragment.markers[0].name} → ${fragment.markers.at(-1)!.name}. Ni accès à pied ni horaire confirmé. Voir la portion dans Trajet.`
      const c = result.changesToCheck?.[0]
      const change = c && `À vérifier séparément, secteur ${c.hub} : ${c.before.line} (« ${c.before.from} » → « ${c.before.to} »), puis ${c.after.line} (« ${c.after.from} » → « ${c.after.to} »). Marche et départ suivant non confirmés. Voir les deux sources dans Trajet.`
      return { text: [`${header} : ${lang === 'wo' ? 'Amul yoon wu ñu wóoral. ' : ''}${result.message}`, ...(notes ?? []), trace, change, sections].filter(Boolean).join('\n'), memory: null }
    }
    const criterion = prefs.priority === 'lessWalking' ? 'walking' : prefs.priority === 'fewerTransfers' ? 'changes' : 'fastest'
    const trip = tripId ? result.options.find(t => t.id === tripId) : result.options.find(t => t.best.includes(criterion)) ?? result.options[0]
    if (!trip) return { text: `${header} : la variante précédente n’est plus disponible à cette heure avec ces réglages. Choisissez un nouveau trajet.`, memory: null }
    const rides = trip.legs.flatMap(l => l.kind === 'ride' ? [l] : [])
    const steps = trip.legs.map(l => `${dakarClock(l.start)} · ${l.kind === 'ride' ? `${l.lineName} (${l.direction})` : 'Marche'} : ${l.from.name} → ${l.to.name} · ${dakarClock(l.end)}`)
    const stops = /arr[êe]ts/i.test(question) ? rides.map(r => `Desserte ${r.lineName} : ${r.stops.map(s => s.name).join(' → ')}`).join('\n') : ''
    return { text: `${header}\n${tripSummary(trip)}\n${steps.join('\n')}${stops ? `\n${stops}` : ''}\nDe point de desserte à point de desserte ; temps estimés, pas de temps réel.${prefs.priority === 'cheapest' ? ' Aucun classement par prix.' : ''} Les options et les sources sont dans Trajet.`,
      memory: { tripId: trip.id, origin: from, destination: to, steps, totalMinutes: Math.ceil(trip.totalSeconds / 60), transfers: trip.changes,
        boardedLines: rides.map(r => r.lineName), alightStop: rides.at(-1)?.to.name ?? null } }
  }
}
