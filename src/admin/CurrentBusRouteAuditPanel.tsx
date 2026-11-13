import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ClipboardList, ShieldCheck } from 'lucide-react'
import { getCurrentBusRouteAudit } from './currentBusRouteAudit'
import { AFTU_OFFICIAL_PAGE_AUDIT } from '../data/aftuOfficialPageAudit'
import type { CetudFrequencyObservation } from '../data/cetudFrequencyObservations'
import type { AftuPublishedRouteCandidate } from '../data/aftuPublishedRouteCandidates'
import type { TataPublishedRouteCandidate } from '../data/tataPublishedRouteCandidates'
import type { DddPublishedDepartureWindow } from '../data/dddPublishedDepartureWindows'
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
  const [aftuCandidates, setAftuCandidates] = useState<readonly AftuPublishedRouteCandidate[]>([])
  const [tataCandidates, setTataCandidates] = useState<readonly TataPublishedRouteCandidate[]>([])
  const [dddPublishedDepartureWindows, setDddPublishedDepartureWindows] = useState<readonly DddPublishedDepartureWindow[]>([])
  const [dddOfficialRoutes, setDddOfficialRoutes] = useState<readonly { line: string; stops: readonly string[]; codeSource?: string; conflictNote?: string }[]>([])
  const [dddOfficialRouteSource, setDddOfficialRouteSource] = useState({ url: 'https://demdikk.sn/reseau-urbain-dakar/', infoUrl: 'https://demdikk.sn/info-voyageurs/' })
  const [dddBanlieueArcgisLayers, setDddBanlieueArcgisLayers] = useState<readonly { line: string; layerUrl: string; dataLastEditDate: string | null }[]>([])
  const [dddUrbanArcgisStopLayers, setDddUrbanArcgisStopLayers] = useState<readonly { line: string; layerId: number; layerUrl: string; featureCount: number; namedFeatureCount: number; geolocatedFeatureCount: number }[]>([])
  const [dddUrbanArcgisTotals, setDddUrbanArcgisTotals] = useState({ routeFeatures: 0, routeLayers: 0, stopFeatures: 0, stopLayers: 0, namedStopFeatures: 0, geolocatedStopFeatures: 0 })

  useEffect(() => {
    let active = true
    void Promise.all([
      import('../data/cetudFrequencyObservations'),
      import('../data/dddBanlieueArcgisRegistry'),
      import('../data/aftuPublishedRouteCandidates'),
      import('../data/tataPublishedRouteCandidates'),
      import('../data/dddPublishedDepartureWindows'),
      import('../data/dddOfficialPublishedRoutes'),
    ]).then(([frequencyData, gisData, aftuData, tataData, departureData, officialRouteData]) => {
      if (!active) return
      setFrequencyObservations(frequencyData.CETUD_FREQUENCY_OBSERVATIONS)
      setDddBanlieueArcgisLayers(gisData.DDD_BANLIEUE_ARCGIS_LAYERS)
      setDddUrbanArcgisStopLayers(gisData.DDD_URBAN_ARCGIS_STOP_LAYERS)
      setDddUrbanArcgisTotals(gisData.DDD_URBAN_ARCGIS_AUDIT_TOTALS)
      setAftuCandidates(aftuData.AFTU_PUBLISHED_ROUTE_CANDIDATES)
      setTataCandidates(tataData.TATA_PUBLISHED_ROUTE_CANDIDATES)
      setDddPublishedDepartureWindows(departureData.DDD_PUBLISHED_DEPARTURE_WINDOWS)
      setDddOfficialRoutes(officialRouteData.DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES)
      setDddOfficialRouteSource({ url: officialRouteData.DDD_OFFICIAL_ROUTE_SOURCE.url, infoUrl: officialRouteData.DDD_OFFICIAL_ROUTE_SOURCE.infoUrl })
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
        <summary>Parcours DDD publiés par l’opérateur · {dddOfficialRoutes.length || 'chargement…'} séquences</summary>
        <p>Ordre transcrit depuis le site officiel DDD. Chaque fiche présente le sens dans l’ordre publié ; les retours ne sont pas inversés automatiquement. Les arrêts ne sont pas encore associés aux identifiants et coordonnées SIG. Aucune fréquence ou minute de passage n’est déduite.</p>
        <ul>
          {dddOfficialRoutes.map((route) => (
            <li key={route.line}>
              <details>
                <summary>DDD {route.line} · {route.stops.length} repères publiés</summary>
                <ol>
                  {route.stops.map((stop, index) => <li key={`${route.line}-${index}`}>{stop}</li>)}
                </ol>
                {route.codeSource === 'cross_reference_to_official_info_page' && <small>Numéro 228 recoupé avec la page officielle Info voyageurs.</small>}
                {route.conflictNote && <small role="note">Conflit de source : {route.conflictNote}</small>}
              </details>
            </li>
          ))}
        </ul>
        <a href={dddOfficialRouteSource.url} target="_blank" rel="noreferrer">Ouvrir les parcours DDD</a>
        <a href={dddOfficialRouteSource.infoUrl} target="_blank" rel="noreferrer">Ouvrir Info voyageurs DDD</a>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches officielles AFTU parcourues · {AFTU_OFFICIAL_PAGE_AUDIT.linkedPages + AFTU_OFFICIAL_PAGE_AUDIT.additionalOfficialPages} pages · {AFTU_OFFICIAL_PAGE_AUDIT.itineraryTextsRetrieved} itinéraires</summary>
        <p>La collecte a récupéré les 63 fiches liées depuis « Infos pratiques » et deux fiches officielles supplémentaires trouvées par URL directe (lignes 27 et 36). Les 65 textes d’itinéraire sont disponibles ; aucun n’est transformé automatiquement en séquence complète Aller/Retour.</p>
        <a href={AFTU_OFFICIAL_PAGE_AUDIT.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la liste officielle des lignes AFTU</a>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Parcours détaillés AFTU raccordés · {report.aftuEvidence.length} lignes</summary>
        <p>Les séquences sont lues séparément pour chaque sens depuis les fichiers de parcours. Les libellés restent des preuves textuelles : ils ne deviennent pas des identifiants d’arrêts, et aucune séquence absente n’est reconstituée. Les fréquences et horaires par arrêt sont affichés séparément.</p>
        <ul>
          {report.aftuEvidence.map((route) => (
            <li key={route.line}>
              <details>
                <summary>AFTU {route.line} · Aller {route.outbound.waypoints.length} repères · Retour {route.inbound.waypoints.length} repères</summary>
                {(['outbound', 'inbound'] as const).map((direction) => {
                  const evidence = route[direction]
                  return (
                    <div key={direction}>
                      <strong>{direction === 'outbound' ? 'Aller' : 'Retour'}</strong>
                      <span>{evidence.waypoints.length} repères · {evidence.timetableEntries} horaires par arrêt{evidence.hasPerStopTimes ? ' (correspondance complète)' : ''}</span>
                      {evidence.scheduleInterval && <span>Intervalle publié : {evidence.scheduleInterval}</span>}
                      {evidence.genericStopLabels > 0 && <span>{evidence.genericStopLabels} repères génériques « Arrêt de bus »</span>}
                      {evidence.repeatedLabels.length > 0 && <span>{evidence.repeatedLabels.length} libellé(s) répété(s), conservés dans l’ordre</span>}
                      {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Source de ce sens</a>}
                      {evidence.waypoints.length > 0 && <ol>{evidence.waypoints.map((waypoint, index) => <li key={index}>{waypoint}</li>)}</ol>}
                      {evidence.waypoints.length === 0 && <em>Séquence de ce sens absente de la fiche récupérée.</em>}
                    </div>
                  )
                })}
              </details>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Départs officiels DDD · {dddPublishedDepartureWindows.length || 'chargement…'} directions documentées</summary>
        <p>Premiers et derniers départs publiés par terminus. Ces plages ne donnent pas d’intervalle entre bus : elles ne produisent aucun compte à rebours de fréquence.</p>
        <ul>
          {dddPublishedDepartureWindows.map((departure) => (
            <li key={`${departure.service}-${departure.origin}-${departure.destination}`}>
              <strong>{departure.service} · {departure.origin} → {departure.destination}</strong>
              <span>Premier départ : {departure.firstDeparture} · Dernier départ : {departure.lastDeparture}</span>
              <a href={departure.sourceUrl} target="_blank" rel="noreferrer">Source officielle DDD</a>
            </li>
          ))}
        </ul>
      </details>

      <details className="bus-route-audit-sources">
        <summary>Fiches AFTU récupérées · {aftuCandidates.length || 'chargement…'} lignes</summary>
        <p>Descriptions publiées sur le site AFTU. Elles ne représentent pas encore deux séquences vérifiées Aller et Retour et restent hors du catalogue voyageurs.</p>
        <ul>
          {aftuCandidates.map((candidate) => (
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
        <summary>Fiches TATA candidates · {tataCandidates.length || 'chargement…'} lignes · source secondaire</summary>
        <p>Ces fiches proviennent d’un répertoire secondaire. Elles sont distinctes des fiches AFTU, même si un numéro ou un corridor se ressemble. Les variantes de retour citées ne constituent pas une séquence complète validée.</p>
        <ul>
          {tataCandidates.map((candidate) => (
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
