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
  ['53','Keur Massar (Cité MTOA)','UCAD'],
  ['54','Rufisque Sonadis','Petersen'],
  ['55','Jaxaay 2','Petersen'],
  ['56','Liberté 6','Rufisque'],
  ['57','Sahm','Comico'],
  ['58','Diamalaye','Cité Gendarmerie (Jaxaay)'],
  ['59','Colobane','Bargny'],
  ['60','Almadies','Keur Massar'],
  ['61','Arrêt Chérif (Rufisque)','Penc Mi (Gueule Tapée)'],
  ['62','Camp Marchand Rufisque','Stade LSS'],
  ['63','Guédiawaye','Rufisque'],
  ['64','Colobane','Jaxaay'],
  ['65','Yoff','Gorom 1'],
  ['66','Ouakam','Thiawlène Rufisque'],
  ['67','Yeumbeul','SébiKotane'],
  ['68','Diamalaye','Terminus Tivaouane Peul'],
  ['69','Daroukhane','Jaxaay 2'],
  ['70','Keur Massar','Claudel'],
  ['71','Guédiawaye','Kounoune'],
  ['72','Lac Rose','Poste Thiaroye'],
  ['73','Bargny (gare ferroviaire)','Tivaouane Peul'],
  ['74','Malika (Cité Sonatel)','Gare routière Colobane'],
  ['75','Sipres','Cité Assurance'],
  ['76','Rufisque','Liberté 5'],
  ['77','Diamaguène','Liberté 5'],
  ['78','Sangalkam','Cambérène'],
  ['79','Diamalaye','Darou Thioub'],
  ['80','Baux Maraîchers','Tivaouane Peul'],
  ['81','Lat Dior','Comico Yeumbeul'],
  ['82','Rufisque Arafat','Zone de Captage'],
  ['83','UCAD','Jaxaay'],
  ['84','Banoba','Liberté 5'],
  ['85','Tournalou Boune','Toubab Dialaw'],
  ['86','Bambilor','Mosquée Massalikou Dj inane'],
  ['87','MTOA','Liberté 5'],
  ['88','Bargny','Croisement Niague (Cité SICAP)'],
  ['89','APIX','Dougar'],
  ['91','Terminus Malika','Terminus Gare routière Colobane'],
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
  ['6','Cambérène 2 / Guédiawaye','Palais 2'],
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

/** TATA est affiché dans son propre panneau mais n'est pas assimilé à un
 * catalogue d'horaires indépendant sans source dédiée et vérifiée. */
export const TATA_REFERENCE_POLICY = {
  independentScheduleAvailable: false,
  note: 'Les références AFTU peuvent être réutilisées pour l’affichage TATA lorsque le rattachement de ligne est confirmé ; aucune fréquence autonome n’est inventée.',
} as const
