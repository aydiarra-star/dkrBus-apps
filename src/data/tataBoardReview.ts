/** Only place names, no fares. Each list below was read in the indicated
 * direction; a section boundary is not a boarding platform. See the source
 * and recrossings in docs/modeles-passages-bus.md. */
export const TATA_2020_SOURCE = 'https://www.xibaaru.sn/bus-tata-voici-les-nouveaux-tarifs-document/'
// Full outbound wording supplied separately from sectors. In particular the
// previously transcribed 79 stopped at Niacourab, not its terminus.
export const TATA_2020_ADDITIONS: Readonly<Record<string, string>> = {
  '69': 'Terminus Diamalaye|Croisement Dior|Sapeurs-pompiers Parcelles|Croisement 22|Route des Niayes|Rond-point Cambérène (Case Bi)|Croisement Cambérène|Branche Est autoroute|Bountou Pikine|Poste Thiaroye|Croisement Keur Massar|Rond-point Station Shell Keur Massar|Terminus P11 Keur Massar|Terminus Tivaouane Peulh',
  '70': 'Terminus Daroukhane Keur Serigne Assane|SDE Guédiawaye|Marché Boubess|Boulevard des Martyrs|Poste de Guédiawaye|Route des Niayes prolongée|Police Thiaroye|Poste Thiaroye|Diamaguène|Croisement Keur Massar|Rond-point station Shell Keur Massar|Route de Jaxaay|Croisement Mame Abdou|Terminus Jaxaay 2',
  '72': 'Terminus Guédiawaye Cité des Enseignants|Avenue Oumar Foutiyou Tall (Golf Nord)|Route des Niayes|Police Thiaroye|Poste Thiaroye|Route nationale n° 1|Croisement Keur Massar|Keur Mbaye Fall|Croisement ZAC Mbao|ZAC Mbao|Allées Médina ZAC|Cité CAPEC|Route des HLM Rufisque|Rond-point Djouti Ba Rufisque|Boulevard Maurice Guèye|Sonadis Rufisque|Hôpital Youssou Mbargane Diop|Route de Sangalkam|Keur Daouda Sarr|Cité SAGEF|Cité Baba Guisse|Terminus Kounoune (Cité Cardinal Thiandoum)',
  '79': 'Sangalkam|Ndiakhirate|Croisement Niagues|Darou Thioub|Niacourab|Croisement Tivaouane Peulh|Station Keur Massar|Malika|VDN 3|Gadaye|Serigne Assane|Marché Boubess|Préfecture Guédiawaye|Cité Nations Unies (derrière Hôpital Dalal Diam)|Cambérène',
}
export const TATA_RETURN_SECTORS: Readonly<Record<string, string>> = {
  '2':'Petersen|Monument Colobane|Castors|Pont de l’Émergence|Gare Parcelles',
  '3':'Petersen|UCAD|Elton Mermoz|Mamelles|Virage|Yoff',
  '4':'Petersen|Canal IV|Ancienne Piste|Foire|Yoff',
  '5':'Petersen|Colobane station Elton|Rond-point station Castors|Garage Patte d’Oie|Terminus Parcelles',
  '24':'Fann|Jet d’Eau|Castors et Cité des Eaux|SERAS|Guédiawaye',
  '25':'Petersen|Canal 4|Ancienne Piste|Foire|Parcelles Assainies',
  '26':'Poste Thiaroye|Tally Boumack|Hôpital Dalal Diam|Pharmacie Golf|Gare Parcelles',
  '27':'Petersen|Colobane|Patte d’Oie|SERAS|Rue 10 Pikine|Terminus Guédiawaye',
  '28':'Petersen|Colobane|Patte d’Oie|Case Ba|Golf|Guédiawaye (Hamo 6)',
  '29':'Petersen|UCAD|Ancienne Piste|Patte d’Oie|Case Ba|Cambérène',
  '30':'Colobane|Liberté 5|Avant pont stade (92)|Case Ba|Canada|Gadaye Guédiawaye',
  '31':'Sahm|Score Liberté|Patte d’Oie|Croisement Cambérène|Pikine Texaco',
  '32':'Serigne Assane|Cambérène|Cité des Eaux|Colobane|Sahm',
  '33':'Serigne Assane|Pharmacie Golf|Patte d’Oie|Rond-point Castors|Colobane',
  '34':'Lat-Dior|Abass Ndao|Score|Liberté VI|Nord Foire',
  '35':'Ngor|Aéroport|SDE Yoff|Patte d’Oie N. Chouhair|Croisement Cambérène|Station Icotaf',
  '38':'SHAM|Cité des Eaux|Patte d’Oie|Case Ba|Cité des Enseignants',
  '39':'Diamalaye|Pont de l’Émergence|Station Castors|Canal IV|Lat Dior',
  '40':'Petersen|Colobane|Maristes|Yarakh Magasin|Poste Thiaroye|Fass Mbao|SIPRES',
  '41':'Guédiawaye|Canada|Bountou Pikine|Yarakh CAPA|Rond-point SCOA|Petersen',
  '42':'Ouakam|Ancienne Piste|Foire|Case Bi|Pharmacie Golf|Guédiawaye',
  '43':'Thierno Ndiaye|Texaco|Cambérène|Échangeur Hann|Rue 10 Grand Dakar|Expresso|Ouakam',
  '44':'Ouakam|Ancienne Piste|Foire|Stade LSS|Bountou Pikine|Poste Thiaroye|Fass Mbao|Grand Mbao',
  '45':'Parcelles Église|Pharmacie Golf|Préfecture Guédiawaye|Serigne Assane|Station Yeumbeul|Tournal Boune|Station Keur Massar|Rond-point Pénitence|Marine Française|Kounoune Ngalam',
  '46':'Lat Dior|Stade Demba Diop|Rond-point Liberté VI|SERAS|Pikine rue 10|Serigne Assane',
  '47':'Almadies|Aéroport|SDE Yoff|Nabil Choucair|UCAD|Lat Dior',
  '48':'Lat Dior|Colobane|Cambérène|Poste Thiaroye|Keur Massar|Dioutyba|Cité Serigne Mansour',
  '49':'Ngor|Ouakam|Mermoz|CAPA|Marché Central|Rond-point Tribunal|Gadaye',
  '51':'Gare Baux Maraîchers|Police Thiaroye|Tally Diallo|Mbedou Fass|Station Keur Massar|Jaxaay',
  '53':'Sébikhotane|Bargny|Sococim|Sonadis|Keur Ndiaye Lô|Cité Doudou Basse|Niagues|Cité SAFCO|Keur Massar',
  '54':'UCAD|Elton Colobane|CAPA|Poste Thiaroye|Rail Ba Fass Mbao|Keur Massar MTOA',
  '55':'Petersen|Colobane|Patte d’Oie|Cité Lobatt Fall|Poste Thiaroye|Croisement Keur Massar|Rufisque',
  '56':'Petersen|Colobane|Bountou Pikine|Poste Thiaroye|Croisement Keur Massar|Station Keur Massar|Keur Massar U 11',
  '57':'Liberté 6|Patte d’Oie|Cité Lobatt Fall|Poste Thiaroye|Croisement Keur Massar|Djiouti Ba|Gouye Mouride Rufisque',
  '58':'SHAM|École Normale|Castors|Poste Thiaroye|Fass Mbao',
  '59':'Zone de recasement|Station MTOA|Tournal Yeumbeul|Tally Diallo|Canada|Golf|Stade Amitié',
  '60':'Bargny|Sococim|Dioutiba|Croisement Keur Massar|Poste Thiaroye|Cambérène|Patte d’Oie|Colobane',
  '61':'Almadies|Aéroport|SDE Yoff|Nabil Choucair|Cité Lobal Fall|Poste Thiaroye|Route nationale|Keur Massar',
  '62':'Penc Mi|HLM|Cité des Eaux|Bountou Pikine|Poste Thiaroye|Croisement Keur Massar|Dioutiba|Arrêt Chérif',
  '65':'Jaxaay|Station Keur Massar|Croisement Keur Massar|Poste Thiaroye|Marché central aux poissons|CAPA|Colobane',
  '66':'Gorom|Sangalkam|Keur Ndiaye Lô|Rufisque|Rufsak|Fass Mbao|Cinéma Thiaroye|Croisement Cambérène|Rond-point Patte d’Oie|Nabil Choukaïr|Yoff',
  '67':'Ouakam|Elton|Jet d’Eau|Cité des Eaux|Yarakh Cafétariat|Poste Thiaroye|Croisement Keur Massar|Djouti Ba|Rufisque Bata',
  '68':'Yeumbeul|Station Keur Massar|Croisement Keur Massar|Dioutiba|Sococim|Bargny|Diamniadio|Sébikhotane',
  '69':'Namora|Terminus Keur Massar|Station Keur Massar|Nationale|Poste Thiaroye|Pikine|Case Ba|Diamalaye',
  '71':'Claudel|Garage Guédiawaye|Patte d’Oie|Cité Lobatt Fall|Poste Thiaroye|Croisement Keur Massar|Maison de la Femme Keur Massar',
  '74':'Tawfeex|Darou Salam|Station Keur Massar|Jaxaay|SOCABEG|Dioutiba|Poste Courant|Bargny',
  '70':'Jaxaay|Station Keur Massar|Croisement Keur Massar|Poste Thiaroye|Pikine (Tally Boumack)|Guédiawaye (Serigne Assane)',
  '72':'Kounoune|Keur Ndiaye Lô|Poste Courant|Dioutiba|ZAC Mbao|Croisement Keur Massar|Fass Mbao|Poste Thiaroye|Tally Boumack|Cité Enseignants',
  '73':'Lac Rose|Croisement Niagues|Niacourab Cité SAFCO|Station Keur Massar|Mbédou Fass|Tournal Boune|Croisement Tally Diallo|Poste Thiaroye',
  '75':'Colobane|Cité des Eaux|Croisement Cambérène|Bountou Pikine|Thiaroye Kao|Malika',
  '76':'Cité Assurance|Station Keur Massar|Mbédou Fass|SICAP Mbao|Croisement Cambérène|Patte d’Oie|SIPRES',
  '77':'Liberté V|Cité des Eaux|Bountou Pikine|Poste Thiaroye|Croisement Keur Massar|Dioutiba|Tacco',
  '79':'Cambérène|Préfecture Guédiawaye|Gadaye|Malika Terminus|Station Keur Massar|Croisement Tivaouane Peulh|Croisement Niagues|Sangalkam',
  '80':'Darou Thioub|Poste de santé Niacourab|Croisement Tivaouane Peulh|Station Keur Massar|Station Yeumbeul|Police Thiaroye|Pharmacie Golf|Case Ba|Diamalaye',
  '81':'Gare des Baux Maraîchers|Poste Thiaroye|Fass Mbao|Tournal Yeumbeul|Malika|Station Keur Massar|Croisement Tivaouane Peulh|Tivaouane Peulh|Tawfeex',
  '82':'Lat Dior|Poste Médine|Centenaire|Poste Thiaroye|SICAP Mbao|Arrêt 58|Comico',
}

// Independent columns, transcribed in print order. These are fare-stage names,
// not stop calls. The duplicate « SECTION 6 » on the 83 is not a duplicate place.
const stages = (side: 'outbound' | 'inbound', places: string) => ({ side, points: places.split('|') })
export const TATA_UNTIMED_STAGES: Readonly<Record<string, readonly { side: 'outbound' | 'inbound'; points: string[] }[]>> = {
  // Different termini from the main description. Do not use these to fill
  // a missing return of that description (e.g. Liberté VI is not Liberté 5).
  '1': [stages('outbound','LAT DIOR|SHAM|LIBERTE VI|GOUYE – GA'), stages('inbound','GOUYE – GA|Liberté VI|SHAM|LAT DIOR')],
  '36': [stages('outbound','SERIGNE ASSANE|PHARMACIE GOLF|CASE BA|BCAO|YOFF – AEROPORT|NGOR VILLAGE'),
    stages('inbound','NGOR VILLAGE|AEROPORT|BCAO|CASE BA|PHARMACIE GOLF|SERIGNE ASSANE')],
  '37': [stages('outbound','APIX|CITE SOTRAC|STATION KEUR MASSAR|MALIKA PLAGE|ROND-POINT GADAYE|POLICE GUEDIAWAYE|PIKINE RUE 10|PONT HANN|LYCEE KENNEDY|CLAUDEL'),
    stages('inbound','UCAD CLAUDEL|COLOBANE LYCÉE KENNEDY|PONT HANN|PIKINE RUE 10|POLICE GUEDIAWAYE|ROND-POINT GADAYE|MALIKA PLAGE|STATION KEUR MASSAR|CITE SOTRAC|APIX')],
  '50': [stages('outbound','PETERSEN|COLOBANE|CROISEMENT CAMBERENE|BOUNTOU PIKINE|CROISEMENT TALLY DIALLO|TALLY BOUKHONK|MALIKA'),
    stages('inbound','MALIKA|TALLY BOUKHONK|CROISEMENT TALLY DIALLO|BOUNTOU PIKINE|CROISEMENT CAMBERENE|COLOBANE|PETERSEN')],
  '52': [stages('outbound','BAUX-MARAICHERS|TALLY BOUMACK|STATION TOTAL YEUMBEUL|KAW MONTAGNE|SHELL KEUR MASSAR|JAXAAY 2'),
    stages('inbound','JAXAAY 2|STATION KEUR MASSAR|TALLY BOU KHONK|TOURNAL TALLY DIALLO|TALLY BOUMACK|BAUX-MARAICHERS')],
  '63': [stages('outbound','STADE AMITIE|CASE BI|CITE LOBATT FALL|POSTE THIAROYE|CROISEMENT K. MASSAR|DJOUTI BI|RUFISQUE ARAFAT'),
    stages('inbound','RUFISQUE ARAFAT|DJOUTI BI|CROISEMENT K. MASSAR|POSTE THIAROYE|CITE LOBATT FALL|CASE BI|STADE AMITIE')],
  '78': [stages('outbound','DIAMAGUENE|POLICE THIAROYE|PHARMARCIE NOUVELLE|PHARMACIE GOLF|PONT SENEGAL 92|LIBERTE VI'),
    stages('inbound','LIBERTE VI|PONT SENEGAL 92|PHARMACIE GOLF|PHARMARCIE NOUVELLE|POLICE THIAROYE|DIAMAGUENE')],
  '83': [{ side: 'inbound', points: ['ZONE DE CAPTAGE', 'CASE BA', 'ROND-POINT MALIBU', 'MALIKA PLAGE', 'STATION KEUR MASSAR', 'SIPRES', 'DIOUTIBA', 'JAXAAY'] },
    stages('outbound','ARAFAT|DIOUTIBA|SIPRES|STATION KEUR MASSAR|MALIKA PLAGE|ROND-POINT MALIBU|CASE BA|ZONE DE CAPTAGE')],
  '84': [
    { side: 'outbound', points: ['JAXAAY', 'CITE ASSURANCE', 'KEUR MBAYE FALL', 'FASS MBAO', 'POSTE THIAROYE', 'BOUNTOU PIKINE', 'NABIL CHOUCAIR', 'CICES', 'DIRECTION SONATEL', 'UCAD'] },
    { side: 'inbound', points: ['UCAD', 'DIRECTION SONATEL', 'CICES', 'NABIL CHOUCAIR', 'BOUNTOU PIKINE', 'POSTE THIAROYE', 'FASS MBAO', 'KEUR MBAYE FALL', 'CITE ASSURANCE', 'JAXAAY'] },
  ],
}

/** Only two entries in this secondary document give a sequence of places.
 * No calendar, travel time or certainty about continuity with today's service. */
export const TATA_DOCUMENT_SOURCE = 'https://fr.scribd.com/document/840812776/ligne-tata'
export const TATA_DESCRIPTIONS: Readonly<Record<string, ReturnType<typeof stages> & { scope?: 'other-axis' }>> = {
  '1': stages('inbound', 'Terminus HLM Grand Yof (Face Autoroute)|Scat Urbam|Liberté 6|Derklé|Liberté 4|Rond Point Jet d’eau|Bourguiba|Grand Dakar|Fass Médina|Sham|Avenue Blaise Diagne|Terminus Lat Dior'),
  '53': { scope: 'other-axis', ...stages('outbound', 'Lac Rose|Croisement Niaye|Ndiakhirate|Route Des Niayes|Sonadis Rufisque|Route Nationale 1 (RN1)|Bargny|Diamniadio|Hôpital Des Enfants Diamniadio|Sébikotane') },
}
