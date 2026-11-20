import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import { coverageClasses, linesCoverage } from '../domain/busReadingCoverage'
import type { BusFamily } from '../domain/busPassageBoard'

// The pinned catalogue doesn't change every second with the display clock.
const counts = (['ddd','aftu','tata'] as const).map(family => ({ family, row:linesCoverage(BUS_BOARD_LINES[family]) }))
const totals = coverageClasses.map(k => counts.reduce((n,{row})=>n+row[k],0))
const fmt = new Intl.NumberFormat('fr-FR')
export function BusCoverageNote({family}: {family: BusFamily}) {
  const {row} = counts.find(r=>r.family === family)!
  return <details className="bus-coverage"><summary>Quels arrêts ont des horaires ?</summary>
    <p><strong>{family.toUpperCase()}</strong> : {Object.values(row).some(Boolean) ? `${fmt.format(row.couvert)} rangs couverts, ${fmt.format(row.partiel)} partiels, ${fmt.format(row['non documenté'])} sans heure.` : 'aucun rang d’arrêt attribué. Les repères et secteurs ne sont pas des arrêts horodatés.'}</p>
    <p>Sur les {fmt.format(totals.reduce((a,b)=>a+b,0))} rangs d’arrêt des trois réseaux : {fmt.format(totals[0])} couverts, {fmt.format(totals[1])} partiels et {fmt.format(totals[2])} sans heure.</p>
    <p>« Couvert » : toutes les colonnes de la fiche à ce rang, pour chaque jour habituel de service. « Partiel » : au moins une heure, mais un jour ou une partie de la journée manque, ou il ne s’agit que d’un relevé isolé. Le décompte vert n’apparaît que si le prochain passage est documenté. Les estimations et les liens externes ne comptent pas.</p>
  </details>
}
