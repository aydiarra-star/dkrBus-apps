import { BIDIRECTIONAL_BUS_LINES } from '../domain/bidirectionalBusLines'
import { AFTU_ROUTE_EVIDENCE } from './aftuRouteEvidence'
import { auditBidirectionalBusLines } from './bidirectionalRouteAudit'

/**
 * Audit du catalogue et des preuves de parcours AFTU conservées séparément.
 * Les libellés de fiches ne sont pas convertis en identifiants d'arrêts et
 * ne changent jamais le statut du catalogue voyageurs.
 */
export function getCurrentBusRouteAudit() {
  return {
    ...auditBidirectionalBusLines(BIDIRECTIONAL_BUS_LINES),
    aftuEvidence: AFTU_ROUTE_EVIDENCE,
  }
}
