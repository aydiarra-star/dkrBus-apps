#!/usr/bin/env node
// Independent denominator: ordered pairs of directional stop sheets, never
// appended to the geographic form or counted as whole journeys.
import { parseArgs } from 'node:util'
import { createServer } from 'vite'
const { values } = parseArgs({ options: { at: { type:'string' } } })
const at = values.at, departAt = Date.parse(at+'Z') / 1000
if (!Number.isFinite(departAt) || new Date(departAt*1000).toISOString().slice(0,16) !== at) throw Error('--at AAAA-MM-JJTHH:MM (Dakar) requis')
const server = await createServer({ configFile:false,appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null,ws:false} })
try {
  const { timetableStops } = await server.ssrLoadModule('/src/data/maristesTimetables.ts')
  const { compareTimetables } = await server.ssrLoadModule('/src/routing/timetableAdvice.ts')
  const { dakarClock } = await server.ssrLoadModule('/src/routing/presentation.ts')
  const pairs = [], counts = { direct:0, change:0, unavailable:0 }
  for (const from of timetableStops) for (const to of timetableStops) if (from !== to) {
    const r = compareTimetables(from.id,to.id,{departAt})
    if (r.kind === 'unavailable') { counts.unavailable++; continue }
    counts[r.gapSeconds === null ? 'direct' : 'change']++
    pairs.push({from:from.id,to:to.id,legs:r.legs.map(l => [l.line,l.from,l.to,dakarClock(l.start),dakarClock(l.end)]),gapSeconds:r.gapSeconds})
  }
  console.log(JSON.stringify({atDakar:at,scope:'horaires seuls, sans carte ni accès',stopIds:timetableStops.map(s=>s.id),counts,pairs},null,2))
} finally { await server.close() }
