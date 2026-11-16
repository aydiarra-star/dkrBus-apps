export interface OsmRouteWayGeometry {
  type?: string
  id?: number | string
  geometry?: readonly { lat?: number; lon?: number }[]
}

export interface OsmRouteMapTrack {
  id: string
  line: string
  positions: [number, number][]
}

/** Convertit les ways membres d'une relation OSM en segments Leaflet indépendants. */
export function osmRouteWayMembersToTracks(
  relationId: number | string,
  line: string,
  elements: readonly OsmRouteWayGeometry[],
): OsmRouteMapTrack[] {
  return elements
    .filter((element) => element.type === 'way' && Array.isArray(element.geometry))
    .map((way, index) => {
      const positions = (way.geometry ?? [])
        .filter((point) =>
          Number.isFinite(point.lat)
          && Number.isFinite(point.lon)
          && (point.lat as number) >= 14
          && (point.lat as number) <= 16
          && (point.lon as number) >= -18
          && (point.lon as number) <= -16,
        )
        .map((point) => [point.lat as number, point.lon as number] as [number, number])
      return {
        id: `osm-route-${relationId}-${way.id ?? index}`,
        line,
        positions,
      }
    })
    .filter((track) => track.positions.length >= 2)
}
