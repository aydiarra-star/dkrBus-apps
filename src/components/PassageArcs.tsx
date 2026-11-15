/**
 * Les deux arcs verts scintillants affichés devant chaque décompte de créneau
 * théorique (« 17 min ») des tableaux horaires de toutes les mobilités
 * (TER, BRT, DDD, AFTU/TATA).
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
    <svg className="station-board-double-apostrophe" viewBox="0 0 16 10" aria-hidden="true" focusable="false">
      <path d="M4 8 C4.5 6.5 5.5 4.5 7 2" />
      <path d="M9 8 C9.5 6.5 10.5 4.5 12 2" />
    </svg>
  )
}
