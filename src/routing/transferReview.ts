/** Evidence review for ONE proposed direction, against an already compiled
 * staging network. It does not modify that network or authorize publication. */
import type { Evidence, Footway, Network, StepFree, VehicleMode } from './model'
import { reviewed } from './geometry'

export interface TransferEnd { stopId: string; mode: VehicleMode }
export interface TransferDirection { from: TransferEnd; to: TransferEnd; betweenSites: boolean }
/** A reviewed observation binds a catalogued stop to a specific platform and
 * service direction. It is not a station-parent link or a proximity match. */
export interface PlatformObservation extends TransferEnd {
  platformId: string
  lineId: string
  direction: string
  evidence: Evidence
}
export interface TransferProof {
  alight?: PlatformObservation
  board?: PlatformObservation
  path?: {
    scope: 'internal' | 'via-street'
    wayIds: readonly string[] // in observed traversal order, including station passages
    gates?: readonly [exitId: string, entranceId: string]
    evidence: Evidence
  }
}
export type ReviewCode = 'ALIGHT_PLATFORM' | 'BOARD_PLATFORM' | 'ALIGHT_DIRECTION' | 'BOARD_DIRECTION'
  | 'GRAPH_ADMISSION' | 'PATH_EVIDENCE' | 'DIRECTED_CHAIN' | 'PUBLIC_GATES'
export interface Finding { code: ReviewCode; action: string }
export interface TransferAssessment {
  status: 'blocked' | 'qualified-for-review'
  findings: Finding[]
  meters: number | null
  walkStepFree: StepFree | null
}

export function assessTransfer(net: Network, candidate: TransferDirection, proof: TransferProof = {}): TransferAssessment {
  const findings: Finding[] = []
  const report = (code: ReviewCode, action: string) => findings.push({ code, action })
  function endpoint(end: TransferEnd, observation: PlatformObservation | undefined, boarding: boolean) {
    const platform = observation && net.places.get(observation.platformId)
    const certified = platform?.kind === 'platform' && observation?.stopId === end.stopId && observation.mode === end.mode && reviewed(observation.evidence)
    if (!certified) report(boarding ? 'BOARD_PLATFORM' : 'ALIGHT_PLATFORM',
      `Identifier et sourcer le quai de ${boarding ? 'montée' : 'descente'} de ${end.stopId}, pour la ligne et le sens concernés.`)
    // Without a binding the reference call can identify a service gap, but
    // NEVER serve as a walkable platform. Alighting at the first call and
    // boarding at the last call are impossible, even on an admitted pattern.
    const served = net.patterns.some(p => p.mode === end.mode &&
      (!observation || (p.lineId === observation.lineId && p.direction === observation.direction)) &&
      p.calls.some((c, i) => c.id === (certified ? platform.id : end.stopId) && (boarding ? i < p.calls.length - 1 : i > 0)))
    if (!served) report(boarding ? 'BOARD_DIRECTION' : 'ALIGHT_DIRECTION',
      `Valider une desserte orientée permettant la ${boarding ? 'montée' : 'descente'} à ${end.stopId}.`)
    return certified ? platform.id : undefined
  }
  if (net.rejected.length) report('GRAPH_ADMISSION', `Corriger les objets refusés à la compilation du dossier : ${net.rejected.join(', ')}.`)
  const from = endpoint(candidate.from, proof.alight, false), to = endpoint(candidate.to, proof.board, true)
  const path = proof.path
  const edges: Footway[] = []
  if (!path || !['internal', 'via-street'].includes(path.scope) || !Array.isArray(path.wayIds) || !path.wayIds.length || !reviewed(path.evidence)) {
    report('PATH_EVIDENCE', 'Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.')
  } else if (from && to) {
    // Inspect the OBSERVED chain, not an alternative shortest path or the
    // reverse of another dossier. buildNetwork already checked every edge's
    // evidence, public access, barriers, vertices and geometric endpoints.
    const nodes = [from]
    for (const id of path.wayIds) {
      const edge = net.walking.get(nodes[nodes.length - 1])?.find(w => w.id === id)
      if (!edge || nodes.includes(edge.to)) break
      edges.push(edge); nodes.push(edge.to)
    }
    if (nodes.at(-1) !== to || edges.length !== path.wayIds.length) {
      report('DIRECTED_CHAIN', 'Vérifier chaque identifiant, extrémité et sens de parcours : la chaîne admise doit relier exactement les deux quais, sans saut ni boucle.')
    }
    if (path.gates) {
      const [exit, entrance] = path.gates
      if (!Array.isArray(path.gates) || path.gates.length !== 2 || net.places.get(exit)?.kind !== 'entrance' || net.places.get(entrance)?.kind !== 'entrance' ||
          nodes.indexOf(exit) < 1 || nodes.indexOf(entrance) <= nodes.indexOf(exit)) {
        report('PUBLIC_GATES', 'La sortie puis l’entrée voyageurs doivent être des accès revus traversés dans cet ordre par le chemin annoncé.')
      }
    }
  }
  if ((candidate.betweenSites && path?.scope !== 'via-street') || ((candidate.betweenSites || path?.scope === 'via-street') && !path?.gates)) report('PUBLIC_GATES', 'Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.')
  if (findings.length) return { status: 'blocked', findings, meters: null, walkStepFree: null }
  return { status: 'qualified-for-review', findings, meters: edges.reduce((n, e) => n + e.meters, 0),
    walkStepFree: edges.some(e => e.stepFree === 'no') ? 'no' : edges.every(e => e.stepFree === 'yes') ? 'yes' : 'unknown' }
}
