/**
 * Séquences d'arrêts publiées par Dakar Dem Dikk.
 * Source : https://demdikk.sn/reseau-urbain-dakar/
 * Les séquences sont conservées dans l'ordre de la fiche officielle.
 * Elles ne contiennent aucune durée inter-arrêts : ne pas en déduire un
 * horaire de passage sans données de temps/fréquence vérifiées.
 */
export interface PublicBusRouteStops {
  network: 'ddd'
  line: string
  directionLabel: string
  stops: readonly string[]
  sourceUrl: string
  sourceLabel: string
}

const sourceUrl = 'https://demdikk.sn/reseau-urbain-dakar/'
const sourceLabel = 'Dakar Dem Dikk · Réseau urbain officiel'

export const DDD_PUBLIC_ROUTE_STOPS: readonly PublicBusRouteStops[] = [
  {
    network: 'ddd', line: '1', directionLabel: 'Parcelles Assainies → Leclerc',
    stops: ['Terminus Parcelles Assainies','Sapeur Pompiers','Unités 09 10 15','Ecole Dior','Terrain Acapes','Unités 22 24','Marché Grand Médine','Rond point 26','VDN-Foire','Cité Keur Gorgui','Ecole Normale','UCAD','Rond point Sham','Marché Tilène','Poste Médina','Difoncé','Sandaga','Avenue George Pompidou','Place de l’Indépendance','Gare TER','Embarcadère','Terminus Leclerc'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '4', directionLabel: 'Liberté 5 → Leclerc',
    stops: ['Terminus Liberté 5 (Dieuppeul)','Cité Derklé','Rond point Liberté 6','Khar Yalla','Cité Marine','CEM Dieuppeul 3','Eglise Martyrs de l’Ouganda','SDE','Collège Sacré Cœur','Sicap Karack','Point E','Université Amfhate BA','Canal 4','Marché Fass','Gueule Tapée','Rond Point Sham','Marché Tilène','Poste Médina','Difoncé','Sandaga','ASECNA','Boulevard de la République','Avenue Léopold Sédar Senghor','Place de l’Indépendance','Gare TER','Embarcadère','Terminus Leclerc'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '7', directionLabel: 'Ouakam → Palais 2',
    stops: ['Terminus Ouakam','Cité Assemblée','Cité Comico','Sortie Ouakam','Hôpital IHO','Mermoz','ENEA','Ecole Normale','UCAD','Rond point Sham','Marché Tilène','Poste Médina','Difoncé','Sandaga','Avenue George Pompidou','Place de l’Indépendance','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '8', directionLabel: 'Aéroport LSS → Palais 2',
    stops: ['Terminus Aéroport LSS','Cité ASECNA','Yoff Village','Pont Foire','Stade Léopold Sédar Senghor – Patte d’Oie','Grand Yoff','Hôpital Général Idrissa Pouye (ex CTO)','Cité des Eaux','Station Castor','Avenue Bourguiba','Jet d’eau','Stade Demba Diop','Dial Diop (ex rue 10)','Zone B','Point E','UCAD','Rond point Sham','Marché Tilène','Poste Médina','Difoncé','Sandaga','ASECNA','Boulevard de la République','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée Nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '9', directionLabel: 'Liberté 6 → Palais 2',
    stops: ['Terminus Liberté 6','Rond Point JVC','Sacré Cœur','IPG','Terminus Dieuppeul','Allées Ababacar Sy','Rond Point Jet d’Eau','Niary Tally','Eglise Sainte Thérèse','Lycée Blaise Diagne','Lycée Kennedy','Obélisque','Centenaire','Rond point RTS','Poste Médina','Difoncé','Sandaga','Avenue George Pompidou','Place de l’Indépendance','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '10', directionLabel: 'Liberté 5 → Palais 2',
    stops: ['Terminus Liberté 5 (Dieuppeul)','Cité Derklé','Rond point Liberté 6','Khar Yalla','Cité Marine','CEM Ousmane Socé Diop','Eglise Martyrs de l’Ouganda','SDE','Dakar Sacré Cœur','Stade Demba Diop','Avenue Bourguiba','Ecole Normale','Poste Fann','Rue Aimé Césaire','Ministère de la Santé','Corniche Ouest','IFAN','Hôtel Terrou','Tunnel de Soumbédioune','Village Artisanal de Soumbédioune','Prison Rebeuss','Terminal de Dakar','Boulevard de la République','Sorano','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '13', directionLabel: 'Liberté 5 → Palais 2',
    stops: ['Terminus Liberté 5 (Dieuppeul)','Avenue Cheikh Ahmadou Bamba (ex rue 13 Prolongée)','Station Castors','Marché HLM','Ouagou Niayes','BOP','Masalikul Djinane','CSS','Lycée Kennedy','Boulevard Général de Gaulle','Centenaire','RTS','Grande Mosquée','Allées Papa Guèye Fall','Petersen','Avenue Faidherbe','Esso Port','Gare de Dakar','Place de l’Indépendance','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '20', directionLabel: 'Dieuppeul → centre-ville',
    stops: ['Terminus Dieuppeul','Allées Ababacar Sy','Jet d’Eau','Avenue Bourguiba','Stade Demba Diop','Ecole Normale','Poste Fann','Avenue Cheikh Anta Diop','UCAD','Canal 4','Lycée Delafosse','Gueule Tapée','Rue 6','Médina','DAF','Mosquée Seydou Nourrou Tall','Rebeuss','Lat Dior','Avenue Peytavin','Rond point Sandaga','Avenue Georges Pompidou','Place de l’Indépendance','Gare TER','Esso Port','Boulevard de l’Arsenal','Central Bel Air (MTOA)','Grands Moulins de Dakar','Police Bel Air','Service des Mines','Colobane','CSS','Masalikul Djinane','Cité Port','Ouagou Niayes','Marché HLM','Station Castors','Avenue Cheikh Ahmadou Bamba','Cité Marine','Khar Yalla','Rond Point Liberté 6','Cité Derklé','Terminus Dieuppeul'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '23', directionLabel: 'Parcelles Assainies → Palais 1',
    stops: ['Terminus des Parcelles','Ecole Dior','Diamalaye','HLM Grand Médine','Dior','Acapes','Dispensaire Norade','Hôpital Mame Abdou','Eglise','Unité 11','Croisement 22','Police Parcelles','Pont Emergent','Ecole Hyacinthe Thiandoum','Rond point Liberté 6','Khar Yalla','Front de Terre','Cité des Eaux','Station Castor','Avenue Bourguiba','Stade Demba Diop','Ecole Normale','Poste Fann','Avenue Cheikh Anta Diop','UCAD','Rond Point Sahm','Canal 4','Gueule Tapée','Rue 6','DAF','Poste Médina','Difoncé','Sandaga','ASECNA','Boulevard de la République','Avenue Léopold Sédar Senghor','Hôpital Principal','Rond point Assemblée nationale','Institut Pasteur','Terminus Palais 2'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '121', directionLabel: 'Scat Urbam → Leclerc',
    stops: ['Terminus Scat Urbam','Mairie Grand Yoff','Pentola','Les deux voies de Sipres','Camp pénal','Les deux voies de Liberté 6','Rond point JVC','Boulangerie Zone','Collège Sacré Cœur','Scor Liberté','Sicap rue 10','Lycée Blaise Diagne','Place ONU','Canal 4','HLM Fass','Travaux communaux','Rue 22 prolongée','RTS','Allées Papa Guèye Fall','Petersen','Avenue Faidherbe','Place de l’Indépendance','Albert Sarraut','BCEAO','Terminus Leclerc'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '2', directionLabel: 'Daroukhane → Leclerc',
    stops: ['Terminus Daroukhane','Corniche','Hamo','Terminus Guédiawaye','Marché Sahm','Ravin','Ecole Canada','Route des Niayes','Tally Boumack','Bountou Pikine','Route Nationale n° 1','Péage Pikine','Cité des Eaux','Station Castors','Avenue Cheikh Ahmadou Bamba','Marché HLM','Masalikul Djinane','BOPP','Rond Point Colobane','Lycée Kennedy','Boulevard Général de Gaulle','Obélisque','Rue 39','Douta Seck','Avenue Blaise Diagne','Poste Médina','Difoncé','Sandaga','ASECNA','Boulevard de la République','Avenue Léopold Sédar Senghor','Place de l’Indépendance','Gare de Dakar','Embarcadère','Terminus Leclerc'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '5', directionLabel: 'Guédiawaye → Palais 1',
    stops: ['Terminus Guédiawaye','Marché Jeudi','Hôpital Dalal Diam','Case PA','Police de Parcelles Assainies – Pont Sénégal 92','Patte d’Oie','Autoroute','Intendance','Avenue Lamine Gueye','Avenue André Peytavin','Avenue Jean Jaurès (Direction Générale ASECNA)','Boulevard de la République','Avenue Léopold Sédar Senghor','Avenue Nelson Mandela','Palais 1'],
    sourceUrl, sourceLabel,
  },

  {
    network: 'ddd', line: '11', directionLabel: 'Keur Massar → Lat Dior',
    stops: ['Terminus Keur Massar','Station Keur Massar','Croisement Keur Massar','Fass Mbao','Diamaguène','Poste Thiaroye','Autoroute à péage','Corniche des HLM','Colobane','Boulevard Général de Gaulle (Centenaire)','RTS','Rond Point','Poste Médina','Blaise Diagne','Sandaga','Terminus Lat Dior'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '12', directionLabel: 'Guédiawaye → Palais 1',
    stops: ['Terminus Guédiawaye','Lycée Canada','Tally Boubess','Marché Sandika','Bountou Pikine','National 1','Croisement Camberene','Autoroute','Cité des Eaux','Station Castors','Avenue Bourguiba','Ecole Normale','Avenue Cheikh Anta Diop (Hôpital Fann)','Rond Point Sahm','Avenue Blaise Diagne','Avenue Jean Jaurès','Boulevard de la République','Avenue Léopold Sédar Senghor','Avenue Nelson Mandela','Palais 1'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '15', directionLabel: 'Rufisque → Palais 1',
    stops: ['Terminus Rufisque','Djoutiba','Sortie Rufisque','Croisement Keur Massar','Fass Mbao','Diamaguène','Poste Thiaroye','Croisement Bountou Pikine','National 1','Croisement Camberene','Autoroute','Colobane','SCOA','Esso Port','Place de l’Indépendance','Avenue Léopold Sédar Senghor','Avenue Nelson Mandela','Palais 1'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '16A', directionLabel: 'Malika → Palais 1',
    stops: ['Terminus Malika','Malika Plage','Terminus 221 (Gadaye)','Hamo','Terminus Guédiawaye','Marché Sahm','Ecole Canada','Icotaf','Cité Lobatt Fall','Rond Point Lobatt Fall','Autoroute','Colobane','Rond Point Colobane','Place Bakou','CFAO Technologies','Cyrnos','Arsenal','Place de l’Indépendance','Palais 1'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '16B', directionLabel: 'Malika → Palais 1',
    stops: ['Terminus Malika','Station Keur Massar','Croisement Keur Massar','LGI Mbao','Diamaguène','Thiaroye','SIPS','Sotiba (Seras)','Yarakh','Capa Virmaud','Place Bakou','SCOA','Police Bel Air','Bel Air','GMD','Sofrigal (Môle 8)','Cyrnos (sur le pont)','Caserne Sapeurs-Pompiers','Avenue Lamine Guèye (Sandaga)','Avenue André Peytavin','Avenue Jean Jaurès','Boulevard de la République','Avenue Léopold Sédar Senghor (Roume)','Hôpital Principal','Assemblée Nationale','Hôpital Le Dantec','Palais 1'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '208', directionLabel: 'Bayakh → Rufisque',
    stops: ['Gorom 01','Gorom 02','Bambilor','Noflaye','Sangalkam','Keur Ndiaye Lo','Rufisque'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '213', directionLabel: 'Rufisque → Dieuppeul',
    stops: ['Gare de Rufisque','HLM SIPRES','ZAC Mbao','Rond Point Grand Mbao','Keur Mbaye Fall','Croisement Petit Mbao','Diamaguène','Poste Thiaroye','Péage','Sortie Croisement Cambérène','Patte d’Oie','Marché Grand Yoff','Police Grand Yoff','Rond Point Liberté 6','Deux voies Liberté 6','Rond Point JVC','Terminus Dieuppeul'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '217', directionLabel: 'Thiaroye → Aéroport LSS via Ouakam',
    stops: ['Dépôt Thiaroye','SIPS','Bountou Pikine','Patte d’Oie','Foire','VDN','Sipres','Ancienne piste','Ouakam','Marché Ouakam','Terminus Ouakam','Route des Mamelles','Route des Almadies','Ngor','Terminus Aéroport LSS'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '219', directionLabel: 'Daroukhane → Ouakam',
    stops: ['Daroukhane','Marché Ndiarème','Deux voies Notaire','Sapeur pompier Guédiawaye','Marché Jeudi Corniche','Hôpital Dalal Diam','Case bi','Pont Sénégal 92','Collège Hyacinthe Thiandoum','Rond Point Liberté 6','Rond Point JVC','Rond Point Boulangerie Jaune','Immeuble Mariama','Ancienne Piste','Hôpital militaire de Ouakam','Comico','Cité ASECNA','Cité Assemblée','Terminus Ouakam'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '221', directionLabel: 'Gadaye → Almadies',
    stops: ['Terminus Gadaye (Filaos)','Corniche Daroukhane','Hamo 6','Arrêt Dial Mbaye','PAI','Hôpital Dalal Diam','Case','Police PA','Pont Sénégal émergent (92)','Route de l’aéroport','Yoff Tonghor','Cité ASECNA','Rond Point Ngor','Ngor village','Terminus Almadies'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '227', directionLabel: 'Keur Massar → Parcelles',
    stops: ['Terminus Keur Massar','Tolou Abdoulaye Wade','Croisement Tivaouane Peulh','APIX','Malika Plage','Police Wakhinane','Hamo 6','Arrêt Dial Mbaye','Terminus Guédiawaye','Stade Amadou Barry','CES Canada','Hôpital Dalal Diam','Case bi','Croisement 22','Eglise PA','Terminus Parcelles'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '228', directionLabel: 'Rufisque → Yenne',
    stops: ['Terminus Rufisque','Ville de Rufisque','Bargny','Diamniadio Yenne'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '232', directionLabel: 'Baux Maraîchers → Aéroport LSS',
    stops: ['Baux Maraîchers','Yarakh','Cafétéria','Hann Maristes','Cours Sainte Marie de Hann','Sortie Mariste','Usine des eaux','Front de terre','Khar Yalla','Rond Point Liberté 6','Deux voies vers Camp Leclerc','VDN','Foire','Yoff','Terminus Aéroport LSS'],
    sourceUrl, sourceLabel,
  },
  {
    network: 'ddd', line: '234', directionLabel: 'Jaxaay → Leclerc',
    stops: ['Terminus Jaxaay (Mosquée Niakoul Rab)','Terminus 56','Deux voies Jaxaay','Station Keur Massar','Croisement Keur Massar','Fass Mbao','Diamaguène','Poste Thiaroye','Péage','Grand Théâtre','Esso Port','Place de l’Indépendance / Avenue Sarraut','Leclerc'],
    sourceUrl, sourceLabel,
  },
]

/**
 * La source officielle décrit les arrêts dans un seul sens de lecture.
 * Le sens retour n'est pas automatiquement inversé : certains parcours peuvent
 * diverger. Il faut une fiche retour vérifiée avant de l'afficher comme exacte.
 */
