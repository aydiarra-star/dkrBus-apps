/**
 * Consolidation géographique des deux couches historiques d'arrêts DDD ligne 13.
 *
 * Source primaire : FeatureServer/0 (23 points nommés) et FeatureServer/8
 * (22 points identifiés par Id), extraits le 2026-11-09.
 * Projection native EPSG:32628 ; longitude/latitude calculées en EPSG:4326.
 *
 * Les 22 correspondances sont des doublons spatiaux probables (écart <= 2.892 m),
 * pas une preuve absolue d'identité commerciale. Les deux identifiants sources
 * et les deux coordonnées sont conservés. Le point source 0 / OBJECTID 2,
 * distant de 26.319 m du point le plus proche de la couche 8, reste distinct.
 *
 * L'ordre suit OBJECTID et la progression le long de la géométrie historique
 * de la couche itinéraire 13 (chaînage croissant). Cela ne valide pas à lui seul
 * l'exploitation actuelle ni l'affectation formelle Aller/Retour.
 */
export interface DddLine13HistoricalStop {
  sourceOrder: number
  name: string
  x32628: number
  y32628: number
  longitude: number
  latitude: number
  routeChainageMeters: number
  layer0ObjectId: number
  layer0GlobalId: string
  layer8ObjectId?: number
  layer8GlobalId?: string
  layer8X32628?: number
  layer8Y32628?: number
  spatialMatchDistanceMeters?: number
  reconciliation: 'spatial_duplicate_candidate' | 'only_in_layer_0'
}

export const DDD_LINE_13_HISTORICAL_STOPS: readonly DddLine13HistoricalStop[] = [
  { sourceOrder: 1, name: 'Terminus Liberté 5', x32628: 235281.6405, y32628: 1629129.4299, longitude: -17.4585261, latitude: 14.7229678, routeChainageMeters: 2.9, layer0ObjectId: 1, layer0GlobalId: '531b47ff-615e-4afd-89fc-ff2b2f98df1c', layer8ObjectId: 1, layer8GlobalId: 'f4933a51-256e-49cb-b57e-ce75d17e73c8', layer8X32628: 235280.0079, layer8Y32628: 1629131.817, spatialMatchDistanceMeters: 2.892, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 2, name: 'Arret Terminus Liberté 5', x32628: 235302.6914, y32628: 1629118.47, longitude: -17.4583296, latitude: 14.7228709, routeChainageMeters: 27.2, layer0ObjectId: 2, layer0GlobalId: '17092ea9-fffb-4f69-a699-5bf8fee312bd', reconciliation: 'only_in_layer_0' },
  { sourceOrder: 3, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 235630.0952, y32628: 1629112.3551, longitude: -17.4552903, latitude: 14.7228479, routeChainageMeters: 381.7, layer0ObjectId: 3, layer0GlobalId: '2edd31da-035a-4a18-9315-ea77217733d2', layer8ObjectId: 2, layer8GlobalId: 'fcd79cb1-3ab4-4f9d-b120-753d4326ecb9', layer8X32628: 235630.5237, layer8Y32628: 1629111.4872, spatialMatchDistanceMeters: 0.968, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 4, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236151.6351, y32628: 1629031.9233, longitude: -17.4504416, latitude: 14.7221727, routeChainageMeters: 909.2, layer0ObjectId: 4, layer0GlobalId: 'a727d425-4349-425c-824c-f317b56af416', layer8ObjectId: 3, layer8GlobalId: 'c9bb8a33-58bd-4d09-a4ee-02be2a1b4111', layer8X32628: 236150.8981, layer8Y32628: 1629029.8593, spatialMatchDistanceMeters: 2.192, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 5, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236604.0732, y32628: 1628365.348, longitude: -17.4461753, latitude: 14.7161958, routeChainageMeters: 1828.1, layer0ObjectId: 5, layer0GlobalId: '37c91c4e-283e-4324-860f-1cafa2c2eb82', layer8ObjectId: 4, layer8GlobalId: '2292f715-2025-4860-9b32-9f37c4c88ddd', layer8X32628: 236603.8706, layer8Y32628: 1628365.314, spatialMatchDistanceMeters: 0.205, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 6, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236574.7649, y32628: 1627965.4809, longitude: -17.446407, latitude: 14.7125808, routeChainageMeters: 2229.1, layer0ObjectId: 6, layer0GlobalId: 'c4367724-b0e2-4e30-b06f-03f281b7cb69', layer8ObjectId: 5, layer8GlobalId: '80661343-fd1d-4555-9bb9-ebff3486251f', layer8X32628: 236574.9436, layer8Y32628: 1627965.1883, spatialMatchDistanceMeters: 0.343, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 7, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236558.7925, y32628: 1627759.7058, longitude: -17.4465345, latitude: 14.7107205, routeChainageMeters: 2435.5, layer0ObjectId: 7, layer0GlobalId: 'be44a79d-27cc-4c9a-a8d6-08fdc5b863eb', layer8ObjectId: 6, layer8GlobalId: 'c4d13437-07a6-43ae-afe6-8ff8753750d9', layer8X32628: 236558.1113, layer8Y32628: 1627759.2317, spatialMatchDistanceMeters: 0.83, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 8, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236525.8073, y32628: 1627315.9676, longitude: -17.446796, latitude: 14.7067089, routeChainageMeters: 2880.5, layer0ObjectId: 8, layer0GlobalId: '44668381-db7f-45d5-8565-5c199bc8a80b', layer8ObjectId: 7, layer8GlobalId: 'a4b9fd65-6965-40d9-a7b8-0ecd3101b935', layer8X32628: 236523.7273, layer8Y32628: 1627316.3994, spatialMatchDistanceMeters: 2.124, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 9, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236498.4556, y32628: 1626966.5806, longitude: -17.4470146, latitude: 14.7035501, routeChainageMeters: 3230.9, layer0ObjectId: 9, layer0GlobalId: 'd76589f9-fb6e-42ca-83bc-bd5c8b4c6231', layer8ObjectId: 8, layer8GlobalId: '489e2395-7777-448d-b76d-8a8a860d21bc', layer8X32628: 236497.6519, layer8Y32628: 1626966.6169, spatialMatchDistanceMeters: 0.805, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 10, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236480.2541, y32628: 1626728.8173, longitude: -17.4471596, latitude: 14.7014006, routeChainageMeters: 3469.4, layer0ObjectId: 10, layer0GlobalId: '1b68c16b-e7d8-4910-8bd3-8806fcf16551', layer8ObjectId: 9, layer8GlobalId: '898a4ee8-d25c-4ddd-82c1-bf3fb5fccca8', layer8X32628: 236480.092, layer8Y32628: 1626728.9738, spatialMatchDistanceMeters: 0.225, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 11, name: 'Arret Avenue Cheikh Ahmadou Bamba', x32628: 236465.3108, y32628: 1626523.4404, longitude: -17.4472776, latitude: 14.6995439, routeChainageMeters: 3675.3, layer0ObjectId: 11, layer0GlobalId: '139d28ac-6d6d-48ee-ad4d-829f12bb5f3c', layer8ObjectId: 10, layer8GlobalId: '5d032562-1b8b-47ca-bce2-186c82d68378', layer8X32628: 236464.4122, layer8Y32628: 1626522.9941, spatialMatchDistanceMeters: 1.003, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 12, name: 'Arret Avenue Boulevard du Général de Gaulle', x32628: 236412.1521, y32628: 1625721.3906, longitude: -17.4476902, latitude: 14.6922937, routeChainageMeters: 4490.7, layer0ObjectId: 12, layer0GlobalId: '7d13b603-ffb6-44ba-ae01-906bbee78ef0', layer8ObjectId: 11, layer8GlobalId: 'f9cbe8f6-3dc5-4a0c-8217-d3fa87b796cd', layer8X32628: 236411.8945, layer8Y32628: 1625721.6054, spatialMatchDistanceMeters: 0.335, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 13, name: 'Arret Avenue Boulevard du Général de Gaulle', x32628: 236520.143, y32628: 1625382.0181, longitude: -17.446654, latitude: 14.6892386, routeChainageMeters: 4846.8, layer0ObjectId: 13, layer0GlobalId: '87985971-8f8e-48bd-b220-75d072c0871f', layer8ObjectId: 12, layer8GlobalId: 'a8686630-ca8a-4774-9888-d5673d98ee8c', layer8X32628: 236519.2529, layer8Y32628: 1625382.9524, spatialMatchDistanceMeters: 1.29, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 14, name: 'Arret Avenue Boulevard du Général de Gaulle', x32628: 236704.6817, y32628: 1624807.2448, longitude: -17.4448837, latitude: 14.6840646, routeChainageMeters: 5450.4, layer0ObjectId: 14, layer0GlobalId: '8f369d6a-1cc9-40eb-8639-dec4724ed335', layer8ObjectId: 13, layer8GlobalId: 'e04da99a-dcd1-4c00-be0b-e8987cddd7a5', layer8X32628: 236703.9595, layer8Y32628: 1624807.1338, spatialMatchDistanceMeters: 0.731, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 15, name: 'Arret Avenue Boulevard du Général de Gaulle', x32628: 236801.5837, y32628: 1624502.5981, longitude: -17.4439539, latitude: 14.6813222, routeChainageMeters: 5770.2, layer0ObjectId: 15, layer0GlobalId: '47639fec-c3ac-4c01-b2c5-5941c45d50a1', layer8ObjectId: 14, layer8GlobalId: '1757318d-62ac-4fac-ad5c-41fdd49968e0', layer8X32628: 236801.7157, layer8Y32628: 1624503.3178, spatialMatchDistanceMeters: 0.732, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 16, name: 'Arret Allées Papa Gueye Fall', x32628: 237016.4566, y32628: 1624135.5861, longitude: -17.4419232, latitude: 14.6780279, routeChainageMeters: 6222.2, layer0ObjectId: 16, layer0GlobalId: '86ea0711-621a-47ff-8581-10c97ea6c66a', layer8ObjectId: 15, layer8GlobalId: 'b21deecd-f77b-428d-8d2d-58f0b2bded2c', layer8X32628: 237017.119, layer8Y32628: 1624135.6128, spatialMatchDistanceMeters: 0.663, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 17, name: 'Arret Avenue Faidherbe', x32628: 237344.8743, y32628: 1623865.0871, longitude: -17.4388486, latitude: 14.6756164, routeChainageMeters: 6668.5, layer0ObjectId: 17, layer0GlobalId: '23164960-ce5b-47d8-b47b-de5af71c23a0', layer8ObjectId: 16, layer8GlobalId: 'c084b921-dcf7-4ef3-ac8f-bc3d52db7633', layer8X32628: 237345.3757, layer8Y32628: 1623864.4283, spatialMatchDistanceMeters: 0.828, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 18, name: 'Arret Avenue Faidherbe', x32628: 237647.5671, y32628: 1623792.7935, longitude: -17.4360325, latitude: 14.6749929, routeChainageMeters: 6979.7, layer0ObjectId: 18, layer0GlobalId: '35f00312-4067-445a-9e4e-370d03df72c4', layer8ObjectId: 17, layer8GlobalId: '89c4ef1f-187c-4ba5-a058-f30ce25995fd', layer8X32628: 237646.5698, layer8Y32628: 1623790.9292, spatialMatchDistanceMeters: 2.114, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 19, name: 'Arret Allée Léon Delmas', x32628: 238058.4455, y32628: 1623434.0575, longitude: -17.432184, latitude: 14.6717923, routeChainageMeters: 7567.4, layer0ObjectId: 19, layer0GlobalId: '90a79059-8340-4e77-8954-9ad154895581', layer8ObjectId: 18, layer8GlobalId: '9ad969e9-9474-4046-bfc0-e8c38ed360b5', layer8X32628: 238057.2978, layer8Y32628: 1623434.8673, spatialMatchDistanceMeters: 1.405, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 20, name: 'Arret Hopital Principal', x32628: 237748.2994, y32628: 1622414.9536, longitude: -17.4349601, latitude: 14.6625563, routeChainageMeters: 8719.9, layer0ObjectId: 20, layer0GlobalId: '5b2d4a01-3a84-4d21-9c68-7716fa16ed00', layer8ObjectId: 19, layer8GlobalId: 'ec7d1f99-0c9a-40ad-a065-e9779515a149', layer8X32628: 237750.1047, layer8Y32628: 1622416.4444, spatialMatchDistanceMeters: 2.341, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 21, name: 'Arret Avenue Pasteur', x32628: 237513.7361, y32628: 1622345.5953, longitude: -17.4371297, latitude: 14.6619069, routeChainageMeters: 9180.7, layer0ObjectId: 21, layer0GlobalId: '3a16c28a-2cba-4d6d-8894-9000161e5d7f', layer8ObjectId: 20, layer8GlobalId: '1bc774c2-493c-4739-87ef-b4f09db916e8', layer8X32628: 237512.2732, layer8Y32628: 1622345.6958, spatialMatchDistanceMeters: 1.466, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 22, name: 'Arret Hopital Aristide Le Dantec', x32628: 237657.6517, y32628: 1621951.4278, longitude: -17.4357549, latitude: 14.6583603, routeChainageMeters: 9600.3, layer0ObjectId: 22, layer0GlobalId: '36a45d9c-a3f6-4f6d-b53e-23fe3b1348f7', layer8ObjectId: 21, layer8GlobalId: '527a6920-7bd6-4582-9b63-e40c16024791', layer8X32628: 237658.2687, layer8Y32628: 1621951.9896, spatialMatchDistanceMeters: 0.834, reconciliation: 'spatial_duplicate_candidate' },
  { sourceOrder: 23, name: 'Arret Terminus DDD Palais 1', x32628: 237897.6743, y32628: 1621136.9151, longitude: -17.4334466, latitude: 14.6510259, routeChainageMeters: 10533.3, layer0ObjectId: 23, layer0GlobalId: '22c87838-8ae9-4e51-b6bd-f50457c7c639', layer8ObjectId: 22, layer8GlobalId: '9d38d5c8-26e5-4e7a-ac39-0fd07f5c9942', layer8X32628: 237896.9651, layer8Y32628: 1621138.0257, spatialMatchDistanceMeters: 1.318, reconciliation: 'spatial_duplicate_candidate' },
] as const

export const DDD_LINE_13_LAYER_0_FEATURE_COUNT = 23
export const DDD_LINE_13_LAYER_8_FEATURE_COUNT = 22
export const DDD_LINE_13_SPATIAL_MATCH_COUNT = 22
export const DDD_LINE_13_ONLY_LAYER_0_COUNT = 1
export const DDD_LINE_13_SPATIAL_MATCH_THRESHOLD_METERS = 3
export const DDD_LINE_13_HISTORICAL_ROUTE_LENGTH_METERS = 10562.1606
export const DDD_LINE_13_HISTORICAL_ROUTE_SOURCE_DATE = '2017-12-13'
