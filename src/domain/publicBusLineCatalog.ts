/**
 * Catalogue public des lignes à intégrer aux tableaux de passage par arrêt.
 * Ce registre identifie les lignes et leurs terminus ; il ne prétend pas fournir
 * les séquences d'arrêts ni des horaires de passage. Ceux-ci sont ajoutés
 * uniquement lorsqu'une source exploitable les documente.
 */
export interface PublicBusLineReference {
  line: string
  origin: string
  destination: string
  sourceUrl: string
  sourceLabel: string
  network: 'ddd' | 'aftu'
}

const aftuSource = 'https://aftu-senegal.org/infos-pratiques/'
const dddSource = 'https://demdikk.sn/info-voyageurs/'

export const AFTU_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = [
  ['1','Lat Dior','HLM Grand Yoff'],
  ['2','Route principale Parcelles','Petersen'],
  ['3','Yoff','Petersen'],
  ['4','Yoff Village','Petersen'],
  ['5','Parcelles Assainies','Petersen'],
  ['24','UCAD','Notaire Guédiawaye'],
  ['25','Parcelles Assainies','Petersen'],
  ['26','Parcelles Assainies','Poste Thiaroye'],
  ['27','Marché Boubess','Petersen'],
  ['28','Hamo V/VI','Petersen'],
  ['29','Cité Nations Unies (Cambérène)','Petersen'],
  ['30','Gadaye (Guédiawaye)','Gare de Colobane'],
  ['31','Tally Icotaf × Route des Niayes','Hôpital Abass Ndao'],
  ['32','Sahm','Serigne Assane'],
  ['33','Colobane','Serigne Assane'],
  ['34','Nord Foire','Lat Dior'],
  ['35','Ngor','Pikine Texaco'],
  ['36','Marché Ndiarème','Ngor'],
  ['37','Cité APIX','UCAD (Claudel)'],
  ['38','Cité des Enseignants','Sahm'],
  ['39','Lat Dior','Diamalaye'],
  ['40','Grand Mbao','Petersen'],
  ['41','Petersen','Étage Madiale'],
  ['42','Gadaye (Guédiawaye)','Ouakam Baye'],
  ['43','Ouakam','Thierno Ndiaye'],
  ['44','Grand Mbao','Ouakam'],
  ['45','Kounoune Ngalam','Parcelles Église'],
  ['46','SDE Serigne Assane','Lat Dior'],
  ['47','Lat Dior','Almadies'],
  ['48','Cité Serigne Mansour','Lat Dior'],
  ['49','Gadaye','Ngor'],
  ['50','Petersen','Malika Cimetière'],
  ['51','Jaxaay','Gare des Baux Maraîchers'],
  ['52','Bountou Pikine','Keur Massar'],
  ['53','Keur Massar','SébiKotane'],
  ['54','Keur Massar (Cité MTOA)','UCAD'],
  ['55','Rufisque Sonadis','Petersen'],
  ['56','Jaxaay 2','Petersen'],
  ['57','Liberté 6','Rufisque'],
  ['58','Sahm','Comico'],
  ['59','Diamalaye','Cité Gendarmerie (Jaxaay)'],
  ['60','Colobane','Bargny'],
  ['61','Almadies','Keur Massar'],
  ['62','Arrêt Chérif (Rufisque)','Penc Mi (Gueule Tapée)'],
  ['63','Camp Marchand Rufisque','Stade LSS'],
  ['64','Guédiawaye','Rufisque'],
  ['65','Colobane','Jaxaay'],
  ['66','Yoff','Gorom 1'],
  ['67','Ouakam','Thiawlène Rufisque'],
  ['68','Yeumbeul','SébiKotane'],
  ['69','Diamalaye','Terminus Tivaouane Peul'],
  ['70','Daroukhane','Jaxaay 2'],
  ['71','Keur Massar','Claudel'],
  ['72','Guédiawaye','Kounoune'],
  ['73','Lac Rose','Poste Thiaroye'],
  ['74','Bargny (gare ferroviaire)','Tivaouane Peul'],
  ['75','Malika (Cité Sonatel)','Gare routière Colobane'],
  ['76','Sipres','Cité Assurance'],
  ['77','Rufisque','Liberté 5'],
  ['78','Diamaguène','Liberté 5'],
  ['79','Sangalkam','Cambérène'],
  ['80','Diamalaye','Darou Thioub'],
  ['81','Baux Maraîchers','Tivaouane Peul'],
  ['82','Lat Dior','Comico Yeumbeul'],
  ['83','Rufisque Arafat','Zone de Captage'],
  ['84','UCAD','Jaxaay'],
  ['85','Banoba','Liberté 5'],
  ['86','Tournalou Boune','Toubab Dialaw'],
  ['87','Bambilor','Mosquée Massalikou Djinane'],
  ['88','MTOA','Liberté 5'],
  ['89','Bargny','Croisement Niague (Cité SICAP)'],
  ['91','APIX','Dougar'],
].map(([line, origin, destination]) => ({
  line, origin, destination, network: 'aftu' as const,
  sourceUrl: aftuSource, sourceLabel: 'AFTU Sénégal · Infos pratiques',
}))

/** Lignes visibles dans l'information voyageurs officielle DDD (urbaines,
 * banlieue et dessertes de gares). Les suffixes A/B sont conservés. */
export const DDD_PUBLIC_LINE_CATALOG: readonly PublicBusLineReference[] = [
  ['1','Parcelles Assainies','Place Leclerc'],
  ['2','Daroukhane','Place Leclerc'],
  ['4','Liberté 5','Place Leclerc'],
  ['5','Guédiawaye','Palais 1'],
  ['6','Cambérène 2','Palais 2'],
  ['7','Ouakam','Palais 2'],
  ['8','Aéroport LSS','Palais 2'],
  ['9','Liberté 6','Palais 2'],
  ['10','Liberté 5','Palais 2'],
  ['11','Keur Massar','Lat Dior'],
  ['12','Guédiawaye','Palais 1'],
  ['13','Liberté 5','Palais 2'],
  ['15A','Rufisque','Palais 1'],
  ['15B','Rufisque','Palais 1'],
  ['16A','Malika','Palais 1'],
  ['16B','Malika','Palais 1'],
  ['18','Dieuppeul','Centre-ville'],
  ['20','Dieuppeul','Centre-ville'],
  ['23','Parcelles Assainies','Palais 1'],
  ['121','Scat Urbam','Leclerc'],
  ['208','Bayakh','Rufisque'],
  ['213','Rufisque','Dieuppeul'],
  ['217','Thiaroye','Ouakam'],
  ['218','Thiaroye','Aéroport LSS'],
  ['219','Daroukhane','Ouakam'],
  ['220','Rufisque','Guédiawaye'],
  ['221','Gadaye','Almadies'],
  ['227','Keur Massar','Parcelles Assainies'],
  ['228','Rufisque','Yenne'],
  ['232','Baux Maraîchers','Aéroport LSS'],
  ['233','Baux Maraîchers','Palais 1'],
  ['234','Jaxaay','Leclerc'],
  ['501','Gare de Dakar','Palais 2'],
  ['502A','Colobane','UCAD'],
  ['502B','Colobane','Abass Ndao'],
  ['503A','Colobane','Môle 8'],
  ['503B','Colobane','Hydrocarbure'],
  ['504A','Gare Diamniadio','Sphère ministérielle'],
  ['504B','Sébikotane','Gare Diamniadio'],
].map(([line, origin, destination]) => ({
  line, origin, destination, network: 'ddd' as const,
  sourceUrl: dddSource, sourceLabel: 'Dakar Dem Dikk · Info voyageurs',
}))

/** TATA reste un réseau distinct : aucune ligne AFTU ne lui est attribuée
 * sans preuve explicite de correspondance et aucune fréquence n'est extrapolée. */
export const TATA_REFERENCE_POLICY = {
  independentScheduleAvailable: false,
  note: 'Aucun rattachement de ligne ni horaire TATA indépendant n’est actuellement validé ; le panneau reste vide plutôt que d’afficher des données AFTU.'
} as const
