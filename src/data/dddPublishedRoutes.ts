/**
 * Séquences de repères publiées par Dakar Dem Dikk sur sa page
 * « Réseau urbain de Dakar ». Ce sont des transcriptions textuelles de l'ordre
 * affiché par la source, pas des séquences Aller/Retour géolocalisées.
 *
 * `published_order` signifie que la page publie les repères dans cet
 * ordre entre les terminus affichés. `published_circuit` conserve
 * un circuit/une boucle décrit par la source sans le découper artificiellement
 * en Aller et Retour.
 *
 * Aucun sens opposé n'est généré par inversion.
 */
export type DddPublishedRouteKind = 'published_order' | 'published_circuit'

export interface DddPublishedRoute {
  line: string
  origin: string
  destination: string
  kind: DddPublishedRouteKind
  stops: readonly string[]
  sourceUrl: string
  sourceLabel: string
  retrievedOn: '2026-11-09' | '2026-11-10'
  directionVerified: false
  coordinatesVerified: false
}

const sourceUrl = 'https://demdikk.sn/reseau-urbain-dakar/'
const sourceLabel = 'Dakar Dem Dikk · Réseau urbain de Dakar'

const route = (
  line: string,
  origin: string,
  destination: string,
  kind: DddPublishedRouteKind,
  stops: readonly string[],
  retrievedOn: '2026-11-09' | '2026-11-10' = '2026-11-09',
): DddPublishedRoute => ({
  line, origin, destination, kind, stops,
  sourceUrl, sourceLabel, retrievedOn,
  directionVerified: false,
  coordinatesVerified: false,
})

export const DDD_PUBLISHED_ROUTES: readonly DddPublishedRoute[] = [
  route('1', 'Parcelles Assainies', 'Place Leclerc', 'published_order', [
    'Terminus Parcelles Assainies', 'Sapeur Pompiers', 'Unités 09 10 15',
    'Ecole Dior', 'Terrain Acapes', 'Unités 22 24', 'Marché Grand Médine',
    'Rond point 26', 'VDN-Foire', 'Cité Keur Gorgui', 'Ecole Normale',
    'UCAD', 'Rond point Sham', 'Marché Tilène', 'Poste Médina', 'Difoncé',
    'Sandaga', 'Avenue George Pompidou', 'Place de l’Indépendance',
    'Gare TER', 'Embarcadère', 'Terminus Leclerc',
  ]),
  route('4', 'Liberté 5', 'Place Leclerc', 'published_order', [
    'Terminus Liberté 5 (Dieuppeul)', 'Cité Derklé', 'Rond point Liberté 6',
    'Khar Yalla', 'Cité Marine', 'CEM Dieuppeul 3',
    'Eglise Martyrs de l’Ouganda', 'SDE', 'Collège Sacré Cœur',
    'Sicap Karack', 'Point E', 'Université Amphiate BA', 'Canal 4',
    'Marché Fass', 'Gueule Tapée', 'Rond Point Sham', 'Marché Tilène',
    'Poste Médina', 'Difoncé', 'Sandaga', 'ASECNA',
    'Boulevard de la République', 'Avenue Léopold Sédar Senghor',
    'Place de l’Indépendance', 'Gare TER', 'Embarcadère', 'Terminus Leclerc',
  ]),
  route('7', 'Ouakam', 'Palais 2', 'published_order', [
    'Terminus Ouakam', 'Cité Assemblée', 'Cité Comico', 'Sortie Ouakam',
    'Hôpital IHO', 'Mermoz', 'ENEA', 'Ecole Normale', 'UCAD',
    'Rond point Sham', 'Marché Tilène', 'Poste Médina', 'Difoncé', 'Sandaga',
    'Avenue George Pompidou', 'Place de l’Indépendance',
    'Avenue Léopold Sédar Senghor', 'Hôpital Principal',
    'Rond point Assemblée nationale', 'Institut Pasteur', 'Terminus Palais 2',
  ]),
  route('8', 'Aéroport LSS', 'Palais 2', 'published_order', [
    'Terminus Aéroport LSS', 'Cité ASECNA', 'Yoff Village', 'Pont Foire',
    'Stade Léopold Sédar Senghor – Patte d’Oie', 'Grand Yoff',
    'Hôpital Général Idrissa Pouye (ex CTO)', 'Cité des Eaux',
    'Station Castors', 'Avenue Bourguiba', 'Jet d’eau', 'Stade Demba Diop',
    'Dial Diop (ex rue 10)', 'Zone B', 'Point E', 'UCAD', 'Rond point Sham',
    'Marché Tilène', 'Poste Médina', 'Difoncé', 'Sandaga', 'ASECNA',
    'Boulevard de la République', 'Avenue Léopold Sédar Senghor',
    'Hôpital Principal', 'Rond point Assemblée Nationale', 'Institut Pasteur',
    'Terminus Palais 2',
  ]),
  route('9', 'Liberté 6', 'Palais 2', 'published_order', [
    'Terminus Liberté 6', 'Rond Point JVC', 'Sacré Cœur', 'IPG',
    'Terminus Dieuppeul', 'Allées Ababacar Sy', 'Rond Point Jet d’Eau',
    'Niary Tally', 'Eglise Sainte Thérèse', 'Lycée Blaise Diagne',
    'Lycée Kennedy', 'Obélisque', 'Centenaire', 'Rond point RTS',
    'Poste Médina', 'Difoncé', 'Sandaga', 'Avenue George Pompidou',
    'Place de l’Indépendance', 'Avenue Léopold Sédar Senghor',
    'Hôpital Principal', 'Rond point Assemblée nationale',
    'Institut Pasteur', 'Terminus Palais 2',
  ]),
  route('10', 'Liberté 5', 'Palais 2', 'published_order', [
    'Terminus Liberté 5 (Dieuppeul)', 'Cité Derklé', 'Rond point Liberté 6',
    'Khar Yalla', 'Cité Marine', 'CEM Ousmane Socé Diop',
    'Eglise Martyrs de l’Ouganda', 'SDE', 'Dakar Sacré Cœur',
    'Stade Demba Diop', 'Avenue Bourguiba', 'Ecole Normale', 'Poste Fann',
    'Rue Aimé Césaire', 'Ministère de la Santé', 'Corniche Ouest', 'IFAN',
    'Hôtel Terrou', 'Tunnel de Soumbédioune',
    'Village Artisanal de Soumbédioune', 'Prison Rebeus',
    'Tribunal de Dakar', 'Boulevard de la République', 'Sorano',
    'Avenue Léopold Sédar Senghor', 'Hôpital Principal',
    'Rond point Assemblée nationale', 'Institut Pasteur', 'Terminus Palais 2',
  ]),
  route('13', 'Liberté 5', 'Palais 2', 'published_order', [
    'Terminus Liberté 5 (Dieuppeul)', 'Avenue Cheikh Ahmadou Bamba',
    'Station Castors', 'Marché HLM', 'Ouagou Niayes', 'BOP',
    'Masalikul Djinane', 'CSS', 'Lycée Kennedy',
    'Boulevard Général de Gaulle', 'Centenaire', 'RTS', 'Grande Mosquée',
    'Allées Papa Guèye Fall', 'Petersen', 'Avenue Faidherbe', 'Esso Port',
    'Gare de Dakar', 'Place de l’Indépendance',
    'Avenue Léopold Sédar Senghor', 'Hôpital Principal',
    'Rond-point Assemblée nationale', 'Institut Pasteur', 'Terminus Palais 2',
  ]),
  route('18', 'Dieuppeul', 'Centre-ville', 'published_circuit', [
    'Terminus Liberté 5 (Dieuppeul)', 'Cité Derklé', 'Rond Point Liberté 6',
    'Khar Yalla', 'Cité Marine', 'Avenue Cheikh Ahmadou Bamba',
    'Station Castors', 'Marché HLM', 'Ouagou Niayes', 'BOP',
    'Masalikul Djinane', 'CSS', 'Colobane', 'Service des mines',
    'Place BAKOU', 'Police Bel Air', 'Grand Moulin de Dakar', 'Bel Air',
    'Arsenal', 'Gare de Dakar', 'Esso Port', 'Place de l’Indépendance',
    'Avenue Georges Pompidou', 'Rond point Sandaga', 'Avenue André Peytavin',
    'Lat Dior', 'Route de la Corniche', 'Reubeuss',
    'Mosquée Seydou Nourou Tall – DAF', 'Rue 6', 'Médina', 'Gueule Tapée',
    'Lycée Delafosse', 'Canal 4', 'Rond point Sham',
    'Avenue Cheikh Anta Diop', 'Ecole Normale Supérieure',
    'Avenue Bourguiba', 'Stade Demba Diop', 'Rond Point Jet d’eau',
    'Allées Ababacar Sy', 'Terminus Liberté 5 (Dieuppeul)',
  ]),
  route('20', 'Dieuppeul', 'Centre-ville', 'published_circuit', [
    'Terminus Dieuppeul', 'Allées Ababacar Sy', 'Jet d’Eau',
    'Avenue Bourguiba', 'Stade Demba Diop', 'Ecole Normale', 'Poste Fann',
    'Avenue Cheikh Anta Diop', 'UCAD', 'Canal 4', 'Lycée Delafosse',
    'Gueule Tapée', 'Rue 6', 'Médina', 'DAF',
    'Mosquée Seydou Nourou Tall', 'Rebeuss', 'Lat Dior',
    'Avenue Peytavin', 'Rond point Sandaga', 'Avenue Georges Pompidou',
    'Place de l’Indépendance', 'Gare TER', 'Esso Port',
    'Boulevard de l’Arsenal', 'Central Bel Air (MTOA)',
    'Grands Moulin de Dakar', 'Police Bel Air', 'Service des Mines',
    'Colobane', 'CSS', 'Masalikul Djinane', 'Cité Port', 'Ouagou Niayes',
    'Marché HLM', 'Station Castors', 'Avenue Cheikh Ahmadou Bamba',
    'Cité Marine', 'Khar Yalla', 'Rond Point Liberté 6', 'Cité Derklé',
    'Terminus Dieuppeul',
  ]),
  route('23', 'Parcelles Assainies', 'Palais 1', 'published_order', [
    'Terminus des Parcelles', 'Ecole Dior', 'Diamalaye',
    'HLM Grand Médine', 'Dior', 'ACAPES', 'Dispensaire Norade',
    'Hôpital Mame Abdou', 'Eglise', 'Unité 11', 'Croisement 22',
    'Police Parcelles', 'Pont Emergent', 'Ecole Hyacinthe Thiandoum',
    'Rond point Liberté 6', 'Khar Yalla', 'Front de Terre', 'Cité des Eaux',
    'Station Castor', 'Avenue Bourguiba', 'Stade Demba Diop',
    'Ecole Normale', 'Poste Fann', 'Avenue Cheikh Anta Diop', 'UCAD',
    'Rond Point Sahm', 'Canal 4', 'Gueule Tapée', 'Rue 6', 'DAF',
    'Poste Médina', 'Difoncé', 'Sandaga', 'ASECNA',
    'Boulevard de la République', 'Avenue Léopold Sédar Senghor',
    'Hôpital Principal', 'Rond point Assemblée nationale',
    'Institut Pasteur', 'Terminus Palais 2',
  ]),
  route('121', 'Scat Urbam', 'Leclerc', 'published_order', [
    'Terminus Scat Urbam', 'Mairie Grand Yoff', 'Pentola',
    'Les deux voies de Sipres', 'Camp pénal', 'Les deux voies de Liberté 6',
    'Rond point JVC', 'Boulangerie Zone', 'Collège Sacré Cœur',
    'Scor Liberté', 'Sicap rue 10', 'Lycée Blaise Diagne', 'Place ONU',
    'Canal 4', 'HLM Fass', 'Travaux communaux', 'Rue 22 prolongée', 'RTS',
    'Allées Papa Guèye Fall', 'Petersen', 'Avenue Faidherbe',
    'Place de l’Indépendance', 'Albert Sarraut', 'BCEAO', 'Terminus Leclerc',
  ]),

  route('2', 'Daroukhane', 'Place Leclerc', 'published_order', [
    'Terminus Daroukhane', 'Corniche', 'Hamo', 'Terminus Guédiawaye',
    'Marché Sahm', 'Ravin', 'Ecole Canada', 'Route des Niayes',
    'Tally Boumack', 'Bountou Pikine', 'Route Nationale n° 1',
    'Péage Pikine', 'Cité des Eaux', 'Station Castors',
    'Avenue Cheikh Ahmadou Bamba', 'Marché HLM', 'Masalikul Djinane',
    'BOPP', 'Rond Point Colobane', 'Lycée Kennedy',
    'Boulevard Général de Gaulle', 'Obélisque', 'Rue 39', 'Douta Seck',
    'Avenue Blaise Diagne', 'Poste Médina', 'Difoncé', 'Sandaga',
    'ASECNA', 'Boulevard de la République',
    'Avenue Léopold Sédar Senghor', 'Place de l’Indépendance',
    'Gare de Dakar', 'Embarcadère', 'Terminus Leclerc',
  ]),
  route('5', 'Guédiawaye', 'Palais 1', 'published_order', [
    'Terminus Guédiawaye', 'Marché Jeudi', 'Hôpital Dalal Diam', 'Case PA',
    'Police de Parcelles Assainies – Pont Sénégal 92', 'Patte d’Oie',
    'Autoroute', 'Intendance', 'Avenue Lamine Gueye',
    'Avenue André Peytavin', 'Avenue Jean Jaurès',
    'Boulevard de la République', 'Avenue Léopold Sédar Senghor',
    'Avenue Nelson Mandela', 'Palais 1',
  ]),
  route('6', 'Cambérène 2', 'Palais 2', 'published_order', [
    'Terminus Cambérène 2', 'Marché Jeudi', 'Hôpital Dalal Diam',
    'Case PA', 'Police de Parcelles Assainies – Marché Grand Médine',
    'Rond point 26', 'Foire', 'Sipres', 'Rond point Liberté 6',
    'Terminus Liberté 5', 'Allées Khalifa Ababacar Sy', 'Jet d’Eau',
    'Niary Tally', 'Eglise Sainte Thérèse', 'ENA',
    'Boulevard Général de Gaulle', 'Allées Papa Guèye Fall',
    'Avenue Faidherbe', 'Avenue Lamine Gueye',
    'Avenue André Peytavin', 'Avenue Jean Jaurès',
    'Boulevard de la République', 'Avenue Nelson Mandela', 'Palais 2',
  ]),
  route('11', 'Keur Massar', 'Lat Dior', 'published_order', [
    'Terminus Keur Massar', 'Station Keur Massar', 'Croisement Keur Massar',
    'Fass Mbao', 'Diamaguène', 'Poste Thiaroye', 'Autoroute à péage',
    'Corniche des HLM', 'Colobane',
    'Boulevard Général de Gaulle (Centenaire)', 'RTS', 'Rond Point',
    'Poste Médina', 'Blaise Diagne', 'Sandaga', 'Terminus Lat Dior',
  ]),
  route('12', 'Guédiawaye', 'Palais 1', 'published_order', [
    'Terminus Guédiawaye', 'Lycée Canada', 'Tally Boubess',
    'Marché Sandika', 'Bountou Pikine', 'Nationale 1',
    'Croisement Cambérène', 'Autoroute', 'Cité des Eaux',
    'Station Castors', 'Avenue Bourguiba', 'Ecole Normale',
    'Avenue Cheikh Anta Diop (Hôpital Fann)', 'Rond Point Sahm',
    'Avenue Blaise Diagne', 'Avenue Jean Jaurès',
    'Boulevard de la République', 'Avenue Léopold Sédar Senghor',
    'Avenue Nelson Mandela', 'Palais 1',
  ]),
  route('16A', 'Malika', 'Palais 1', 'published_order', [
    'Terminus Malika', 'Malika Plage', 'Terminus 221 (Gadaye)', 'Hamo',
    'Terminus Guédiawaye', 'Marché Sahm', 'Ecole Canada', 'Icotaf',
    'Cité Lobatt Fall', 'Rond Point Lobatt Fall', 'Autoroute', 'Colobane',
    'Rond Point Colobane', 'Place Bakou', 'CFAO Technologies', 'Cyrnos',
    'Arsenal', 'Place de l’Indépendance', 'Palais 1',
  ]),
  route('16B', 'Malika', 'Palais 1', 'published_order', [
    'Terminus Malika', 'Station Keur Massar', 'Croisement Keur Massar',
    'LGI Mbao', 'Diamaguène', 'Thiaroye', 'SIPS', 'Sotiba (Seras)',
    'Yarakh', 'Capa Virmaud', 'Place Bakou', 'SCOA', 'Police Bel Air',
    'Bel Air', 'GMD', 'Sofrigal (Môle 8)', 'Cyrnos (sur le pont)',
    'Caserne Sapeurs-Pompiers', 'Avenue Lamine Guèye (Sandaga)',
    'Avenue André Peytavin', 'Avenue Jean Jaurès',
    'Boulevard de la République',
    'Avenue Léopold Sédar Senghor (Roume)', 'Hôpital Principal',
    'Assemblée Nationale', 'Hôpital Le Dantec', 'Palais 1',
  ]),
  route('208', 'Bayakh', 'Rufisque', 'published_order', [
    'Gorom 01', 'Gorom 02', 'Bambilor', 'Noflaye', 'Sangalkam',
    'Keur Ndiaye Lo', 'Rufisque',
  ]),
  route('213', 'Rufisque', 'Dieuppeul', 'published_order', [
    'Gare de Rufisque', 'HLM SIPRES', 'ZAC Mbao', 'Rond Point Grand Mbao',
    'Keur Mbaye Fall', 'Croisement Petit Mbao', 'Diamaguène',
    'Poste Thiaroye', 'Péage', 'Sortie Croisement Cambérène',
    'Patte d’Oie', 'Marché Grand Yoff', 'Police Grand Yoff',
    'Rond Point Liberté 6', 'Deux voies Liberté 6', 'Rond Point JVC',
    'Terminus Dieuppeul',
  ]),
  route('218', 'Thiaroye', 'Aéroport LSS', 'published_order', [
    'Dépôt Thiaroye', 'SIPS', 'Bountou Pikine', 'Patte d’Oie', 'Foire',
    'VDN', 'Sipres', 'Ancienne piste', 'Ouakam', 'Marché Ouakam',
    'Terminus Ouakam', 'Route des Mamelles', 'Route des Almadies', 'Ngor',
    'Terminus Aéroport LSS',
  ]),
  route('219', 'Daroukhane', 'Ouakam', 'published_order', [
    'Daroukhane', 'Marché Ndiarème', 'Deux voies Notaire',
    'Sapeur pompier Guédiawaye', 'Marché Jeudi Corniche',
    'Hôpital Dalal Diam', 'Case bi', 'Pont Sénégal 92',
    'Collège Hyacinthe Thiandoum', 'Rond Point Liberté 6',
    'Rond Point JVC', 'Rond Point Boulangerie Jaune', 'Immeuble Mariama',
    'Ancienne Piste', 'Hôpital militaire de Ouakam', 'Comico',
    'Cité ASECNA', 'Cité Assemblée', 'Terminus Ouakam',
  ]),
  route('220', 'Rufisque', 'Guédiawaye', 'published_order', [
    'Terminus Rufisque', 'Djoutiba', 'HLM Rufisque', 'SIPRES', 'SEDIMA',
    'Lycée Jaxaay', 'Deux voies', 'Jaxaay', 'Station Keur Massar',
    'Terminus Malika', 'Malika Plage', 'Gadaye', 'Serigne Assane',
    'Marché Boubess', 'Lycée Limamoulaye', 'Terminus Guédiawaye',
  ]),
  route('221', 'Gadaye', 'Almadies', 'published_order', [
    'Terminus Gadaye (Filaos)', 'Corniche Daroukhane', 'Hamo 6',
    'Arrêt Dial Mbaye', 'PAI', 'Hôpital Dalal Diam', 'Case',
    'Police PA', 'Pont Sénégal émergent (92)', 'Route de l’aéroport',
    'Yoff Tonghor', 'Cité ASECNA', 'Rond Point Ngor', 'Ngor village',
    'Terminus Almadies',
  ]),
  route('227', 'Keur Massar', 'Parcelles Assainies', 'published_order', [
    'Terminus Keur Massar', 'Tolou Abdoulaye Wade',
    'Croisement Tivaouane Peulh', 'APIX', 'Malika Plage',
    'Police Wakhinane', 'Hamo 6', 'Arrêt Dial Mbaye',
    'Terminus Guédiawaye', 'Stade Amadou Barry', 'CES Canada',
    'Hôpital Dalal Diam', 'Case bi', 'Croisement 22', 'Eglise PA',
    'Terminus Parcelles',
  ]),
  route('228', 'Rufisque', 'Yenne', 'published_order', [
    'Terminus Rufisque', 'Ville de Rufisque', 'Bargny', 'Diamniadio Yenne',
  ]),
  route('232', 'Baux Maraîchers', 'Aéroport LSS', 'published_order', [
    'Baux Maraîchers', 'Yarakh', 'Cafétéria', 'Hann Maristes',
    'Cours Sainte Marie de Hann', 'Sortie Mariste', 'Usine des eaux',
    'Front de terre', 'Khar Yalla', 'Rond Point Liberté 6',
    'Deux voies vers Camp Leclerc', 'VDN', 'Foire', 'Yoff',
    'Terminus Aéroport LSS',
  ]),
  route('234', 'Jaxaay', 'Leclerc', 'published_order', [
    'Terminus Jaxaay (Mosquée Niakoul Rab)', 'Terminus 56',
    'Deux voies Jaxaay', 'Station Keur Massar', 'Croisement Keur Massar',
    'Fass Mbao', 'Diamaguène', 'Poste Thiaroye', 'Péage',
    'Grand Théâtre', 'Esso Port',
    'Place de l’Indépendance / Avenue Sarraut', 'Leclerc',
  ]),

  route('217', 'Thiaroye', 'Ouakam', 'published_order', [
    'Dépôt Thiaroye', 'SIPS', 'Bountou Pikine', 'Patte d’Oie', 'Foire',
    'VDN', 'Sipres', 'Ancienne piste', 'Ouakam', 'Marché Ouakam',
    'Terminus Ouakam', 'Route des Mamelles', 'Route des Almadies', 'Ngor',
    'Terminus Aéroport LSS',
  ]),
  route('233', 'Baux Maraîchers', 'Palais 1', 'published_order', [
    'Baux Maraîchers', 'Yarakh', 'Cafétéria', 'Hann Maristes',
    'Cours Sainte Marie de Hann', 'Sortie Mariste', 'Usine des eaux',
    'Front de terre', 'Khar Yalla', 'Rond Point Liberté 6',
    'Deux voies vers Camp Leclerc', 'VDN', 'Foire', 'Yoff',
    'Terminus Aéroport LSS',
  ]),
  route('TO1', 'Ouakam', 'Palais 2', 'published_order', [
    'Terminus Ouakam', 'Brioche d’orée Ouakam',
    'Monument de la Renaissance', 'Corniche Ouest', 'Avenue Peytavin',
    'Avenue Pompidou', 'Place de l’Indépendance',
    'Avenue Léopold Sédar Senghor', 'Avenue Nelson Mandela', 'Palais 2',
  ]),
  route('319', 'Liberté 6', 'Ouakam', 'published_order', [
    'Terminus Liberté 6', 'Rond Point Liberté 6', 'Deux voies Liberté 6',
    'Rond point JVC', 'Boulangerie Jaune', 'Immeuble Mariama',
    'Rond point Cheikh Béthio', 'Ancienne Piste', 'IHO', 'Entrée Ouakam',
    'Pharmacie Cité Aviation', 'Pharmacie Mame Seynabou',
    'Case des tout-petits', 'Station Shell', 'Lycée d’excellence privé',
    'Boulangerie N’wely', 'Terminus Ouakam',
  ], '2026-11-10'),
  route('501', 'Palais 2', 'Leclerc', 'published_order', [
    'Terminus Palais 2', 'Avenue Nelson Mandela',
    'Avenue Léopold Sédar Senghor', 'Place de l’Indépendance',
    'Esso Port Embarcadère', 'Terminus Leclerc',
  ], '2026-11-10'),
]

export const getDddPublishedRoute = (line: string) =>
  DDD_PUBLISHED_ROUTES.find((item) => item.line === line) ?? null
