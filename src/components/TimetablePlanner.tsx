import { useState, type ReactNode } from 'react'
import { Clock3 } from 'lucide-react'
import { MARISTES_ID, maristesSheets, timetableStops } from '../data/maristesTimetables'
import type { JourneySettings } from '../routing/placeConnections'
import { dakarClock } from '../routing/presentation'
import { compareTimetables } from '../routing/timetableAdvice'

/** No MapPoint, coordinates, geolocation, driving fallback or map callback. */
export function TimetablePlanner({ settings, controls }: { settings: JourneySettings; controls: ReactNode }) {
  const [from, setFrom] = useState('37702749'), [to, setTo] = useState('37702002')
  const [requested, setRequested] = useState(false)
  const advice = requested ? compareTimetables(from, to, settings) : null
  const stop = (id: string) => timetableStops.find(s => s.id === id)!
  const options = timetableStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
  return <section className="verified-journeys schedule-planner" aria-label="Trajet sur horaires publiés">
    <header><Clock3 size={18} aria-hidden="true"/><h3>Comparer les horaires aux Maristes</h3></header>
    <p>DDD 12 vers Palais et AFTU 75 vers Colobane. Choisissez les arrêts des fiches : ils sont distincts des points de la carte et de votre position GPS.</p>
    <p>Extrait de semaine, autour de 05 h et de 19 h, du 16 au 20 novembre 2026. Le calcul cherche un départ dans l’heure qui suit, parmi les seules courses relues.</p>
    <form onSubmit={e => { e.preventDefault(); setRequested(true) }}>
      <label className="verified-departure">Départ sur fiche<select value={from} onChange={e => setFrom(e.target.value)}>{options}</select></label>
      <label className="verified-departure">Arrivée sur fiche<select value={to} onChange={e => setTo(e.target.value)}>{options}</select></label>
      {controls}
      <button type="submit" className="primary-action route-submit"><Clock3 size={16} /> Comparer les horaires</button>
    </form>
    <div aria-live="polite">{advice && (advice.kind === 'unavailable' ? <p role="status">{advice.message}</p> : <article className="verified-trip">
      <h4>{advice.gapSeconds === null ? 'Direct sur horaires' : 'Changement possible sur horaires'}</h4>
      <p>Heures théoriques à Dakar, pas des passages en temps réel.</p>
      <ol>{advice.legs.map(l => <li key={l.line}>
        <strong>{l.line} vers {l.towards}</strong><br/>{dakarClock(l.start)} · {stop(l.from).name} → {dakarClock(l.end)} · {stop(l.to).name}
      </li>)}</ol>
      {advice.gapSeconds !== null && <p><strong>{advice.gapSeconds / 60} min entre les deux passages</strong> sur la <a href={stop(MARISTES_ID).url} target="_blank" rel="noreferrer">même fiche « Route des Maristes, 141 »</a>. Marge retenue : {advice.marginSeconds / 60} min. Il reste au plus {(advice.gapSeconds - advice.marginSeconds) / 60} min pour rejoindre le second bus en conservant cette marge. Ce budget n’est pas une durée de marche : le point de montée et le chemin restent à confirmer.</p>}
      <p>Aucun tracé ni accès à pied vérifié pour cette proposition.</p>
    </article>)}</div>
    <details><summary>Sources et limites</summary><p>Horaires de semaine publiés sur Moovit : {maristesSheets.map((s,i) => <span key={s.line}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.line} vers {s.towards}</a></span>)}. Les fiches d’arrêt du jeudi ont été mises à jour le 16 novembre. Il ne s’agit pas d’une édition opérateur datée.</p>
      <p><a href={stop(from).url} target="_blank" rel="noreferrer">Fiche de départ</a> · <a href={stop(to).url} target="_blank" rel="noreferrer">Fiche d’arrivée</a>. La fiche de l’autre côté de la route n’est pas utilisée. Les poteaux de la 232 aux Maristes ne localisent pas la montée dans la 12. Aucune course n’est déduite d’un intervalle entre deux lignes du tableau.</p>
    </details>
  </section>
}
