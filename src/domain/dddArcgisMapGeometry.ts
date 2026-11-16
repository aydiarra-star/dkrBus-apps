export interface DddArcgisGeoJsonFeature {
  geometry?: {
    type?: string
    coordinates?: unknown
  } | null
}

export interface DddArcgisMapTrack {
  id: string
  line: string
  part: number
  positions: readonly [number, number][]
}

/** Convertit une géométrie ArcGIS/GeoJSON WGS84 en positions Leaflet [lat, lon]. */
export function dddArcgisFeatureTracks(
  line: string,
  features: readonly DddArcgisGeoJsonFeature[],
): DddArcgisMapTrack[] {
  const tracks: DddArcgisMapTrack[] = []
  let part = 0
  for (const feature of features) {
    const geometry = feature.geometry
    if (!geometry || !Array.isArray(geometry.coordinates)) continue
    const coordinateParts = geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : []
    for (const coordinates of coordinateParts) {
      if (!Array.isArray(coordinates)) continue
      const positions = coordinates
        .filter((point): point is [number, number] =>
          Array.isArray(point)
          && Number.isFinite(point[0])
          && Number.isFinite(point[1])
          && point[0] >= -18
          && point[0] <= -16
          && point[1] >= 14
          && point[1] <= 16,
        )
        .map(([lon, lat]) => [lat, lon] as [number, number])
      if (positions.length < 2) continue
      tracks.push({ id: `ddd-arcgis-${line}-${part}`, line, part, positions })
      part += 1
    }
  }
  return tracks
}
