import { useEffect, useState } from 'react'

/** A display clock, not a departure generator. One wake-up for the visible
 * panel, never a timer per stop or a new journey query on each tick. */
export function usePassageClock(active = true) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    let timer: number | undefined
    function wake() {
      window.clearTimeout(timer)
      if (document.hidden) return
      const time = Date.now()
      setNow(time)
      timer = window.setTimeout(wake, 1000 - time % 1000)
    }
    wake()
    document.addEventListener('visibilitychange', wake)
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', wake) }
  }, [active])
  return now
}

/** The small mm:ss value refines (does not replace) the existing rounded
 * green minutes. Never round the advertised minutes back into a deadline. */
export function PassageClock({ atMs, now }: { atMs: number; now: number }) {
  const seconds = Math.ceil((atMs - now) / 1000)
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return null
  const m = Math.floor(seconds / 60), s = seconds % 60
  return <time className="passage-remaining" dateTime={`PT${seconds}S`} aria-label={`${m} min ${s} s`}>
    {m}:{String(s).padStart(2, '0')}
  </time>
}
