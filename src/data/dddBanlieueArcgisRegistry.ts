/**
 * Références de géométries de lignes DDD de banlieue publiées dans un service
 * ArcGIS public. Ce registre décrit les couches disponibles, pas des arrêts
 * ordonnés ni des horaires validés. Les dates sont celles affichées par les
 * métadonnées de couche lorsqu'elles ont été relevées.
 */
export interface DddBanlieueArcgisLayerReference {
  line: string
  layerId: number
  layerName: string
  layerUrl: string
  geometryType: 'polyline'
  spatialReference: 'EPSG:3857'
  dataLastEditDate: string | null
  sourceAge: 'historical'
  stopPointFeaturesIncluded: false
  directionOrderVerified: false
}

const serviceUrl =
  'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer'

const layer = (
  line: string,
  layerId: number,
  dataLastEditDate: string | null = null,
): DddBanlieueArcgisLayerReference => ({
  line,
  layerId,
  layerName: `Itinéraire_ligne_${line}_Dem_Dikk`,
  layerUrl: `${serviceUrl}/${layerId}`,
  geometryType: 'polyline',
  spatialReference: 'EPSG:3857',
  dataLastEditDate,
  sourceAge: 'historical',
  stopPointFeaturesIncluded: false,
  directionOrderVerified: false,
})

export const DDD_BANLIEUE_ARCGIS_LAYERS: readonly DddBanlieueArcgisLayerReference[] = [
  layer('227', 0, '2019-03-25'),
  layer('219', 1),
  layer('218', 2, '2017-12-06'),
  layer('217', 3, '2017-12-06'),
  layer('2', 4),
  layer('16B', 5),
  layer('16A', 6),
  layer('12', 7),
  layer('232', 8, '2017-12-06'),
  layer('5', 9),
  layer('11', 10),
  layer('228', 11, '2017-12-06'),
] as const

export const getDddBanlieueArcgisLayer = (line: string) =>
  DDD_BANLIEUE_ARCGIS_LAYERS.find((item) => item.line === line) ?? null

/** Couches urbaines DDD récupérées en lecture seule le 13/11/2026. */
export interface DddUrbanArcgisStopLayerReference {
  line: string
  layerId: number
  layerName: string
  layerUrl: string
  featureCount: number
  namedFeatureCount: number
  geolocatedFeatureCount: number
  dataLastEditDate: string | null
  sourceAge: 'historical'
}

const urbanServiceUrl =
  'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer'

export const DDD_URBAN_ARCGIS_STOP_LAYERS: readonly DddUrbanArcgisStopLayerReference[] = [
  { line: '13', layerId: 0, layerName: 'Arret_ligne_13_Dem_Dikk', layerUrl: `${urbanServiceUrl}/0`, featureCount: 23, namedFeatureCount: 23, geolocatedFeatureCount: 23, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '6', layerId: 1, layerName: 'Arret_ligne_6_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/1`, featureCount: 60, namedFeatureCount: 60, geolocatedFeatureCount: 60, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '7', layerId: 2, layerName: 'Arret_ligne_7_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/2`, featureCount: 34, namedFeatureCount: 33, geolocatedFeatureCount: 33, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '8', layerId: 3, layerName: 'Arret_ligne_8_Dem_Dikk', layerUrl: `${urbanServiceUrl}/3`, featureCount: 49, namedFeatureCount: 0, geolocatedFeatureCount: 49, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '9', layerId: 4, layerName: 'Arret_ligne_9_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/4`, featureCount: 36, namedFeatureCount: 36, geolocatedFeatureCount: 36, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '1', layerId: 5, layerName: 'Arrets_LIgne_1_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/5`, featureCount: 44, namedFeatureCount: 44, geolocatedFeatureCount: 44, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '10', layerId: 6, layerName: 'Arrets_LIgne_10_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/6`, featureCount: 26, namedFeatureCount: 26, geolocatedFeatureCount: 26, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '121', layerId: 7, layerName: 'Arrets_LIgne_121_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/7`, featureCount: 31, namedFeatureCount: 31, geolocatedFeatureCount: 31, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '13', layerId: 8, layerName: 'Arrets_LIgne_13_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/8`, featureCount: 22, namedFeatureCount: 0, geolocatedFeatureCount: 22, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '18', layerId: 9, layerName: 'Arrets_LIgne_18_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/9`, featureCount: 44, namedFeatureCount: 43, geolocatedFeatureCount: 44, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '23', layerId: 10, layerName: 'Arrets_LIgne_23_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/10`, featureCount: 56, namedFeatureCount: 54, geolocatedFeatureCount: 56, dataLastEditDate: null, sourceAge: 'historical' },
  { line: '4', layerId: 11, layerName: 'Arrets_LIgne_4_Dakar_Dem_Dikk', layerUrl: `${urbanServiceUrl}/11`, featureCount: 30, namedFeatureCount: 29, geolocatedFeatureCount: 30, dataLastEditDate: null, sourceAge: 'historical' },
] as const

export const DDD_URBAN_ARCGIS_ROUTE_LAYERS = [
  { line: '121', layerId: 12, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '13', layerId: 13, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '18', layerId: 14, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '20', layerId: 15, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '23', layerId: 16, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '4', layerId: 17, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '6', layerId: 18, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '7', layerId: 19, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  // ArcGIS contains one real corridor plus one blank duplicate feature for line 8.
  { line: '8', layerId: 20, featureCount: 2, nonEmptyFeatureCount: 1, emptyFeatureCount: 1 },
  { line: '9', layerId: 21, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '10', layerId: 22, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
  { line: '1', layerId: 23, featureCount: 1, nonEmptyFeatureCount: 1, emptyFeatureCount: 0 },
] as const

export const DDD_URBAN_ARCGIS_AUDIT_TOTALS = {
  routeLayers: DDD_URBAN_ARCGIS_ROUTE_LAYERS.length,
  routeFeatures: DDD_URBAN_ARCGIS_ROUTE_LAYERS.reduce((sum, layer) => sum + layer.featureCount, 0),
  nonEmptyRouteFeatures: DDD_URBAN_ARCGIS_ROUTE_LAYERS.reduce((sum, layer) => sum + layer.nonEmptyFeatureCount, 0),
  emptyRouteFeatures: DDD_URBAN_ARCGIS_ROUTE_LAYERS.reduce((sum, layer) => sum + layer.emptyFeatureCount, 0),
  stopLayers: DDD_URBAN_ARCGIS_STOP_LAYERS.length,
  stopFeatures: DDD_URBAN_ARCGIS_STOP_LAYERS.reduce((sum, layer) => sum + layer.featureCount, 0),
  namedStopFeatures: DDD_URBAN_ARCGIS_STOP_LAYERS.reduce((sum, layer) => sum + layer.namedFeatureCount, 0),
  missingNameStopFeatures: DDD_URBAN_ARCGIS_STOP_LAYERS.reduce((sum, layer) => sum + layer.featureCount - layer.namedFeatureCount, 0),
  geolocatedStopFeatures: DDD_URBAN_ARCGIS_STOP_LAYERS.reduce((sum, layer) => sum + layer.geolocatedFeatureCount, 0),
} as const
