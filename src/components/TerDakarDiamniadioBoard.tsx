import { useMemo, useState } from 'react'
import { PassageClock } from './PassageClock'
import { formatPassageCountdown } from '../domain/headways'
import {
  genererHorairesTerDakarDiamniadio,
  libelleFrequenceTerDakarDiamniadio,
  TER_DAKAR_DIAMNIADIO_DISTANCE_KM,
  type TerDakarDiamniadioDirection,
} from '../domain/terDakarDiamniadio'

interface TerDakarDiamniadioBoardProps {
  now: number
}

export function TerDakarDiamniadioBoard({ now }: TerDakarDiamniadioBoardProps) {
  const [direction, setDirection] = useState<TerDakarDiamniadioDirection>('aller')
  const schedule = useMemo(
    () => genererHorairesTerDakarDiamniadio(direction, now),
    [direction, now],
  )
  const destination = direction === 'aller' ? 'Diamniadio' : 'Dakar'
  const origine = direction === 'aller' ? 'Dakar' : 'Diamniadio'

  return (
    <section className="ter-dd-board" aria-label="Horaires TER Dakar - Diamniadio">
      <div className="ter-dd-summary" aria-label="Informations du tronçon Dakar - Diamniadio">
        <article className="ter-dd-summary-card">
          <span>FRÉQUENCE</span>
          <strong>8 / 20 min</strong>
          <small>Lun.–sam. / dim. et jours fériés</small>
        </article>
        <article className="ter-dd-summary-card">
          <span>LONGUEUR</span>
          <strong>{TER_DAKAR_DIAMNIADIO_DISTANCE_KM} km</strong>
          <small>Dakar ↔ Diamniadio</small>
        </article>
        <article className="ter-dd-summary-card">
          <span>ARRÊTS</span>
          <strong>13</strong>
          <small>Gares desservies</small>
        </article>
      </div>

      <header className="ter-dd-heading">
        <div>
          <h3>Arrêts desservis</h3>
          <p>{origine} → {destination}</p>
        </div>
        <button
          type="button"
          className="ter-dd-direction-toggle"
          aria-label={`Basculer vers le sens ${direction === 'aller' ? 'Retour' : 'Aller'}`}
          onClick={() => setDirection((current) => current === 'aller' ? 'retour' : 'aller')}
        >
          {direction === 'aller' ? 'Aller' : 'Retour'} ⇄
        </button>
      </header>

      {schedule ? (
        <>
          <p className="ter-dd-context">
            Prochains passages par gare · Durée de parcours env. {schedule.dureeMinutes} min
          </p>
          <ol className="ter-dd-stops">
            {schedule.rows.map((row) => (
              <li className="ter-dd-stop" key={row.id}>
                <span className="ter-dd-stop-copy">
                  <strong>{row.nom}</strong>
                  <small>
                    {row.estDepart
                      ? 'Départ'
                      : row.estTerminus
                        ? 'Terminus · +45 min'
                        : `+ ${row.decalageMinutes} min`}
                  </small>
                </span>
                <span className="ter-dd-passage" role="timer" aria-live="off">
                  <strong>Dans {formatPassageCountdown(row.dansMinutes)}</strong>
                  <PassageClock atMs={Date.parse(row.passageAt)} now={now} />
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="ter-dd-unavailable">Aucun prochain départ disponible dans la grille de service déclarée.</p>
      )}
      <p className="ter-dd-frequency-note">{libelleFrequenceTerDakarDiamniadio()}</p>
    </section>
  )
}
