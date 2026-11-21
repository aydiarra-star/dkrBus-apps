/** For documentary review only. Keep the order and spelling from the source.
 * No calendar, headway expansion, platform lookup or passenger-clock output. */
import { clockMinutes } from '../domain/stopPassageCountdown'

export interface ReportedCall { rank: number; stop: string; time: string; dayOffset?: 0 | 1 }
export interface ReportedRun {
  from: string; to: string; referenceDeparture: string; calls: readonly ReportedCall[] | null
}

export function inspectReportedRun(run: ReportedRun) {
  const { calls } = run
  const issues: string[] = []
  const ranks = new Map<string, number[]>()
  let first: number | null = null, previous: number | null = null
  if (calls === null) issues.push('Tableau des arrêts non reçu.')
  else {
    if (calls.length < 2 || calls[0]?.stop !== run.from || calls.at(-1)?.stop !== run.to)
      issues.push('Bornes du tableau à rapprocher de celles du résumé dans ce sens.')
    if (calls[0]?.time !== run.referenceDeparture) issues.push('Départ du tableau différent de la référence.')
    for (const [i, c] of calls.entries()) {
      const label = c.stop, rank = i + 1, minute = clockMinutes(c.time), offset = c.dayOffset ?? 0
      if (c.rank !== rank || !label.trim()) issues.push(`Rang ou libellé à vérifier à la ligne ${rank}.`)
      const seen = ranks.get(label) ?? []; seen.push(rank); ranks.set(label, seen)
      if (minute === null || ![0, 1].includes(offset) || (i === 0 && offset !== 0)) {
        issues.push(`Heure ou jour relatif invalide à la ligne ${rank}.`); continue
      }
      const t = minute + 1440 * offset
      if (!i) first = t
      if (previous !== null && t < previous) issues.push(`Heure décroissante à la ligne ${rank} : vérifier l’original, sans supposer un passage à minuit.`)
      previous = t
    }
  }
  return {
    issues, repeatedLabels: [...ranks].filter(([, rows]) => rows.length > 1),
    durationMinutes: !issues.length && first !== null && previous !== null ? previous - first : null,
  }
}
