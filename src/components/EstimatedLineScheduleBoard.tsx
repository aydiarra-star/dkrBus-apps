import {
  AFTU_ESTIMATED_LINE_SCHEDULES,
  DDD_ESTIMATED_LINE_SCHEDULES,
  type EstimatedFrequencyWindow,
} from '../domain/estimatedSchedules'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'

function formatWindow(value: EstimatedFrequencyWindow | null): string {
  if (!value) return 'Non publié'
  return `${value.start}–${value.end} · ${value.interval}`
}

export function EstimatedLineScheduleBoard({ network }: { network: EstimatedScheduleNetwork }) {
  const isDdd = network === 'ddd'
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const label = isDdd ? 'DDD' : network === 'tata' ? 'TATA / AFTU' : 'AFTU'
  const title = isDdd
    ? 'Afficher les estimations des 14 lignes DDD'
    : network === 'tata'
      ? 'Afficher les références horaires partagées AFTU/TATA'
      : 'Afficher les estimations des 28 lignes AFTU'

  return (
    <details className="estimated-line-schedule-board">
      <summary>{title}</summary>
      <p className="estimated-line-schedule-intro">
        {network === 'tata'
          ? 'Les minibus TATA étant rattachés au réseau AFTU, cette affiche reprend les références AFTU disponibles. Aucune fréquence indépendante TATA n’est affirmée.'
          : 'Plages de service et intervalles indicatifs par ligne. Ce sont des estimations de planification, pas des horaires de passage en temps réel.'}
      </p>
      <div className="estimated-line-schedule-scroll">
        <table className="estimated-line-schedule-table">
          <thead>
            <tr>
              <th scope="col">Ligne</th>
              <th scope="col">Lun. – ven.</th>
              <th scope="col">Samedi</th>
              <th scope="col">Dimanche</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.line}>
                <th scope="row">{label} {schedule.line}</th>
                <td>{formatWindow(schedule.weekday)}</td>
                <td>{formatWindow(schedule.saturday)}</td>
                <td>{formatWindow(schedule.sunday)}</td>
                <td>
                  <a href={schedule.sourceUrl} target="_blank" rel="noreferrer">{schedule.sourceLabel}</a>
                  {schedule.note ? <small className="estimated-line-schedule-note">{schedule.note}</small> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="estimated-line-schedule-disclaimer">
        Références TransitByCity, actualisation affichée au 28 mai 2026, sauf la ligne 1 DDD dont les premiers et derniers départs proviennent d’une publication de Dakar Dem Dikk. Les fréquences peuvent varier selon le trafic, la disponibilité des véhicules et les jours. Vérifier auprès de l’opérateur avant le départ.
      </p>
    </details>
  )
}
