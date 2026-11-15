/**
 * Les deux arcs verts scintillants (un grand arc externe et un petit arc
 * interne imbriqué à sa droite) affichés devant chaque décompte de créneau
 * théorique (« 17 min », « 50 min ») des tableaux horaires de toutes les
 * mobilités (TER, BRT, DDD, AFTU/TATA).
 *
 * Strictement identiques partout : même tracé, même classe
 * (`station-board-double-apostrophe`), même animation CSS
 * (`station-board-apostrophe-twinkle`, désactivée si
 * `prefers-reduced-motion: reduce`). N'afficher ces arcs que pour un décompte
 * de minutes d'un service en cours : jamais pour « Terminus », « Estimation »,
 * « En service », « Fin de service », « Pas de service » ou une reprise hors
 * service — ces états ne sont pas des créneaux qui décomptent.
 *
 * Purement décoratif (`aria-hidden`) : le sens accessible est porté par la
 * ligne (`role="status"`, `aria-label`), qui dit déjà « créneau théorique …
 * pas de temps réel ».
 */
export function PassageArcs() {
  return (
    <svg className="station-board-double-apostrophe" viewBox="0 0 15 24" aria-hidden="true" focusable="false">
      <path d="M6.3 2.6 A13.6 13.6 0 0 0 6.3 21.4" />
      <path d="M11.9 8.6 A5.4 5.4 0 0 0 11.9 15.4" />
    </svg>
  )
}
