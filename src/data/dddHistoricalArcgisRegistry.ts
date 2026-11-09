/**
 * Inventaire des couches historiques DDD disponibles dans le service ArcGIS
 * Ligne_inter_urbain. Les quantités sont des estimations publiées par le
 * service, pas des séquences directionnelles validées.
 *
 * Les sources anciennes restent des références tant qu'aucune preuve nouvelle
 * ne les confirme, ne les complète ou ne les contredit.
 */
export interface DddHistoricalLayerReference {
  line: string
  stopLayerId: number
  stopLayerName: string
  estimatedStopFeatures: number
  routeLayerId: number | null
  routeLayerName: string | null
  spatialReference: 'EPSG:32628'
  sourceUrl: string
  sourceAge: 'historical'
  directionOrderVerified: false
}

const serviceUrl =
  'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer'

const entry = (
  line: string,
  stopLayerId: number,
  stopLayerName: string,
  estimatedStopFeatures: number,
  routeLayerId: number | null,
  routeLayerName: string | null,
): DddHistoricalLayerReference => ({
  line,
  stopLayerId,
  stopLayerName,
  estimatedStopFeatures,
  routeLayerId,
  routeLayerName,
  spatialReference: 'EPSG:32628',
  sourceUrl: serviceUrl,
  sourceAge: 'historical',
  directionOrderVerified: false,
})

/**
 * Counts and layer IDs are transcribed from the ArcGIS service's GetEstimates
 * resource. A route layer may exist without a corresponding stop layer in
 * this historical service (line 20 is the current example).
 */
export const DDD_HISTORICAL_ARCGIS_REGISTRY: readonly DddHistoricalLayerReference[] = [
  entry('1', 5, 'Arrets_LIgne_1_Dakar_Dem_Dikk', 44, 23, 'Itinéraire_ligne_1_Dem_Dikk'),
  entry('4', 11, 'Arrets_LIgne_4_Dakar_Dem_Dikk', 30, 17, 'Itinéraire_ligne_4_Dem_Dikk'),
  entry('6', 1, 'Arret_ligne_6_Dakar_Dem_Dikk', 60, 18, 'Itinéraire_ligne_6_Dem_Dikk'),
  entry('7', 2, 'Arret_ligne_7_Dakar_Dem_Dikk', 34, 19, 'Itinéraire_ligne_7_Dem_Dikk'),
  entry('8', 3, 'Arret_ligne_8_Dem_Dikk', 49, 20, 'Itinéraire_ligne_8_Dem_Dikk'),
  entry('9', 4, 'Arret_ligne_9_Dem_Dikk', 36, 21, 'Itinéraire_ligne_9_Dem_Dikk'),
  entry('10', 6, 'Arrets_LIgne_10_Dakar_Dem_Dikk', 26, 22, 'Itinéraire_ligne_10_Dem_Dikk'),
  entry('13', 8, 'Arrets_LIgne_13_Dakar_Dem_Dikk', 22, 13, 'Itinéraire_ligne_13_Dem_Dikk'),
  entry('18', 9, 'Arrets_LIgne_18_Dakar_Dem_Dikk', 44, 14, 'Itinéraire_ligne_18_Dakar_Dem_Dikk'),
  entry('20', -1, 'Aucune couche d’arrêts identifiée dans cet inventaire', 0, 15, 'Itinéraire_ligne_20_Dakar_Dem_Dikk'),
  entry('23', 10, 'Arrets_LIgne_23_Dakar_Dem_Dikk', 56, 16, 'Itinéraire_ligne_23_Dem_Dikk'),
  entry('121', 7, 'Arrets_LIgne_121_Dakar_Dem_Dikk', 31, 12, 'Itinéraire_ligne_121_Dem_Dikk'),
] as const

export const getDddHistoricalLayerReference = (line: string) =>
  DDD_HISTORICAL_ARCGIS_REGISTRY.find((reference) => reference.line === line)

export const getDddHistoricalStopFeatureTotal = () =>
  DDD_HISTORICAL_ARCGIS_REGISTRY.reduce(
    (total, reference) => total + reference.estimatedStopFeatures,
    0,
  )
