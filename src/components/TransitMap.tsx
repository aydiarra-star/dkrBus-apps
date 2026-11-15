import { memo, useEffect, useMemo } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L, { type DivIcon } from 'leaflet'
import type { PublishedStop, SnapshotBounds } from '../domain/published'
import { TER_STOPS, type CorridorLine, type CorridorStop } from '../domain/corridors'
import { formatFrequencyPeriod, formatSourceVerification } from '../domain/frequencies'
import { safeHttpUrl } from '../domain/http'
import { mobilityFromStopId, mobilityPaint, type MobilityPaint } from '../domain/mobilityColors'
import { TER_TRACK_ATTRIBUTION, TER_TRACK_LINE_ID, trackPositionsForLine } from '../domain/terTrackGeometry'
import { BRT_TRACK_ATTRIBUTION, brtTrackPositionsForLine } from '../domain/brtTrackGeometry'
import { keyboardIsOpen, shouldResizeMap, summonsKeyboard } from '../domain/viewportLock'
import { focusTargetOf } from './useViewportLock'

export interface Coordinates {
  lat: number
  lng: number
}

export interface UserLocation extends Coordinates {
  accuracy: number
}

export type RoutePointKey = 'origin' | 'destination'

/** A stop marker needs a declared position; stops without coordinates have none. */
export interface MappableStop extends Coordinates {
  stopId: string
  stopName: string
}

export interface RegionBounds {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

interface TransitMapProps {
  location: UserLocation | null
  routePoints: Partial<Record<RoutePointKey, Coordinates>>
  pickingPoint: RoutePointKey | null
  recenterTo: Coordinates | null
  zoomAction: { delta: number; nonce: number } | null
  onChoosePoint: (coordinates: Coordinates) => void
  publishedStops?: readonly PublishedStop[]
  selectedStopId?: string | null
  coverage?: SnapshotBounds | null
  showCoverage?: boolean
  onSelectStop?: (stop: PublishedStop) => void
  /** Enveloppe à cadrer au chargement (Almadies → Rufisque/Bargny + terminus). */
  initialBounds?: RegionBounds | null
  /** Lignes de référence à tracer (TER/BRT), déjà filtrées par couche. */
  corridorLines?: readonly CorridorLine[]
  /** Arrêts de référence à afficher, déjà filtrés par couche. */
  corridorStops?: readonly CorridorStop[]
  onSelectCorridorStop?: (stop: CorridorStop) => void
}

const DAKAR_CENTER: [number, number] = [14.7167, -17.4677]

export type MappablePublishedStop = PublishedStop & { lat: number; lon: number }

/** Stops are only mapped where the feed declares coordinates. */
export function mappableStops(stops: readonly PublishedStop[]): MappablePublishedStop[] {
  return stops.filter((stop): stop is MappablePublishedStop => stop.lat !== null && stop.lon !== null)
}

/** Distance minimale d'un arrêt à un segment géographique, en mètres. */
function distanceToSegmentMeters(
  point: { lat: number; lon: number },
  start: [number, number],
  end: [number, number],
): number {
  const radians = Math.PI / 180
  const cosLat = Math.cos(point.lat * radians)
  const project = (lat: number, lon: number): [number, number] => [
    (lon - point.lon) * radians * 6_371_000 * cosLat,
    (lat - point.lat) * radians * 6_371_000,
  ]
  const [ax, ay] = project(start[0], start[1])
  const [bx, by] = project(end[0], end[1])
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

function MapClickHandler({
  pickingPoint,
  onChoosePoint,
}: Pick<TransitMapProps, 'pickingPoint' | 'onChoosePoint'>) {
  useMapEvents({
    click(event) {
      if (pickingPoint) {
        onChoosePoint({ lat: event.latlng.lat, lng: event.latlng.lng })
      }
    },
  })
  return null
}

function MapController({ recenterTo, zoomAction }: Pick<TransitMapProps, 'recenterTo' | 'zoomAction'>) {
  const map = useMap()

  useEffect(() => {
    // Retirer uniquement le préfixe de marque Leaflet ; conserver le crédit OSM requis.
    map.attributionControl.setPrefix(false)
  }, [map])

  useEffect(() => {
    if (!recenterTo) return
    map.flyTo([recenterTo.lat, recenterTo.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [map, recenterTo])

  useEffect(() => {
    if (!zoomAction) return
    map.setZoom(map.getZoom() + zoomAction.delta, { animate: true })
  }, [map, zoomAction])

  return null
}

/** Cadrage initial : englobe toute la région utile au chargement de la carte. */
function MapInitialFit({ bounds }: { bounds: RegionBounds | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(
      [
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ],
      { padding: [16, 16], animate: false },
    )
    // Appliqué une seule fois au montage : le centrage manuel prime ensuite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

/**
 * Recalcul maîtrisé de la carte.
 *
 * La carte naît avec `trackResize: false` : Leaflet n'écoute plus `resize`, qui
 * déclenchait un `invalidateSize` dès que le clavier mobile réduisait la
 * fenêtre — d'où le reflow violent au toucher du champ de recherche. C'est ce
 * contrôleur qui décide, et il refuse tout recalcul pendant que le clavier est
 * ouvert : la carte garde sa taille et ses tuiles, elle est simplement
 * recouverte. À la fermeture du clavier, la taille étant revenue à l'identique,
 * aucun recalcul n'est nécessaire.
 */
function MapResizeController() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const sizeOf = () => ({ width: container.clientWidth, height: container.clientHeight })
    let previous = sizeOf()
    let editing = false
    let lockedHeight = window.innerHeight

    const keyboardState = () => {
      const visual = window.visualViewport
      const open = keyboardIsOpen({
        layoutHeight: window.innerHeight,
        visualHeight: visual ? visual.height : null,
        editing,
        lockedHeight,
      })
      if (!open) lockedHeight = window.innerHeight
      return open
    }

    const sync = () => {
      const next = sizeOf()
      if (shouldResizeMap({ previous, next, keyboardOpen: keyboardState() })) {
        previous = next
        map.invalidateSize({ animate: false })
      }
    }
    const handleFocusIn = (event: FocusEvent) => {
      editing = summonsKeyboard(focusTargetOf(event.target))
    }
    const handleFocusOut = () => {
      editing = false
      sync()
    }

    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    const visual = window.visualViewport
    visual?.addEventListener('resize', sync)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync)
    observer?.observe(container)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      visual?.removeEventListener('resize', sync)
      observer?.disconnect()
    }
  }, [map])

  return null
}

/** Échappe une valeur avant de l’insérer dans le HTML d’une icône Leaflet. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function makeMarker(className: string, label: string, color: string): DivIcon {
  return L.divIcon({
    className: 'dakar-marker-shell',
    html: `<span class="${escapeHtml(className)}" style="--marker-color:${escapeHtml(color)}" role="img" aria-label="${escapeHtml(label)}"><span></span></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function paintFor(network: string | undefined, stopId?: string): MobilityPaint | null {
  return mobilityPaint(network) ?? mobilityPaint(mobilityFromStopId(stopId ?? ''))
}

function TransitMapView({
  location,
  routePoints,
  pickingPoint,
  recenterTo,
  zoomAction,
  onChoosePoint,
  publishedStops = [],
  selectedStopId = null,
  coverage = null,
  showCoverage = true,
  onSelectStop,
  initialBounds = null,
  corridorLines = [],
  corridorStops = [],
  onSelectCorridorStop,
}: TransitMapProps) {
  const userIcon = useMemo(() => makeMarker('map-user-marker', 'Votre position', '#198754'), [])
  const originIcon = useMemo(() => makeMarker('map-route-marker map-route-marker-origin', 'Départ sélectionné', '#146b43'), [])
  const destinationIcon = useMemo(() => makeMarker('map-route-marker map-route-marker-destination', 'Destination sélectionnée', '#d78a32'), [])
  const stops = useMemo(() => mappableStops(publishedStops), [publishedStops])
  const uniqueCorridorStops = useMemo(() => {
    const unique = corridorStops.filter((stop, index, all) => {
      const prefix = stop.id.split('-')[0]
      if (prefix !== 'aftu' && prefix !== 'tata') return true
      const normalized = stop.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
      const firstEquivalent = all.findIndex((candidate) => {
        const candidatePrefix = candidate.id.split('-')[0]
        if (candidatePrefix !== 'aftu' && candidatePrefix !== 'tata') return false
        const candidateName = candidate.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
        const meters = Math.hypot((candidate.lat - stop.lat) * 111_000, (candidate.lon - stop.lon) * 111_000 * Math.cos(stop.lat * Math.PI / 180))
        return candidateName === normalized && meters <= 150
      })
      return firstEquivalent === index
    })

    // Draw TER markers last: shared stations must not be hidden by later
    // DDD/BRT/AFTU/TATA markers at the same geographic position.
    return [
      ...unique.filter((stop) => !stop.id.startsWith('ter-')),
      ...unique.filter((stop) => stop.id.startsWith('ter-')),
    ]
  }, [corridorStops])
  const corridorLineStops = useMemo(
    () =>
      corridorLines.map((line) => {
        const terTrack = trackPositionsForLine(line.id) as [number, number][] | undefined
        const brtTracks = brtTrackPositionsForLine(line.id) as readonly (readonly [number, number][])[] | undefined
        return {
          line,
          // Le TER et le BRT suivent les géométries OSM de leurs voies.
          // Les autres lignes conservent leurs tracés de référence actuels.
          positions:
            terTrack ??
            (brtTracks?.[0] as [number, number][] | undefined) ??
            line.stopIds
              .map((stopId) => corridorStops.find((stop) => stop.id === stopId))
              .filter((stop): stop is CorridorStop => stop !== undefined)
              .map((stop) => [stop.lat, stop.lon] as [number, number]),
          additionalPositions: brtTracks?.slice(1) as [number, number][][] | undefined,
        }
      }),
    [corridorLines, corridorStops],
  )

  // Masquer uniquement les arrêts d'autres réseaux posés sur les voies TER.
  // Les arrêts TER, leurs coordonnées et la géométrie ferroviaire restent intacts.
  const corridorStopsToRender = useMemo(() => {
    const terTracks = corridorLineStops
      .filter(({ line }) => line.network === 'ter')
      .map(({ positions }) => positions)
      .filter((positions) => positions.length > 1)
    if (terTracks.length === 0) return uniqueCorridorStops
    return uniqueCorridorStops.filter((stop) => {
      if (stop.id.startsWith('ter-')) return true
      // Une correspondance à moins de 30 m d'une gare TER reste représentée
      // au pôle ; seules les pastilles posées sur le parcours entre les gares
      // sont masquées.
      const atTerStation = TER_STOPS.some((station) =>
        distanceToSegmentMeters(stop, [station.lat, station.lon], [station.lat, station.lon]) <= 30,
      )
      if (atTerStation) return true
      return !terTracks.some((positions) =>
        positions.slice(1).some((end, index) =>
          distanceToSegmentMeters(stop, positions[index], end) <= 35,
        ),
      )
    })
  }, [corridorLineStops, uniqueCorridorStops])

  return (
    <MapContainer
      center={DAKAR_CENTER}
      zoom={13}
      minZoom={10}
      maxZoom={19}
      zoomControl={false}
      scrollWheelZoom
      preferCanvas
      /* Leaflet n'écoute plus `resize` : le clavier mobile ne redimensionne
         plus la carte. MapResizeController décide du recalcul. */
      trackResize={false}
      className={`leaflet-map${pickingPoint ? ' leaflet-map-picking' : ''}`}
      aria-label="Carte interactive de Dakar"
    >
      <TileLayer
        attribution='<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapClickHandler pickingPoint={pickingPoint} onChoosePoint={onChoosePoint} />
      <MapController recenterTo={recenterTo} zoomAction={zoomAction} />
      <MapInitialFit bounds={initialBounds} />
      <MapResizeController />

      {/* Réseau de référence :
          - TER #003366 bleu et BRT #00A859 vert émeraude : tracés continus complets (halo + casing + core)
          - DDD #F59E0B jaune/or et AFTU/TATA #D97706 orange ambré : pastilles arrêts + pointillés très légers (pas de gros tracés)
      */}
      {/* Halo + casing pour TER/BRT uniquement */}
      {corridorLineStops
        .filter(({ line }) => line.network === 'ter' || line.network === 'brt')
        .flatMap(({ line, positions, additionalPositions }) => {
          const paint = paintFor(line.network)
          if (!paint) return []
          return [positions, ...(additionalPositions ?? [])].map((track, directionIndex) => (
            <Polyline
              key={`corridor-halo-${line.id}-${directionIndex}`}
              positions={track}
              interactive={false}
              pathOptions={{ color: '#ffffff', weight: 6, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }}
            />
          ))
        })}
      {corridorLineStops
        .filter(({ line }) => line.network === 'ter' || line.network === 'brt')
        .flatMap(({ line, positions, additionalPositions }) => {
          const paint = paintFor(line.network)
          if (!paint) return []
          return [positions, ...(additionalPositions ?? [])].map((track, directionIndex) => (
            <Polyline
              key={`corridor-casing-${line.id}-${directionIndex}`}
              positions={track}
              interactive={false}
              pathOptions={{ color: paint.casing, weight: 4.5, opacity: 0.98, lineCap: 'round', lineJoin: 'round' }}
            />
          ))
        })}
      {/* Tracés continus TER/BRT */}
      {corridorLineStops
        .filter(({ line }) => line.network === 'ter' || line.network === 'brt')
        .flatMap(({ line, positions, additionalPositions }) => {
          const paint = paintFor(line.network)
          return [positions, ...(additionalPositions ?? [])].map((track, directionIndex) => (
            <Polyline
              key={`corridor-${line.id}-${directionIndex}`}
              positions={track}
              attribution={line.id === TER_TRACK_LINE_ID ? TER_TRACK_ATTRIBUTION : line.id === 'brt-b1' ? BRT_TRACK_ATTRIBUTION : undefined}
              pathOptions={{ color: paint?.core ?? line.color, weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
            >
              <Tooltip direction="center" sticky opacity={0.95} className={`stop-tooltip mobility-tooltip${paint ? ` mobility-${paint.id}` : ''}`}>
                <div className="map-frequency-tooltip">
                  <strong>
                    {paint && <span className={`mobility-badge mobility-${paint.id}`}>{line.shortName}</span>}
                    {' '}{line.longName}
                  </strong>
                  {line.officialFrequencies.map((frequency, index) => (
                    <span key={`${frequency.serviceStart}-${frequency.serviceEnd}-${index}`}>{formatFrequencyPeriod(frequency)}</span>
                  ))}
                  <small>
                    {line.frequencyStatus === 'OFFICIAL_REFERENCE' ? 'Fréquence officielle de référence' : 'Fréquence inconnue'}
                    {' · '}{formatSourceVerification(line.frequencySource)}
                  </small>
                  {safeHttpUrl(line.frequencySource.sourceUrl) && (
                    <a className="map-frequency-source" href={safeHttpUrl(line.frequencySource.sourceUrl) ?? undefined} target="_blank" rel="noreferrer">
                      Source : {line.frequencySource.authority}
                    </a>
                  )}
                  <span className="map-frequency-disclaimer">Fréquence de service uniquement · pas un prochain passage.</span>
                </div>
              </Tooltip>
            </Polyline>
          )
        })}
      {/* Pointillés très légers DDD/AFTU/TATA */}
      {corridorLineStops
        .filter(({ line }) => line.network === 'ddd' || line.network === 'aftu_tata')
        .map(({ line, positions }) => {
          const paint = paintFor(line.network)
          const isDDD = line.network === 'ddd'
          return (
            <Polyline
              key={`corridor-dotted-${line.id}`}
              positions={positions}
              pathOptions={{
                color: paint?.core ?? line.color,
                weight: 2.2,
                opacity: 0.55,
                dashArray: isDDD ? '2 12' : '3 12',
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Tooltip direction="center" sticky opacity={0.9} className={`stop-tooltip mobility-tooltip${paint ? ` mobility-${paint.id}` : ''}`}>
                <div className="map-frequency-tooltip">
                  <strong>
                    {paint && <span className={`mobility-badge mobility-${paint.id}`}>{line.shortName}</span>}
                    {' '}{line.longName}
                  </strong>
                  <small>Bus {paint?.label ?? line.network.toUpperCase()} – tracé léger en pointillés + arrêts en pastilles</small>
                  <span className="map-frequency-disclaimer">Géométrie de référence simplifiée – pas un tracé métrique.</span>
                </div>
              </Tooltip>
            </Polyline>
          )
        })}
      {/* Anneau TER discret aux gares qui accueillent une correspondance. */}
      {TER_STOPS.filter((station) =>
        uniqueCorridorStops.some((candidate) =>
          !candidate.id.startsWith('ter-') &&
          distanceToSegmentMeters(candidate, [station.lat, station.lon], [station.lat, station.lon]) <= 30,
        ),
      ).map((station) => (
        <CircleMarker
          key={`ter-interchange-${station.id}`}
          center={[station.lat, station.lon]}
          radius={10}
          pathOptions={{ color: '#003366', weight: 3, fillColor: '#003366', fillOpacity: 0 }}
        />
      ))}
      {/* Pastilles arrêts : toutes mobilités, couleur stricte */}
      {corridorStopsToRender.map((stop) => {
        const line = corridorLines.find((candidate) => candidate.stopIds.includes(stop.id))
        const paint = paintFor(line?.network, stop.id)
        return (
          <CircleMarker
            key={`corridor-stop-${stop.id}`}
            center={[stop.lat, stop.lon]}
            radius={paint?.id === 'ddd' || paint?.id === 'aftu_tata' ? 5 : 7}
            pathOptions={{
              color: paint?.badge ?? line?.color ?? '#475569',
              weight: 2,
              fillColor: paint?.badge ?? line?.color ?? '#475569',
              fillOpacity: 1,
            }}
            eventHandlers={onSelectCorridorStop ? { click: () => onSelectCorridorStop(stop) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} className={`stop-tooltip mobility-tooltip${paint ? ` mobility-${paint.id}` : ''}`}>
              <div className="map-frequency-tooltip">
                <strong>
                  {paint && <span className={`mobility-badge mobility-${paint.id}`}>{paint.label}</span>}
                  {' '}{stop.name}{stop.note ? ` · ${stop.note}` : ''}
                </strong>
                {line?.officialFrequencies.map((frequency, index) => (
                  <span key={`${frequency.serviceStart}-${frequency.serviceEnd}-${index}`}>{formatFrequencyPeriod(frequency)}</span>
                ))}
                {line && (
                  <small>
                    {line.frequencyStatus === 'OFFICIAL_REFERENCE' ? 'Fréquence officielle de référence' : 'Fréquence inconnue'}
                    {' · '}{formatSourceVerification(line.frequencySource)}
                  </small>
                )}
                {line && safeHttpUrl(line.frequencySource.sourceUrl) && (
                  <a className="map-frequency-source" href={safeHttpUrl(line.frequencySource.sourceUrl) ?? undefined} target="_blank" rel="noreferrer">
                    Source : {line.frequencySource.authority}
                  </a>
                )}
                {line && <span className="map-frequency-disclaimer">Fréquence de service uniquement · pas un prochain passage.</span>}
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      {coverage && showCoverage && (
        <Rectangle
          bounds={[
            [coverage.minLat, coverage.minLon],
            [coverage.maxLat, coverage.maxLon],
          ]}
          pathOptions={{ color: '#198754', weight: 1, dashArray: '5 6', fillColor: '#198754', fillOpacity: 0.05 }}
        />
      )}

      {stops.map((stop) => (
        <CircleMarker
          key={stop.stopId}
          center={[stop.lat, stop.lon]}
          radius={stop.stopId === selectedStopId ? 9 : 6}
          pathOptions={
            stop.stopId === selectedStopId
              ? { color: '#ffffff', weight: 3, fillColor: '#146a42', fillOpacity: 1 }
              : { color: '#ffffff', weight: 2, fillColor: '#198754', fillOpacity: 0.92 }
          }
          eventHandlers={onSelectStop ? { click: () => onSelectStop(stop) } : undefined}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1} className="stop-tooltip">
            {stop.stopName}
          </Tooltip>
        </CircleMarker>
      ))}

      {location && (
        <>
          <Circle
            center={[location.lat, location.lng]}
            radius={location.accuracy}
            pathOptions={{ color: '#198754', weight: 1, fillColor: '#198754', fillOpacity: 0.11 }}
          />
          <Marker position={[location.lat, location.lng]} icon={userIcon} keyboard title="Votre position" />
        </>
      )}

      {routePoints.origin && (
        <Marker
          position={[routePoints.origin.lat, routePoints.origin.lng]}
          icon={originIcon}
          keyboard
          title="Point de départ sélectionné"
        />
      )}
      {routePoints.destination && (
        <Marker
          position={[routePoints.destination.lat, routePoints.destination.lng]}
          icon={destinationIcon}
          keyboard
          title="Point d'arrivée sélectionné"
        />
      )}
    </MapContainer>
  )
}

/** Carte mémorisée : elle ne se redessine que si ses données ou ses rappels changent. */
export const TransitMap = memo(TransitMapView)
