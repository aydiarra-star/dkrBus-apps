import aftu86 from '../data/aftu-86-directions.json'
import aftu87 from '../data/aftu-87-directions.json'
import { DDD_TERMINUS_NOTICES } from '../data/dddTerminusNotices'
import type { BusBoardDirection } from '../domain/busPassageBoard'

export function DddVariantNote({code}: {code: string}) {
  const notice = DDD_TERMINUS_NOTICES.find(n => n.code === code && n.separateVariant)
  if (!notice?.separateVariant) return null
  return <details className="bus-variant-note"><summary>Autre desserte annoncée : {notice.separateVariant.name}</summary>
    {notice.facts.map(f => <p key={f.from}><strong>{f.from} → {f.to}</strong> : plage de service annoncée dans la source ; les heures fixes ne sont pas affichées dans le panneau.</p>)}
    <p>{notice.separateVariant.caveat} Jours et passages aux arrêts non précisés.</p>
    <p><a href={notice.url} target="_blank" rel="noreferrer">Annonce du {notice.publication} · {notice.source}</a></p>
  </details>
}

/** Show the field reference beside the supplied list, not as its rank 1
 * time: the official index and the captured headsign disagree. */
export function AftuReferenceNote({name,d}: {name: string; d: BusBoardDirection}) {
  if (d.clock || d.pointKind !== 'arrêts') return null
  const s = name === 'AFTU 87' ? aftu87 : name === 'AFTU 86' ? aftu86 : null
  if (!s || d.source !== s.sourceLabel) return null
  const side = (['outbound','inbound'] as const).find(k => s.directions[k].waypoints === d.points)
  if (!side) return null
  const ref = s.operatingProfile.lineSpecificFirstDeparture?.[side]
  return <details className="bus-survey-note"><summary>{ref ? `Départ de référence transmis depuis ${ref.terminus}` : 'Pourquoi aucun horaire pour cette variante ?'}</summary>
    {ref ? <p>Repère transmis au projet pour Bambilor ↔ Maristes. Ce n’est ni une heure fixe ni un passage vérifié au rang 1. L’index AFTU indique Bambilor ↔ Mosquée Massalikou Djinane.</p>
      : <p>La liste transmise décrit Yeumbeul ↔ Touba Ngayame, tandis que l’index indique Tournalou Boune ↔ Toubab Dialaw. L’heure de départ de la 86 n’est pas établie.</p>}
    <p>Les plages de pointe du réseau ne donnent pas les heures aux arrêts. <a href="https://aftu-senegal.org/infos-pratiques/" target="_blank" rel="noreferrer">Comparer avec l’index AFTU</a></p>
  </details>
}
