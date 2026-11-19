import { useEffect, useState } from 'react'
import { timedRequest } from '../domain/http'
import { dakarNetwork, localPassengerData } from '../routing/dakar'
import { admitPassengerEdition } from '../routing/passengerEdition'
import type { Network } from '../routing/model'

/** Fetch geometry once per revision/day, revalidate without resending it on every OD. Never send the traveller’s
 * location, never persist an edition, never mix days/versions during a race. */
export function usePassengerNetwork(snapshot: string | undefined, day: string, rediscover?: () => void) {
  const [reply, setReply] = useState<{ key: string; net: Network | null }>()
  const key = snapshot && /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${snapshot}/${day}` : undefined
  useEffect(() => {
    if (!key || !snapshot) { setReply(undefined); return }
    let previous: { net: Network; revision: string } | undefined
    let active: AbortController | undefined
    const refresh = async () => {
      active?.abort()
      const controller = new AbortController(); active = controller
      try {
        const params = new URLSearchParams({ snapshot, date: day })
        if (previous) params.set('known_revision', previous.revision)
        const next = await timedRequest(`/api/passenger-network?${params}`, { signal: controller.signal }, async r => {
          if (!r.ok) {
            if (rediscover && (r.status === 409 || r.status === 404)) {
              const reason = await r.json()
              if (!controller.signal.aborted && (reason?.error === 'SNAPSHOT_CHANGED' || reason?.error === 'NOT_PUBLISHED')) rediscover()
            }
            return
          }
          if (Number(r.headers?.get('Content-Length')) > 6_000_000) return
          const v = await r.json()
          if (!v || v.snapshot_id !== snapshot || v.date !== day || !/^[0-9a-f]{64}$/.test(v.revision)) return
          if (v.unchanged === true) return previous && previous.revision === v.revision ? previous : undefined
          const net = admitPassengerEdition(v, snapshot, day, localPassengerData)
          return net ? { net, revision: String(v.revision) } : undefined
        })
        if (!controller.signal.aborted) { previous = next; setReply({ key, net: next?.net ?? null }) }
      } catch {
        if (!controller.signal.aborted) { previous = undefined; setReply({ key, net: null }) }
      }
    }
    void refresh()
    const wake = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', wake)
    const timer = setInterval(wake, 60_000)
    return () => { active?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', wake) }
  }, [key, snapshot, day, rediscover])
  const current = key && reply?.key === key ? reply : undefined
  return { network: current?.net ?? dakarNetwork,
    notice: !key ? '' : !current ? 'Lecture des dessertes et correspondances publiées…' : current.net ? 'Réseau publié du jour intégré au calcul sur tracés vérifiés.' : 'Complément publié indisponible pour cette date. Seules les dessertes locales vérifiées sont utilisées.' }
}
