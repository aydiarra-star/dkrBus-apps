import { BIDIRECTIONAL_BUS_LINES } from '../domain/bidirectionalBusLines'
import { AFTU_ROUTE_EVIDENCE } from './aftuRouteEvidence'
import { auditBidirectionalBusLines } from './bidirectionalRouteAudit'
export function getCurrentBusRouteAudit() { return { ...auditBidirectionalBusLines(BIDIRECTIONAL_BUS_LINES), aftuEvidence: AFTU_ROUTE_EVIDENCE } }
