import { memo, useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L, { type DivIcon } from 'leaflet'
import type { PublishedStop, SnapshotBounds } from '../domain/published'
import { type CorridorLine, type CorridorStop } from '../domain/corridors'
import { formatFrequencyPeriod, formatSourceVerification } from '../domain/frequencies'
import { safeHttpUrl } from '../domain/http'
import { mobilityFromStopId, mobilityPaint, type MobilityId, type MobilityPaint } from '../domain/mobilityColors'
import { trackPositionsForLine } from '../domain/terTrackGeometry'
import { brtTrackPositionsForLine } from '../domain/brtTrackGeometry'
import { keyboardIsOpen, shouldResizeMap, summonsKeyboard } from '../domain/viewportLock'
import { focusTargetOf } from './useViewportLock'
import { DDD_BANLIEUE_ARCGIS_LAYERS, DDD_BANLIEUE_ARCGIS_STOP_GROUPS, DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL, DDD_URBAN_ARCGIS_ROUTE_LAYERS, DDD_URBAN_ARCGIS_STOP_LAYERS } from '../data/dddBanlieueArcgisRegistry'
import { dddArcgisFeatureStops, dddArcgisFeatureTracks, type DddArcgisMapStop, type DddArcgisMapTrack } from '../domain/dddArcgisMapGeometry'
import { GREATER_DAKAR_BUS_COVERAGE_POINTS } from '../data/greaterDakarBusCoverage'
import { osmRouteWayMembersToTracks, type OsmRouteMapTrack } from '../domain/osmRouteGeometry'

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
  /** Lignes et arrêts du premier itinéraire multimodal calculé. */
  highlightedLineIds?: readonly string[]
  highlightedStopIds?: readonly string[]
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

function isNearTracks(point: { lat: number; lon: number }, tracks: readonly (readonly [number, number][])[]): boolean {
  return tracks.some((positions) => positions.slice(1).some((end, index) =>
    distanceToSegmentMeters(point, positions[index], end) <= 35,
  ))
}

function canShowMobilityAt(
  mobility: MobilityId | null,
  point: { lat: number; lon: number },
  terTracks: readonly (readonly [number, number][])[],
  brtTracks: readonly (readonly [number, number][])[],
): boolean {
  if (isNearTracks(point, terTracks)) return mobility === 'ter'
  if (isNearTracks(point, brtTracks)) return mobility === 'brt'
  return true
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
/** Réduit la densité des pastilles selon le niveau de zoom, sans déplacer les arrêts. */
function MapStopDensityController() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const syncDensity = () => {
      const zoom = map.getZoom()
      container.classList.toggle('leaflet-map--citywide', zoom <= 12)
      container.classList.toggle('leaflet-map--district', zoom > 12 && zoom <= 13)
    }
    syncDensity()
    // Les tests unitaires utilisent une carte Leaflet simulée sans Evented.
    // En production, l'instance Leaflet expose bien on/off.
    const supportsZoomEvents = typeof map.on === 'function' && typeof map.off === 'function'
    if (supportsZoomEvents) map.on('zoomend', syncDensity)
    return () => {
      if (supportsZoomEvents) map.off('zoomend', syncDensity)
      container.classList.remove('leaflet-map--citywide', 'leaflet-map--district')
    }
  }, [map])

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
      { padding: [16, 16], animate: false },
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

function mobilityStopLabel(mobility: MobilityId | null, _stopId?: string): string {
  if (mobility === 'ter') return 'TER'
  if (mobility === 'brt') return 'BRT'
  if (mobility === 'ddd') return 'DDD'
  if (mobility === 'aftu_tata') return 'AFTU'
  return 'BUS'
}

function makeMobilityStopLabel(mobility: MobilityId | null, label: string, stopId?: string, displayLabel?: string): DivIcon {
  const paint = mobility ? mobilityPaint(mobility) : null
  const shortLabel = displayLabel ?? mobilityStopLabel(mobility, stopId)
  const network = mobility ?? 'bus'
  const color = paint?.core ?? '#64748B'
  const width = Math.max(22, shortLabel.length * 6)
  return L.divIcon({
    className: 'mobility-stop-label-shell',
    html: `<span class="mobility-stop-label mobility-stop-label-${network}" data-mobility="${network}" role="img" aria-label="${escapeHtml(`${shortLabel} — ${label}`)}" style="--stop-label-color:${escapeHtml(color)}">${escapeHtml(shortLabel)}</span>`,
    iconSize: [width, 10],
    // TER/BRT conservent leur ancrage centré ; les nouveaux libellés bus
    // s'ouvrent vers l'intérieur des terres au lieu de déborder côté océan.
    iconAnchor: mobility === 'ter' || mobility === 'brt' ? [width / 2, 5] : [0, 5],
  })
}
function paintFor(network: string | undefined, stopId?: string): MobilityPaint | null {
  return mobilityPaint(network) ?? mobilityPaint(mobilityFromStopId(stopId ?? ''))
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
  corridorLines = [],
  corridorStops = [],
  highlightedLineIds = [],
  highlightedStopIds = [],
  onSelectCorridorStop,
}: TransitMapProps) {
  const [dddArcgisTracks, setDddArcgisTracks] = useState<DddArcgisMapTrack[]>([])
  const [tataOsmTracks, setTataOsmTracks] = useState<OsmRouteMapTrack[]>([])
  const [dddArcgisStops, setDddArcgisStops] = useState<DddArcgisMapStop[]>([])

  // Les couches ArcGIS sont des références historiques, séparées du calculateur.
  // Elles enrichissent la carte sans fabriquer d'horaires ou de positions de bus.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const controller = new AbortController()
    const urbanServiceUrl = 'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer'
    const routeLayers = [
      ...DDD_BANLIEUE_ARCGIS_LAYERS.map((layer) => ({ line: layer.line, url: layer.layerUrl })),
      ...DDD_URBAN_ARCGIS_ROUTE_LAYERS.map((layer) => ({
        line: layer.line,
        url: `${urbanServiceUrl}/${layer.layerId}`,
      })),
    ]
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
        while (nextIndex < routeLayers.length && !controller.signal.aborted) {
          const layer = routeLayers[nextIndex]
          nextIndex += 1
          try {
            const response = await fetch(queryUrl(layer.url), { signal: controller.signal })
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
            const response = await fetch(queryUrl(layer.layerUrl), { signal: controller.signal })
            if (!response.ok) return []
            const collection = await response.json() as { features?: Parameters<typeof dddArcgisFeatureStops>[1] }
            return dddArcgisFeatureStops(layer.line, collection.features ?? [])
          } catch {
            return []
          }
        })),
        (async () => {
          try {
            const response = await fetch(queryUrl(DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL), { signal: controller.signal })
            if (!response.ok) return []
            const collection = await response.json() as { features?: Parameters<typeof dddArcgisFeatureStops>[1] }
            const features = collection.features ?? []
            return DDD_BANLIEUE_ARCGIS_STOP_GROUPS.flatMap((group) =>
              dddArcgisFeatureStops(
                group.line,
                features.filter((feature) => feature.properties?.Nom_Ligne === group.sourceGroup),
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

  // Aucun itinéraire bus n'est dessiné depuis de simples waypoints géographiques.
  // Les traces bus visibles proviennent uniquement de géométries de ligne publiées
  // (ArcGIS DDD ou relation OSM vérifiée), jamais d'un OSRM entre centres de lieux.

  // La relation OSM AFTU/TATA 40 possède une géométrie de route,
  // même si sa séquence d'arrêts n'est pas publiée dans OSM.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const controller = new AbortController()
    const query = '[out:json][timeout:30];relation(3982642);out body;>;out geom;'
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
    ]
    const loadTataRelation = async () => {
      for (const endpoint of endpoints) {
        if (controller.signal.aborted) return
        try {
          const url = `${endpoint}?${new URLSearchParams({ data: query }).toString()}`
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          if (!response.ok) continue
          const payload = await response.json() as { elements?: Parameters<typeof osmRouteWayMembersToTracks>[2] }
          const tracks = osmRouteWayMembersToTracks(3982642, '40', payload.elements ?? [])
          if (tracks.length > 0 && !controller.signal.aborted) {
            setTataOsmTracks(tracks)
            return
          }
        } catch {
          // Les couches AFTU/TATA déjà disponibles restent affichées si Overpass est indisponible.
        }
      }
    }
    void loadTataRelation()
    return () => controller.abort()
  }, [])

  const userIcon = useMemo(() => makeMarker('map-user-marker', 'Votre position', '#198754'), [])
  const originIcon = useMemo(() => makeMarker('map-route-marker map-route-marker-origin', 'Départ sélectionné', '#146b43'), [])
  const destinationIcon = useMemo(() => makeMarker('map-route-marker map-route-marker-destination', 'Destination sélectionnée', '#d78a32'), [])
  const stops = useMemo(() => mappableStops(publishedStops), [publishedStops])
  const searchRoutePositions = useMemo(
    () => (searchRoute ?? []).map((point) => [point.lat, point.lng] as [number, number]),
    [searchRoute],
  )
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
    [corridorLines, corridorStops],
  )

  // Sur chaque corridor structurant, seuls les libellés de son propre réseau
  // sont autorisés : TER sur TER, BRT sur BRT, jamais DDD/AFTU/TATA dessus.
  const terTracks = useMemo(
    () => corridorLineStops.filter(({ line }) => line.network === 'ter')
      .map(({ positions }) => positions).filter((positions) => positions.length > 1),
    [corridorLineStops],
  )
  const brtTracks = useMemo(
    () => corridorLineStops.filter(({ line }) => line.network === 'brt')
      .flatMap(({ positions, additionalPositions }) => [positions, ...(additionalPositions ?? [])])
      .filter((positions) => positions.length > 1),
    [corridorLineStops],
  )
  const highlightedLineIdSet = useMemo(() => new Set(highlightedLineIds), [highlightedLineIds])
  const highlightedStopIdSet = useMemo(() => new Set(highlightedStopIds), [highlightedStopIds])
  const corridorStopsToRender = useMemo(
    () => uniqueCorridorStops.filter((stop) => {
      const line = corridorLines.find((candidate) => candidate.stopIds.includes(stop.id))
      const mobility = mobilityFromStopId(stop.id) ?? (line?.network as MobilityId | undefined) ?? null
      return canShowMobilityAt(mobility, stop, terTracks, brtTracks)
    }),
    [uniqueCorridorStops, corridorLines, terTracks, brtTracks],
  )
  const publishedStopsToRender = useMemo(
    () => stops.filter((stop) => canShowMobilityAt(
      mobilityFromStopId(stop.stopId), { lat: stop.lat, lon: stop.lon }, terTracks, brtTracks,
    )),
    [stops, terTracks, brtTracks],
  )
  const dddArcgisStopsToRender = useMemo(
    () => dddArcgisStops.filter((stop) => canShowMobilityAt(
      'ddd', { lat: stop.position[0], lon: stop.position[1] }, terTracks, brtTracks,
    )),
    [dddArcgisStops, terTracks, brtTracks],
  )
  const coveragePointsToRender = useMemo(
    () => GREATER_DAKAR_BUS_COVERAGE_POINTS.filter((point) =>
      canShowMobilityAt(
        point.routes.some((route) => route.network === 'ddd') ? 'ddd' : 'aftu_tata',
        point, terTracks, brtTracks,
      ),
    ),
    [terTracks, brtTracks],
  )

  return (
    <MapContainer
      center={DAKAR_CENTER}
      zoom={13}
      minZoom={10}
      maxZoom={19}
      zoomControl={false}
      scrollWheelZoom
      /* Le rendu SVG est nécessaire à l'animation directionnelle des itinéraires. */
      /* Leaflet n'écoute plus `resize` : le clavier mobile ne redimensionne
         plus la carte. MapResizeController décide du recalcul. */
      trackResize={false}
      className={`leaflet-map${pickingPoint ? ' leaflet-map-picking' : ''}`}
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
      <MapSearchRouteFit positions={searchRoutePositions} />
      <MapRoutePointsFit
        origin={routePoints.origin ?? null}
        destination={routePoints.destination ?? null}
        hasSearchRoute={searchRoutePositions.length > 1}
      />
      <MapResizeController />
      <MapStopDensityController />

      {/* Couverture DDD élargie : géométries routières ArcGIS conservées
          hors du calculateur, pour afficher les dessertes urbaines et banlieue. */}
      {tataOsmTracks.map((track) => (
        <Polyline
          key={track.id}
          positions={track.positions}
          interactive
          pathOptions={{
            color: paintFor('aftu_tata')?.core ?? '#D97706',
            weight: 1.9,
            opacity: 0.72,
            dashArray: '4 6',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        >
          <Tooltip sticky opacity={0.94} className="stop-tooltip mobility-tooltip">
            <strong>AFTU {track.line}</strong>
          </Tooltip>
        </Polyline>
      ))}
      {coveragePointsToRender.map((point) => {
        const dddLines = point.routes.filter((route) => route.network === 'ddd').map((route) => route.line)
        const aftuLines = point.routes.filter((route) => route.network === 'aftu_tata').map((route) => route.line)
        return (
          <Marker
            key={`coverage-${point.id}`}
            position={[point.lat, point.lon]}
            icon={makeMobilityStopLabel(
              dddLines.length > 0 ? 'ddd' : 'aftu_tata',
              point.name,
              undefined,
              dddLines.length > 0 && aftuLines.length > 0 ? 'DDD · AFTU' : undefined,
            )}
            keyboard
            title={point.name}
          >
            <Tooltip sticky opacity={0.94} className="stop-tooltip mobility-tooltip">
              <strong>{point.name}</strong>
              <div>Zone desservie</div>
              {dddLines.length > 0 && <div>DDD · {dddLines.join(', ')}</div>}
              {aftuLines.length > 0 && <div>AFTU · {aftuLines.join(', ')}</div>}
            </Tooltip>
          </Marker>
        )
      })}
      {dddArcgisStopsToRender.map((stop) => (
        <Marker
          key={stop.id}
          position={stop.position}
          icon={makeMobilityStopLabel('ddd', `ligne ${stop.line}`)}
          keyboard
          title={stop.name ? `DDD — ${stop.name} · ligne ${stop.line}` : `DDD — ligne ${stop.line}`}
        >
          <Tooltip sticky opacity={0.94} className="stop-tooltip mobility-tooltip">
            <strong>{stop.name || `Arrêt de référence DDD · ligne ${stop.line}`}</strong>
            <div>DDD · ligne {stop.line}</div>
            <div>Repère cartographique historique</div>
          </Tooltip>
        </Marker>
      ))}
      {dddArcgisTracks.map((track) => (
        <Polyline
          key={track.id}
          positions={track.positions}
          interactive
          pathOptions={{
            color: paintFor('ddd')?.core ?? '#F59E0B',
            weight: 1.8,
            opacity: 0.62,
            dashArray: '5 6',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        >
          <Tooltip sticky opacity={0.94} className="stop-tooltip mobility-tooltip">
            <strong>DDD {track.line}</strong>
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
      {/* Mise en évidence du trajet calculé : mêmes géométries de référence, sans les remplacer. */}
      {corridorLineStops
        .filter(({ line, positions }) =>
          highlightedLineIdSet.has(line.id) &&
          (line.network === 'ter' || line.network === 'brt') &&
          positions.length > 1
        )
        .flatMap(({ line, positions, additionalPositions }) => {
          const paint = paintFor(line.network)
          const tracks = [positions, ...(additionalPositions ?? [])]
          const isContinuousTrack = line.network === 'ter' || line.network === 'brt'
          return tracks.flatMap((track, directionIndex) => [
            <Polyline
              key={`journey-halo-${line.id}-${directionIndex}`}
              positions={track}
              interactive={false}
              pathOptions={{ color: '#ffffff', weight: isContinuousTrack ? 8 : 6, opacity: 0.98, lineCap: 'round', lineJoin: 'round' }}
            />,
            <Polyline
              key={`journey-line-${line.id}-${directionIndex}`}
              positions={track}
              interactive={false}
              pathOptions={{ color: paint?.core ?? line.color, weight: isContinuousTrack ? 5.5 : 4, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
            />,
          ])
        })}
      {corridorStops
        .filter((stop) => highlightedStopIdSet.has(stop.id))
        .map((stop) => {
          const line = corridorLines.find((candidate) => candidate.stopIds.includes(stop.id))
          const paint = paintFor(line?.network, stop.id)
          return (
            <Circle
              key={`journey-stop-${stop.id}`}
              center={[stop.lat, stop.lon]}
              radius={72}
              interactive={false}
              pathOptions={{ color: paint?.core ?? '#198754', weight: 2, fillColor: paint?.core ?? '#198754', fillOpacity: 0.2 }}
            />
          )
        })}

      {/* Pastilles compactes : sigle du réseau directement sur chaque arrêt. */}
      {corridorStopsToRender.map((stop) => {
        const line = corridorLines.find((candidate) => candidate.stopIds.includes(stop.id))
        const mobility = mobilityFromStopId(stop.id) ?? (line?.network as MobilityId | undefined) ?? null
        const paint = paintFor(mobility ?? undefined, stop.id)
        return (
          <Marker
            key={`corridor-stop-${stop.id}`}
            position={[stop.lat, stop.lon]}
            icon={makeMobilityStopLabel(paint?.id ?? null, stop.name, stop.id)}
            keyboard
            title={`${paint?.label ?? 'Mobilité'} — ${stop.name}`}
            eventHandlers={onSelectCorridorStop ? { click: () => onSelectCorridorStop(stop) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className={`stop-tooltip mobility-tooltip${paint ? ` mobility-${paint.id}` : ''}`}>
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
          </Marker>
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

      {publishedStopsToRender.map((stop) => (
        <Marker
          key={stop.stopId}
          position={[stop.lat, stop.lon]}
          icon={makeMobilityStopLabel(mobilityFromStopId(stop.stopId), stop.stopName, stop.stopId)}
          keyboard
          title={stop.stopName}
          eventHandlers={onSelectStop ? { click: () => onSelectStop(stop) } : undefined}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} className="stop-tooltip">
            {stop.stopName}
          </Tooltip>
        </Marker>
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
