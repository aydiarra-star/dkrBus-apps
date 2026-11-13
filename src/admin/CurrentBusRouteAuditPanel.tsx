import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ClipboardList, ShieldCheck } from 'lucide-react'
import { getCurrentBusRouteAudit } from './currentBusRouteAudit'
import { AFTU_PUBLISHED_ROUTE_CANDIDATES } from '../data/aftuPublishedRouteCandidates'
import { TATA_PUBLISHED_ROUTE_CANDIDATES } from '../data/tataPublishedRouteCandidates'
import type { DirectionAuditFinding } from './bidirectionalRouteAudit'
import './CurrentBusRouteAuditPanel.css'

type Filter = 'all' | 'missing' | 'unverified' | 'invalid'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Toutes les anomalies',
  missing: 'Arrêts manquants',
  unverified: 'Sens non vérifiés',
  invalid: 'Séquences invalides',
}

function findingLabel(finding: DirectionAuditFinding): string {
  if (finding.kind === 'MISSING_DIRECTION_STOPS') return 'Séquence d’arrêts absente ou incomplète'
  if (finding.kind === 'DIRECTION_NOT_VERIFIED') return 'Sens non vérifié par une source validée'
  return 'Séquence à contrôler'
}

/** Tableau de bord de diagnostic strictement en lecture seule. */
export function CurrentBusRouteAuditPanel() {
  const report = useMemo(() => getCurrentBusRouteAudit(), [])
  const [filter, setFilter] = useState<Filter>('all')
  const visibleFindings = report.findings.filter((finding) => {
    if (filter === 'all') return true
    if (filter === 'missing') return finding.kind === 'MISSING_DIRECTION_STOPS'
    if (filter === 'unverified') return finding.kind === 'DIRECTION_NOT_VERIFIED'
    return finding.kind === 'INVALID_DIRECTION_SEQUENCE'
  })

  return (
    <section className="bus-route-audit" aria-label="Audit des lignes DDD AFTU TATA">
      <div className="bus-route-audit-heading">
        <div>
          <span className="eyebrow">CONTRÔLE DES PARCOURS</span>
          <h3>Audit DDD · AFTU · TATA</h3>
          <p>Lecture seule du catalogue actuel. Aucun arrêt, sens ou itinéraire n’est modifié.</p>
        </div>
        <span className="bus-route-audit-icon"><ClipboardList size={18} /></span>
      </div>

      <div className="bus-route-audit-summary">
        <div><strong>{report.analyzedLines}</strong><span>Lignes examinées</span></div>
        <div><strong>{report.analyzedDirections}</strong><span>Sens examinés</span></div>
        <div><strong>{report.completeLines}</strong><span>Lignes complètes et vérifiées</span></div>
      </div>

      <div className="bus-route-audit-safety" role="note">
        <ShieldCheck size={15} />
        <span>Les constats sont des demandes de vérification humaine. L’IA ne valide et ne publie rien automatiquement.</span>
      </div>

      <details className="bus-route-audit-sources">
        <summary>Fiches AFTU récupérées · {AFTU_PUBLISHED_ROUTE_CANDIDATES.length} lignes</summary>
        <p>Descriptions publiées sur le site AFTU. Elles ne représentent pas encore deux séquences vérifiées Aller et Retour et restent hors du catalogue voyageurs.</p>
        <ul>
          {AFTU_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => (
            <li key={candidate.line}>
              <strong>Ligne {candidate.line}</strong>
              <span>Publié le {candidate.publishedOn} · à valider humainement</span>
              <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la fiche AFTU</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches TATA candidates · ${TATA_PUBLISHED_ROUTE_CANDIDATES.length} lignes · source secondaire</summary>
        <p>Ces fiches proviennent d’un répertoire secondaire. Elles sont distinctes des fiches AFTU, même si un numéro ou un corridor se ressemble. Les variantes de retour citées ne constituent pas une séquence complète validée.</p>
        <ul>
          {TATA_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => (
            <li key={candidate.line}>
              <strong>Ligne TATA {candidate.line}</strong>
              <span>Source secondaire · à valider humainement</span>
              <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la fiche TATA</a>
            </li>
          ))}
        </ul>
      </details>

      <div className="bus-route-audit-filters" aria-label="Filtrer les anomalies">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'is-active' : ''}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="bus-route-audit-count" aria-live="polite">
        <AlertTriangle size={14} />
        {visibleFindings.length} constat(s) dans cette vue
      </div>

      {visibleFindings.length === 0 ? (
        <p className="bus-route-audit-empty">Aucun constat dans cette catégorie.</p>
      ) : (
        <ul className="bus-route-audit-list">
          {visibleFindings.map((finding) => (
            <li key={finding.id}>
              <div className="bus-route-audit-line">
                <strong>{finding.network.toUpperCase()} {finding.line}</strong>
                <span>{finding.direction === 'outbound' ? <><ArrowUp size={12} /> Aller</> : <><ArrowDown size={12} /> Retour</>}</span>
              </div>
              <p>{finding.origin} → {finding.destination}</p>
              <span className="bus-route-audit-issue">{findingLabel(finding)}</span>
              <small>{finding.stopCount} arrêt(s) enregistrés · statut : {finding.directionStatus}</small>
              {finding.sourceUrl && (
                <a href={finding.sourceUrl} target="_blank" rel="noreferrer">Consulter la référence enregistrée</a>
              )}
              <em>À examiner par un humain</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
