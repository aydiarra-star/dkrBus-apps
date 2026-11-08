import {
  AFTU_ESTIMATED_LINE_SCHEDULES,
  DDD_ESTIMATED_LINE_SCHEDULES,
  type EstimatedFrequencyWindow,
} from '../domain/estimatedSchedules'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'

function formatWindow(value: EstimatedFrequencyWindow | null, line: string): string {
  if (!value) return line === '1' ? 'Départs par terminus (voir note)' : 'Pas de service'
  return `${value.start}–${value.end} · ${value.interval}`
}

export function EstimatedLineScheduleBoard({ network }: { network: EstimatedScheduleNetwork }) {
  const isDdd = network === 'ddd'
  const schedules = isDdd ? DDD_ESTIMATED_LINE_SCHEDULES : AFTU_ESTIMATED_LINE_SCHEDULES
  const label = isDdd ? 'DDD' : network === 'tata' ? 'TATA / AFTU' : 'AFTU'
  const title = isDdd
    ? 'Afficher les 13 lignes DDD indexées + les départs publiés ligne 1'
    : network === 'tata'
      ? 'Afficher les références partagées AFTU/TATA (28 lignes indexées)'
      : 'Afficher les estimations des 28 lignes AFTU indexées'

  return (
    <details className="estimated-line-schedule-board">
      <summary>{title}</summary>
      <p className="estimated-line-schedule-intro">
        {network === 'tata'
          ? 'Les minibus TATA étant rattachés au réseau AFTU, cette affiche reprend les références AFTU disponibles. Aucune fréquence indépendante TATA n’est affirmée.'
          : isDdd
            ? '13 lignes DDD sont présentes dans l’index consulté ; la ligne 1 est ajoutée à partir des départs publiés par l’opérateur. Les autres lignes non indexées gardent leur estimation générale réseau.'
            : '28 lignes figurent dans l’index consulté, qui ne couvre pas l’ensemble des lignes AFTU. Les autres lignes gardent l’estimation générale réseau. Ce sont des références de planification, pas des horaires de passage en temps réel.'}
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
                <td>{formatWindow(schedule.weekday, schedule.line)}</td>
                <td>{formatWindow(schedule.saturday, schedule.line)}</td>
                <td>{formatWindow(schedule.sunday, schedule.line)}</td>
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
        Références TransitByCity, actualisation affichée au 28 mai 2026, sauf la ligne 1 DDD dont les départs proviennent d’une publication de Dakar Dem Dikk. Les fréquences peuvent varier selon le trafic, la disponibilité des véhicules et les jours. Vérifier auprès de l’opérateur avant le départ.
      </p>
    </details>
  )
}
