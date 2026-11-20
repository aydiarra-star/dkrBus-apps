import { AFTU73_SHEETS } from '../data/aftu73Checkpoints'
import { TATA_2020_SOURCE } from '../data/tataBoardReview'
import type { BusBoardDirection } from '../domain/busPassageBoard'

/** Only on the reviewed reading sheets, never a platform binding, a clock,
 * another operator's homonymous line or the day's published edition. */
export function BusSurveyNote({ name, d }: { name: string; d: BusBoardDirection }) {
  if (d.clock?.kind !== 'model') return null
  if (name === 'DDD 218' && d.source === 'https://demdikk.sn/info-voyageurs/' && d.pointKind === 'départ seul' &&
    d.from === 'Aéroport LSS' && d.to === 'Thiaroye' && d.points.length === 1 && d.points[0] === d.from) {
    return <details className="bus-survey-note"><summary>Prendre ensuite la 73 à Thiaroye ?</summary>
      <p>Ce panneau estime le départ de la 218 à Aéroport LSS, pas son arrivée au dépôt. Avant de descendre, demandez où rejoindre le départ de la 73 vers Lac Rose. Ni le chemin entre les bus ni le temps disponible ne sont confirmés.</p>
      <p><a href="https://aftu-senegal.org/map/dakar-urbain-ligne-73/" target="_blank" rel="noreferrer">Voir le départ sur la carte de la 73</a></p>
    </details>
  }
  if (name === 'AFTU 73') {
    const sheet = AFTU73_SHEETS.find(s => s.page === d.source && s.from === d.from && s.to === d.to)
    if (!sheet || d.points[0] !== sheet.origin || d.points.at(-1) !== sheet.terminal || d.points[sheet.cemRank-1] !== 'Cem Thiaroye') return null
    const timings = sheet.grid === d.clock.originBasis && <p><a href={sheet.grid} target="_blank" rel="noreferrer">Grille de la 73 vers {sheet.to}</a> : le panneau utilise les heures de cette fiche aux deux terminus et à Cem Thiaroye. Entre ces repères, les passages sont estimés. Ce ne sont pas des horaires garantis pour votre date.</p>
    if (d.from === 'Thiaroye') {
      return <details className="bus-survey-note"><summary>Où prendre la 73 à Thiaroye ?</summary>
        <p>La <a href="https://aftu-senegal.org/map/dakar-urbain-ligne-73/" target="_blank" rel="noreferrer">carte de l’AFTU</a> situe le départ près du poteau « Terminus 217 et 218 ». Si vous arrivez par la 218, demandez où monte la 73 vers Lac Rose. Le même quai n’est pas confirmé.</p>
        {timings}
      </details>
    }
    return <details className="bus-survey-note"><summary>Continuer en 218 à Thiaroye ?</summary>
      <p>La <a href={d.source} target="_blank" rel="noreferrer">fiche de la 73 depuis Lac Rose</a> se termine à Dépôt Thiaroye, après Cem Thiaroye. Le point de descente n’est pas forcément celui du départ de la 73.</p>
      <p>Pour rejoindre Aéroport LSS, faites confirmer le quai et le départ de la 218 au dépôt. La grille depuis Rufisque ne s’applique pas ici.</p>
      {timings}
    </details>
  }
  const westbound = (name === 'DDD 218' && d.source === 'https://demdikk.sn/reseau-urbain-dakar/' &&
    d.from === 'Dépôt Thiaroye' && d.to === 'Terminus Aéroport LSS' && d.points[3] === 'Patte d’Oie') ||
    (name === 'TATA 60' && d.source === TATA_2020_SOURCE && d.from === 'Bargny' && d.to === 'Colobane' && d.points[6] === 'Patte d’Oie')
  if (!westbound) return null
  return <details className="bus-survey-note"><summary>Changer à Patte d’Oie ?</summary>
    <p>Un <a href="https://www.openstreetmap.org/way/639363334" target="_blank" rel="noreferrer">chemin de 23,7 m entre deux poteaux</a> figure sur la carte. La carte les nomme DDD et TATA sans indiquer les lignes desservies.</p>
    <p>Demandez si la 218 vers Aéroport LSS et la 60 vers Colobane s’y arrêtent et à quelles heures. Les minutes du panneau ne confirment pas cette correspondance.</p>
  </details>
}
