import { useEffect, useState } from 'react'
import { timedRequest } from '../domain/http'
import { parseStopsPayload } from '../domain/published'
import { publishedStopOptions, type StopOption } from '../domain/stops'

const EMPTY: readonly StopOption[] = []

/** Search the whole active snapshot, not just the last stops seen in Explorer
 * or around the GPS fix. Each form field owns its request and cancels it when
 * closed, unmounted, retyped, or pointed at another snapshot. */
export function usePublishedStopSearch(text: string, snapshotId?: string) {
  const query = text.trim()
  const [result, setResult] = useState<{ query: string; snapshotId: string; options: StopOption[] | null }>()
  const enabled = Boolean(snapshotId && query && query.length <= 120)
  useEffect(() => {
    if (!enabled || !snapshotId) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const options = await timedRequest(`/api/stops/search?q=${encodeURIComponent(query)}&limit=20`, { signal: controller.signal }, async response => {
          if (!response.ok) return null
          const raw = await response.json()
          if (raw?.snapshot_id !== snapshotId) return null
          const parsed = parseStopsPayload(raw)
          return parsed.ok ? publishedStopOptions(parsed.value) : null
        })
        if (!controller.signal.aborted) setResult({ query, snapshotId, options })
      } catch {
        if (!controller.signal.aborted) setResult({ query, snapshotId, options: null })
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [enabled, query, snapshotId])
  const current = enabled && result?.query === query && result.snapshotId === snapshotId ? result : undefined
  return { options: current?.options ?? EMPTY, loading: enabled && !current, unavailable: current?.options === null }
}
