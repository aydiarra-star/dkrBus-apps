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
