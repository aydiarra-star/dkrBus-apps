import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ClipboardList, ShieldCheck } from 'lucide-react'
import { getCurrentBusRouteAudit } from './currentBusRouteAudit'
import { AFTU_PUBLISHED_ROUTE_CANDIDATES } from '../data/aftuPublishedRouteCandidates'
import { TATA_PUBLISHED_ROUTE_CANDIDATES } from '../data/tataPublishedRouteCandidates'
import { AFTU_OFFICIAL_PAGE_AUDIT } from '../data/aftuOfficialPageAudit'
import type { CetudFrequencyObservation } from '../data/cetudFrequencyObservations'
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
  const [frequencyObservations, setFrequencyObservations] = useState<readonly CetudFrequencyObservation[]>([])
  const [dddBanlieueArcgisLayers, setDddBanlieueArcgisLayers] = useState<readonly { line: string; layerUrl: string; dataLastEditDate: string | null }[]>([])
  const [dddUrbanArcgisStopLayers, setDddUrbanArcgisStopLayers] = useState<readonly { line: string; layerId: number; layerUrl: string; featureCount: number; namedFeatureCount: number; geolocatedFeatureCount: number }[]>([])
  const [dddUrbanArcgisTotals, setDddUrbanArcgisTotals] = useState({ routeFeatures: 0, routeLayers: 0, stopFeatures: 0, stopLayers: 0, namedStopFeatures: 0, geolocatedStopFeatures: 0 })

  useEffect(() => {
    let active = true
    void Promise.all([
      import('../data/cetudFrequencyObservations'),
      import('../data/dddBanlieueArcgisRegistry'),
    ]).then(([frequencyData, gisData]) => {
      if (!active) return
      setFrequencyObservations(frequencyData.CETUD_FREQUENCY_OBSERVATIONS)
      setDddBanlieueArcgisLayers(gisData.DDD_BANLIEUE_ARCGIS_LAYERS)
      setDddUrbanArcgisStopLayers(gisData.DDD_URBAN_ARCGIS_STOP_LAYERS)
      setDddUrbanArcgisTotals(gisData.DDD_URBAN_ARCGIS_AUDIT_TOTALS)
    })
    return () => { active = false }
  }, [])
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
        <span>L’IA recherche et recoupe les sources pour qualifier les lignes. Aucune correction des arrêts ni publication dans le catalogue voyageurs n’est automatique.</span>
      </div>

      <details className="bus-route-audit-sources">
        <summary>Fréquences observées par site · CETUD · {frequencyObservations.length || 'chargement…'} relevés</summary>
        <p>Rapport CETUD/CUREM (EFOV 2016, publié en juillet 2020), tableaux 48, 49, 52 et 53. Ces valeurs décrivent l’intervalle moyen observé à un site et dans un sens donné ; elles ne sont pas des fréquences propres à chaque numéro de ligne et ne doivent pas être recopiées telles quelles sur toutes les lignes qui passent à proximité.</p>
        <ul>
          {frequencyObservations.map((observation, index) => (
            <li key={`${observation.network}-${observation.period}-${observation.table}-${index}`}>
              <strong>{observation.network} · {observation.period === 'weekday' ? 'Lundi–vendredi' : 'Samedi'}</strong>
              <span>{observation.site}</span>
              <span>Vers ville : {observation.towardCityMinutes === null ? 'non desservi / non relevé' : `${observation.towardCityMinutes} min`} · Vers banlieue : {observation.towardSuburbsMinutes === null ? 'non desservi / non relevé' : `${observation.towardSuburbsMinutes} min`}</span>
              <a href={observation.sourceUrl} target="_blank" rel="noreferrer">Rapport CETUD · tableau {observation.table}</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Couches SIG DDD de banlieue · {dddBanlieueArcgisLayers.length} références historiques</summary>
        <p>Géométries de lignes ArcGIS en lecture seule. Elles servent à comparer les corridors ; elles ne contiennent pas de séquences d’arrêts validées ni d’horaires.</p>
        <ul>
          {dddBanlieueArcgisLayers.map((layer) => (
            <li key={layer.line}>
              <strong>Ligne DDD {layer.line}</strong>
              <span>{layer.dataLastEditDate ? `Géométrie modifiée le ${layer.dataLastEditDate}` : 'Date de modification non relevée'} · historique</span>
              <a href={layer.layerUrl} target="_blank" rel="noreferrer">Ouvrir la couche SIG</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Arrêts SIG DDD urbains · {dddUrbanArcgisTotals.stopFeatures} points · {dddUrbanArcgisTotals.geolocatedStopFeatures} géolocalisés</summary>
        <p>Extraction en lecture seule des couches publiques DDD : {dddUrbanArcgisTotals.routeFeatures} tracés sur {dddUrbanArcgisTotals.routeLayers} couches et {dddUrbanArcgisTotals.stopFeatures} points d’arrêt sur {dddUrbanArcgisTotals.stopLayers} couches. {dddUrbanArcgisTotals.namedStopFeatures} points ont un nom et {dddUrbanArcgisTotals.geolocatedStopFeatures} ont des coordonnées. Ces données historiques servent à rapprocher les arrêts et les tracés ; elles ne prouvent pas les horaires actuels.</p>
        <ul>
          {dddUrbanArcgisStopLayers.map((layer) => (
            <li key={`${layer.line}-${layer.layerId}`}>
              <strong>DDD {layer.line} · {layer.featureCount} arrêts candidats</strong>
              <span>{layer.namedFeatureCount} nommés · {layer.geolocatedFeatureCount} géolocalisés</span>
              <a href={layer.layerUrl} target="_blank" rel="noreferrer">Ouvrir la couche d’arrêts SIG</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches officielles AFTU parcourues · {AFTU_OFFICIAL_PAGE_AUDIT.linkedPages} pages · {AFTU_OFFICIAL_PAGE_AUDIT.itineraryTextsRetrieved} itinéraires</summary>
        <p>La collecte a ouvert les 63 fiches reliées depuis la page officielle AFTU. Le texte d’itinéraire a été récupéré sur 62 pages ; la fiche 30 est conservée dans le registre existant et son texte sera recoupé séparément.</p>
        <a href={AFTU_OFFICIAL_PAGE_AUDIT.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la liste officielle des lignes AFTU</a>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches AFTU récupérées · {AFTU_PUBLISHED_ROUTE_CANDIDATES.length} lignes</summary>
        <p>Descriptions publiées sur le site AFTU. Elles ne représentent pas encore deux séquences vérifiées Aller et Retour et restent hors du catalogue voyageurs.</p>
        <ul>
          {AFTU_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => (
            <li key={candidate.line}>
              <strong>Ligne {candidate.line}</strong>
              <span>Publié le {candidate.publishedOn} · à valider humainement</span>
              {candidate.returnVariants?.map((variant, index) => (
                <span key={index}>Retour : {variant.inboundSegment} à la place de {variant.outboundSegment}</span>
              ))}
              <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la fiche AFTU</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches TATA candidates · {TATA_PUBLISHED_ROUTE_CANDIDATES.length} lignes · source secondaire</summary>
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
