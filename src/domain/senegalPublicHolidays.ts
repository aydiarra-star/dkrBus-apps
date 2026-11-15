/**
 * Calendrier légal sénégalais utilisé pour sélectionner les horaires TER.
 *
 * Les dates religieuses sont déterminées par l'observation lunaire et doivent
 * être confirmées chaque année par la CONACOC. Ne pas extrapoler un calendrier
 * lunaire : ajouter les dates confirmées dans cette table après publication.
 *
 * Référence de la liste 2026 : loi n° 74-52 modifiée et dates CONACOC 2026,
 * recoupées au 12 novembre 2026. Les années absentes ne sont pas supposées
 * contenir zéro jour férié : elles nécessitent une mise à jour du calendrier.
 */
const SENEGAL_PUBLIC_HOLIDAYS: Readonly<Record<number, readonly string[]>> = {
  2026: [
    '2026-01-01', // Jour de l'An
    '2026-03-21', // Korité (date CONACOC)
    '2026-04-04', // Fête de l'Indépendance
    '2026-04-06', // Lundi de Pâques
    '2026-05-01', // Fête du Travail
    '2026-05-14', // Ascension
    '2026-05-25', // Lundi de Pentecôte
    '2026-05-28', // Tabaski (date CONACOC)
    '2026-06-25', // Tamkharit (date CONACOC)
    '2026-08-02', // Grand Magal de Touba (date confirmée)
    '2026-08-15', // Assomption
    '2026-08-25', // Maouloud (date CONACOC)
    '2026-11-01', // Toussaint
    '2026-12-25', // Noël
  ],
}

/** Retourne la date civile de Dakar (UTC+00) au format YYYY-MM-DD. */
export function dakarCalendarDate(utcNow: number): string | null {
  if (!Number.isFinite(utcNow)) return null
  return new Date(utcNow).toISOString().slice(0, 10)
}

/** Vrai uniquement pour une date fériée présente dans le calendrier confirmé. */
export function isSenegalPublicHoliday(utcNow: number): boolean {
  const date = dakarCalendarDate(utcNow)
  if (!date) return false
  const year = Number(date.slice(0, 4))
  return SENEGAL_PUBLIC_HOLIDAYS[year]?.includes(date) ?? false
}

/** Indique si l'année dispose d'une liste de jours fériés confirmés intégrée. */
export function hasSenegalPublicHolidayCalendar(utcNow: number): boolean {
  const date = dakarCalendarDate(utcNow)
  if (!date) return false
  return Object.prototype.hasOwnProperty.call(SENEGAL_PUBLIC_HOLIDAYS, Number(date.slice(0, 4)))
}
