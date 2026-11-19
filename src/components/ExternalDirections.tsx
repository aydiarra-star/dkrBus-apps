import { inDakar } from '../routing/geometry'
import type { DakarEndpoint } from '../routing/placeConnections'

/** User-initiated hand-off only. No SDK, API key, background request or result
 * imported as a verified itinerary. The link carries the chosen points, not
 * a fabricated bus stop, route, departure time or accessibility assurance. */
export function ExternalDirections({ from, to }: { from: DakarEndpoint; to: DakarEndpoint }) {
  if (![from, to].every(p => inDakar({ lat: p.lat, lon: p.lng }))) return null
  const coords = (p: DakarEndpoint) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
  const href = (mode: 'transit' | 'walking') => `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', origin: coords(from), destination: coords(to), travelmode: mode })}`
  return <details className="external-directions"><summary>Chercher ces deux points dans une autre carte</summary>
    <p>En ouvrant un lien, vous partagez les coordonnées choisies avec Google Maps. Indiquez-y de nouveau l’heure et vos préférences. Les résultats dépendent de sa couverture et ne sont pas vérifiés par Dakar Bus.</p>
    <a href={href('transit')} target="_blank" rel="noreferrer">Transports en commun</a> · <a href={href('walking')} target="_blank" rel="noreferrer">Marche à pied</a>
  </details>
}
