import { memo, useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { PublishedStop, SnapshotBounds } from '../domain/published'
import { type CorridorLine, type CorridorStop } from '../domain/corridors'
import { formatFrequencyPeriod, formatSourceVerification } from '../domain/frequencies'
import { isValidLatLng, safeHttpUrl } from '../domain/http'
import { mobilityPaint } from '../domain/mobilityColors'
import { trackPositionsForLine } from '../domain/terTrackGeometry'
import { brtTrackPositionsForLine } from '../domain/brtTrackGeometry'
import { keyboardIsOpen, shouldResizeMap, summonsKeyboard } from '../domain/viewportLock'
import { focusTargetOf } from './useViewportLock'
import { DDD_ARCGIS_MAP_TRACKS, DDD_BANLIEUE_ARCGIS_STOP_GROUPS, DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL, DDD_URBAN_ARCGIS_STOP_LAYERS } from '../data/dddBanlieueArcgisRegistry'
import { dddArcgisFeatureStops, dddArcgisFeatureTracks, type DddArcgisMapStop, type DddArcgisMapTrack } from '../domain/dddArcgisMapGeometry'
import { referenceMapPoints, type MapLayers } from './referenceMapPoints'
import { badgeFor, MapPointLayer, type MapPoint } from './MapPointLayer'
import type { JourneyMarker, MapSegment } from '../routing/presentation'
import type { Place } from '../routing/model'
import type { DakarEndpoint } from '../routing/placeConnections'

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
  /** Géométrie routière complète calculée depuis la recherche de lieux. */
  searchRoute?: readonly Coordinates[] | null
  /** Portions exactes des jambes dont la géométrie directionnelle a été auditée. */
  highlightedRouteSegments?: readonly MapSegment[]
  highlightedChanges?: readonly Place[]
  highlightedCalls?: readonly JourneyMarker[]
  /** In Trajet with an OD, the selected route is not a network-coverage layer. */
  journeyFocus?: boolean
  pickingPoint: RoutePointKey | null
  recenterTo: Coordinates | null
  zoomAction: { delta: number; nonce: number } | null
  onChoosePoint: (point: DakarEndpoint) => void
  publishedStops?: readonly PublishedStop[]
  selectedStopId?: string | null
  coverage?: SnapshotBounds | null
  showCoverage?: boolean
  onSelectStop?: (stop: PublishedStop) => void
  /** Enveloppe à cadrer au chargement (Almadies → Rufisque/Bargny + terminus). */
  initialBounds?: RegionBounds | null
  /** Lignes de référence à tracer (TER/BRT), déjà filtrées par couche. */
  layers?: MapLayers
  corridorLines?: readonly CorridorLine[]
  /** Arrêts de référence à afficher, déjà filtrés par couche. */
  corridorStops?: readonly CorridorStop[]
  onSelectCorridorStop?: (stop: CorridorStop) => void
}

const DAKAR_CENTER: [number, number] = [14.7167, -17.4677]

export type MappablePublishedStop = PublishedStop & { lat: number; lon: number }

/** Stops are only mapped where the feed declares coordinates. */
export function mappableStops(stops: readonly PublishedStop[]): MappablePublishedStop[] {
  return stops.filter((stop): stop is MappablePublishedStop => isValidLatLng(stop.lat, stop.lon))
}

function MapClickHandler({
  pickingPoint,
  onChoosePoint,
}: Pick<TransitMapProps, 'pickingPoint' | 'onChoosePoint'>) {
  const map = useMapEvents({
    click(event) {
      if (pickingPoint) {
        onChoosePoint({ kind: 'map', lat: event.latlng.lat, lng: event.latlng.lng })
      }
    },
  })
  // React Leaflet does not update MapContainer.className after mounting.
  useEffect(() => { map.getContainer().classList.toggle('leaflet-map-picking', Boolean(pickingPoint)) }, [map, pickingPoint])
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

function MapInitialFit({ bounds }: { bounds: RegionBounds | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(
      [
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ],
      // Leave space for the layer/zoom controls, including to the east of AIBD.
      { paddingTopLeft: [28, 44], paddingBottomRight: [58, 34], animate: false },
    )
    // Appliqué une seule fois au montage : le centrage manuel prime ensuite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

/** Cadre automatiquement le trajet multimodal entre ses deux points. */
function MapRoutePointsFit({
  origin,
  destination,
  hasSearchRoute,
}: {
  origin: Coordinates | null
  destination: Coordinates | null
  hasSearchRoute: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (hasSearchRoute || !origin || !destination) return
    map.fitBounds(
      [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      { padding: [38, 38], maxZoom: 15, animate: true, duration: 0.8 },
    )
  }, [map, origin?.lat, origin?.lng, destination?.lat, destination?.lng, hasSearchRoute])
  return null
}

function MapSearchRouteFit({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length < 2) return
    map.fitBounds(positions, { padding: [38, 38], maxZoom: 15, animate: true, duration: 0.8 })
  }, [map, positions])
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

function TransitMapView({
  location,
  routePoints,
  searchRoute = null,
  pickingPoint,
  recenterTo,
  zoomAction,
  onChoosePoint,
  publishedStops = [],
  coverage = null,
  showCoverage = true,
  onSelectStop,
  initialBounds = null,
  layers = {},
  corridorLines = [],
  corridorStops = [],
  highlightedRouteSegments = [],
  highlightedChanges = [],
  highlightedCalls = [],
  journeyFocus = false,
  onSelectCorridorStop,
}: TransitMapProps) {
  const [dddArcgisTracks, setDddArcgisTracks] = useState<DddArcgisMapTrack[]>([])
  const [dddArcgisStops, setDddArcgisStops] = useState<DddArcgisMapStop[]>([])
  // Les couches ArcGIS sont des références historiques, séparées du calculateur.
  // Elles enrichissent la carte sans fabriquer d'horaires ou de positions de bus.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const controller = new AbortController()
    const queryUrl = (url: string) => {
      const query = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson',
      })
      return `${url}/query?${query.toString()}`
    }
    const loadTracks = async () => {
      const tracks: DddArcgisMapTrack[] = []
      let nextIndex = 0
      const worker = async () => {
        while (nextIndex < DDD_ARCGIS_MAP_TRACKS.length && !controller.signal.aborted) {
          const layer = DDD_ARCGIS_MAP_TRACKS[nextIndex]
          nextIndex += 1
          try {
            const response = await fetch(queryUrl(layer.url), { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
            if (!response.ok) continue
            const collection = await response.json() as { features?: Parameters<typeof dddArcgisFeatureTracks>[1] }
            tracks.push(...dddArcgisFeatureTracks(layer.line, collection.features ?? []))
          } catch {
            // Une couche indisponible ne bloque jamais les autres mobilités.
          }
        }
      }
      await Promise.all(Array.from({ length: 4 }, () => worker()))
      if (!controller.signal.aborted) {
        setDddArcgisTracks(tracks.sort((a, b) => a.line.localeCompare(b.line, 'fr', { numeric: true }) || a.part - b.part))
      }
    }
    const loadStops = async () => {
      const [urbanCollections, suburbanStops] = await Promise.all([
        Promise.all(DDD_URBAN_ARCGIS_STOP_LAYERS.map(async (layer) => {
          try {
            const response = await fetch(queryUrl(layer.layerUrl), { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
            if (!response.ok) return []
            const collection = await response.json() as { features?: Parameters<typeof dddArcgisFeatureStops>[1] }
            return dddArcgisFeatureStops(layer.line, collection.features ?? [], `urban-${layer.layerId}`)
          } catch {
            return []
          }
        })),
        (async () => {
          try {
            const response = await fetch(queryUrl(DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL), { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
            if (!response.ok) return []
            const collection = await response.json() as { features?: Parameters<typeof dddArcgisFeatureStops>[1] }
            const features = collection.features ?? []
            return DDD_BANLIEUE_ARCGIS_STOP_GROUPS.flatMap((group) =>
              dddArcgisFeatureStops(
                group.line,
                features.filter((feature) => feature.properties?.Nom_Ligne === group.sourceGroup),
                'suburban-0',
              ),
            )
          } catch {
            return []
          }
        })(),
      ])
      if (!controller.signal.aborted) {
        const unique = new Map<string, DddArcgisMapStop>()
        for (const stop of [...urbanCollections.flat(), ...suburbanStops]) unique.set(stop.id, stop)
        setDddArcgisStops([...unique.values()])
      }
    }
    void Promise.all([loadTracks(), loadStops()])
    return () => controller.abort()
  }, [])

  const stops = useMemo(() => mappableStops(publishedStops), [publishedStops])
  const searchRoutePositions = useMemo(
    () => (searchRoute ?? []).map((point) => [point.lat, point.lng] as [number, number]),
    [searchRoute],
  )
  const journeyBounds = useMemo(() => highlightedRouteSegments.flatMap(s => s.positions.map(([lat, lng]): [number, number] => [lat, lng])), [highlightedRouteSegments])
  const corridorLineStops = useMemo(
    () =>
      corridorLines.map((line) => {
        const terTrack = trackPositionsForLine(line.id) as [number, number][] | undefined
        const brtTracks = brtTrackPositionsForLine(line.id) as readonly (readonly [number, number][])[] | undefined
        return {
          line,
          // Seules les voies TER/BRT disposant d'une géométrie cartographique
          // dédiée peuvent produire un tracé continu. Ne jamais relier les
          // coordonnées des arrêts DDD/AFTU/TATA par des segments droits.
          positions:
            terTrack ??
            (brtTracks?.[0] as [number, number][] | undefined) ??
            [],
          additionalPositions: brtTracks?.slice(1) as [number, number][][] | undefined,
        }
      }),
    [corridorLines],
  )

  const points = useMemo(() => {
    const result: MapPoint[] = []
    for (const [kind, p, title] of [
      ['origin', routePoints.origin, 'Point de départ sélectionné'],
      ['destination', routePoints.destination, "Point d’arrivée sélectionné"],
      ['gps', location, 'Votre position'],
    ] as const) if (p) result.push({ key: kind, name: title, title, kind: 'Position sur la carte', symbol: kind, position: [p.lat, p.lng], badges: [] })
    highlightedChanges.forEach((p, i) => result.push({ key: `change:${i}:${p.id}`, name: p.name, title: `Correspondance · ${p.name}`,
      kind: 'Correspondance du trajet sélectionné', symbol: 'change', position: [p.lat, p.lon], badges: [] }))
    highlightedCalls.forEach(({ place: p, line, role, network }, i) => result.push({ key: `call:${i}:${p.id}`, name: p.name,
      title: `${role} · ${p.name} · ${line}`, badges: [badgeFor(network, line)], position: [p.lat, p.lon], kind: `${role} · ${line}`,
      symbol: role === 'Repère cartographique' ? 'landmark' : undefined }))
    if (!journeyFocus) result.push(...referenceMapPoints({ corridors: corridorStops, lines: corridorLines, published: stops,
      historical: dddArcgisStops, layers, picking: Boolean(pickingPoint), choose: onChoosePoint,
      selectReference: onSelectCorridorStop, selectPublished: onSelectStop }))
    return result
  }, [routePoints, location, highlightedChanges, highlightedCalls, journeyFocus, corridorStops, corridorLines, stops, dddArcgisStops, layers,
    pickingPoint, onChoosePoint, onSelectCorridorStop, onSelectStop])

  return (
    <MapContainer
      center={DAKAR_CENTER}
      zoom={13}
      minZoom={9}
      zoomSnap={0.25}
      maxZoom={19}
      zoomControl={false}
      scrollWheelZoom
      /* Le rendu SVG est nécessaire à l'animation directionnelle des itinéraires. */
      /* Leaflet n'écoute plus `resize` : le clavier mobile ne redimensionne
         plus la carte. MapResizeController décide du recalcul. */
      trackResize={false}
      className="leaflet-map"
      aria-label="Carte interactive de l’agglomération de Dakar et de ses dessertes périphériques"
    >
      <TileLayer
        attribution={`<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>${searchRoutePositions.length > 1 ? ' · Itinéraire routier : OSRM' : ''}`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapClickHandler pickingPoint={pickingPoint} onChoosePoint={onChoosePoint} />
      <MapController recenterTo={recenterTo} zoomAction={zoomAction} />
      <MapInitialFit bounds={initialBounds} />
      <MapSearchRouteFit positions={journeyBounds.length ? journeyBounds : searchRoutePositions} />
      <MapRoutePointsFit
        origin={routePoints.origin ?? null}
        destination={routePoints.destination ?? null}
        hasSearchRoute={searchRoutePositions.length > 1 || journeyBounds.length > 1}
      />
      <MapResizeController />

      {!journeyFocus && <>
      {layers.ddd !== false && dddArcgisTracks.map((track) => (
        <Polyline
          key={track.id}
          positions={track.positions}
          interactive
          pathOptions={{
            color: mobilityPaint('ddd')?.core ?? '#F59E0B',
            weight: 1.8,
            opacity: 0.62,
            dashArray: '5 6',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        >
          <Tooltip sticky opacity={0.94} className="stop-tooltip mobility-tooltip">
            <strong>DDD {track.line}</strong><div>Tracé ArcGIS historique · service actuel non certifié</div>
          </Tooltip>
        </Polyline>
      ))}

      {/* Réseau de référence :
          - TER #003366 bleu et BRT #00A859 vert émeraude : tracés continus complets (halo + casing + core)
          - DDD #F59E0B jaune/or et AFTU/TATA #D97706 orange ambré : pastilles arrêts + pointillés très légers (pas de gros tracés)
      */}
      {/* Halo + casing pour TER/BRT uniquement */}
      {corridorLineStops
        .filter(({ line }) => line.network === 'ter' || line.network === 'brt')
        .flatMap(({ line, positions, additionalPositions }) => {
          const paint = mobilityPaint(line.network)
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
          const paint = mobilityPaint(line.network)
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
          const paint = mobilityPaint(line.network)
          return [positions, ...(additionalPositions ?? [])].map((track, directionIndex) => (
            <Polyline
              key={`corridor-${line.id}-${directionIndex}`}
              positions={track}
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
              {directionIndex === 0 && (
                <Tooltip permanent direction="center" opacity={0.88} className="mobility-route-name-label">
                  {line.shortName}
                </Tooltip>
              )}
            </Polyline>
          ))
        })}
      </>}
      {/* Le trajet calculé n'accentue que les portions exactes découpées
          depuis une géométrie directionnelle validée. Aucune ligne entière
          n'est mise en avant comme substitut à la jambe réellement parcourue. */}
      {highlightedRouteSegments.flatMap((segment) => {
        if (segment.positions.length < 2) return []
        const color = segment.network === 'walk' ? '#475569' : mobilityPaint(segment.network)?.core
        if (!color) return []
        const positions = segment.positions as [number, number][]
        return [
          <Polyline
            key={`journey-segment-halo-${segment.id}`}
            positions={positions}
            interactive={false}
            pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.98, lineCap: 'round', lineJoin: 'round' }}
          />,
          <Polyline
            key={`journey-segment-${segment.id}`}
            positions={positions}
            interactive={false}
            pathOptions={{ color, dashArray: segment.geographyOnly ? '8 5' : segment.network === 'walk' ? '4 6' : segment.busFamily === 'tata' ? '12 3' : undefined, weight: 5.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />,
        ]
      })}
      {!journeyFocus && coverage && showCoverage && (
        <Rectangle
          bounds={[
            [coverage.minLat, coverage.minLon],
            [coverage.maxLat, coverage.maxLon],
          ]}
          pathOptions={{ color: '#198754', weight: 1, dashArray: '5 6', fillColor: '#198754', fillOpacity: 0.05 }}
        />
      )}

      {location && <Circle center={[location.lat, location.lng]} radius={location.accuracy} interactive={false}
        pathOptions={{ color: '#198754', weight: 1, fillColor: '#198754', fillOpacity: 0.11 }} />}

      {searchRoutePositions.length > 1 && (
        <>
          <Polyline
            positions={searchRoutePositions}
            interactive={false}
            pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.96, lineCap: 'round', lineJoin: 'round' }}
          />
          <Polyline
            positions={searchRoutePositions}
            pathOptions={{ color: '#7c3aed', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
        </>
      )}

      <MapPointLayer points={points} picking={Boolean(pickingPoint)} />
    </MapContainer>
  )
}

/** Carte mémorisée : elle ne se redessine que si ses données ou ses rappels changent. */
export const TransitMap = memo(TransitMapView)
