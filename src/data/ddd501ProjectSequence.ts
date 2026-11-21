/** Séquences 501 validées explicitement par le responsable du projet à partir
 * de la fiche de l'application DDD fournie : aucun horaire n'est importé. */
export const DDD_501_PROJECT_SEQUENCE = {
  sourceLabel: 'Application mobile DDD · séquences aller/retour fournies et validées par le responsable du projet',
  directions: {
    outbound: {
      origin: 'Port De Dakar',
      destination: 'Terminus Palais 2',
      waypoints: [
        'Port De Dakar',
        'Cercle Mess Des Officiers Colonel Emmanuel Gomis Ou Embarcadère (Port Môle 08)',
        'Poste Ponty',
        'Devant Strass Avenue Ponpidou',
        'Devant Cité Peytavin',
        'Asecna',
        'Prés Du Bureau Regional Pam',
        "Prés De L'Hôpital Le Dantec",
        'Terminus Palais 2',
      ],
    },
    inbound: {
      origin: 'Terminus Palais 2',
      destination: 'Port De Dakar',
      waypoints: [
        'Terminus Palais 2',
        'Hopital Le Dantec',
        'Face Bureau Regional Pam',
        'En Face De La Direction Générale Du Budget',
        'Avenue Ponpidou En Face Alimentation Catim',
        'Cbao Ponty',
        "Place De L'Indépendance Prés De La Cbao",
        "Royal Air Maroc Place De L'Indépendance",
        'Port De Dakar',
      ],
    },
  },
}
