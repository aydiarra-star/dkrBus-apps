/**
 * Paramètres horaires de référence CETUD pour le réseau AFTU.
 * Source : paramètres CETUD transmis et validés par le responsable du projet.
 * Ces valeurs sont des settings réseau ; elles ne remplacent pas une rotation
 * spécifique à une ligne lorsqu'une telle rotation est disponible.
 */
export const AFTU_CETUD_SCHEDULE_SETTINGS = {
  source: {
    authority: 'CETUD',
    status: 'official-reference',
    validatedByProjectOwner: true,
  },
  generalServiceWindow: {
    start: '05:30',
    end: '22:00',
  },
  peakPeriods: [
    { start: '06:00', end: '09:00' },
    { start: '17:00', end: '20:00' },
  ],
  peakIntervalMinutes: {
    min: 10,
    max: 15,
  },
  offPeakIntervalMinutes: {
    min: 25,
    max: 40,
  },
  line90: {
    averageJourneyMinutes: {
      min: 75,
      max: 90,
    },
    outboundStops: 82,
    inboundStops: 82,
  },
} as const
