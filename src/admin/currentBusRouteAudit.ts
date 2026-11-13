import { BIDIRECTIONAL_BUS_LINES } from '../domain/bidirectionalBusLines'
import { auditBidirectionalBusLines } from './bidirectionalRouteAudit'

/**
 * Exécute l'audit sur le catalogue DDD/AFTU/TATA présent dans le dépôt.
 * Lecture seule : ne modifie ni les lignes, ni les arrêts, ni leur statut.
 */
export function getCurrentBusRouteAudit() {
  return auditBidirectionalBusLines(BIDIRECTIONAL_BUS_LINES)
}
