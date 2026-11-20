import packet from '../../data/bus-review/reported-218-73.json'
import { inspectReportedRun, type ReportedRun } from './reportedRunReview'

function Run({ run }: { run: ReportedRun }) {
  const review = inspectReportedRun(run)
  return <li><strong>{run.from} → {run.to}</strong><span>Départ de référence : {run.referenceDeparture}</span>
    {review.issues.map(issue => <span key={issue}>{issue}</span>)}
    {run.calls && <ol>{run.calls.map((c, i) => <li key={i}>{c.rank}. {c.stop} · {c.time}{c.dayOffset === 1 ? ' (+1 j)' : ''}</li>)}</ol>}
    {review.durationMinutes !== null && <span>Durée de cette course : {review.durationMinutes} min</span>}
    {review.repeatedLabels.map(([name, ranks]) => <span key={name}>{name} : rangs distincts {ranks.join(', ')}</span>)}
  </li>
}

export function ReportedBusRunsPanel() {
  return <details className="bus-route-audit-sources"><summary>Relevé communiqué · DDD 218 et AFTU 73 vers Niague</summary>
    <p>Références fournies, pas des passages observés. Document original, date de service, type de jour et période inconnus. Aucun départ ajouté aux panneaux ou au calculateur.</p>
    {packet.lines.map(l => <section key={l.family + l.code} aria-label={`${l.family.toUpperCase()} ${l.code} · références`}>
      <h4>{l.family.toUpperCase()} {l.code}</h4><p>Intervalle annoncé : {l.announcedHeadwayMinutes} min.</p>
      {l.otherStartMention && <p>Le texte mentionne aussi {l.otherStartMention}, sans préciser le sens. Ce n’est pas une course supplémentaire.</p>}
      <ul>{l.directions.map(run => <Run key={run.from} run={run} />)}</ul>
    </section>)}
    <p>La grille Lac Rose → Thiaroye (05:55 → 06:54 en semaine) reste distincte. Sans les arrêts et les arrivées du relevé, ni sa durée par sens ni son statut de variante ne sont établis.</p>
    <a href={packet.summaryUrl} target="_blank" rel="noreferrer">Résumé du relevé communiqué</a>
  </details>
}
