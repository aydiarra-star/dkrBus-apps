#!/usr/bin/env node
// Same user-facing router and ordered selections for each pair of mode filters.
// A result using either mode is not evidence of a result using BOTH.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

export const pairs = ['ddd,aftu','ddd,tata','aftu,tata','ter,ddd','ter,aftu','ter,tata','brt,ddd','brt,aftu','brt,tata']
export function modeReceipt(read) {
  let form, atDakar
  const results = pairs.map(pair => {
    const r = read(pair), d = r.diagnosis
    const ids = JSON.stringify(r.pointIds)
    if (!form) { form = ids; atDakar = r.atDakar }
    const n = r.points*(r.points-1)
    if (ids !== form || r.atDakar !== atDakar || r.snapshotId || r.points !== new Set(r.pointIds).size || r.wholeForm || r.maxChanges !== 3 || r.stepFreeOnly ||
        d.requiredModes.join(',') !== pair || d.withAllRequiredModes > r.includes.anyChange ||
        r.exclusive.whole + Object.values(d.refusalsByCode).reduce((a,b)=>a+b,0) !== n) throw Error(`Rejeu incompatible : ${pair}`)
    return { modes:d.requiredModes, whole:r.exclusive.whole, withBoth:d.withAllRequiredModes, minimumChanges:d.minimumChanges,
      refusals:d.refusalsByCode, movementSha256:r.movementSha256 }
  })
  const points = JSON.parse(form).length
  return { atDakar, points, orderedPairsPerFilter:points*(points-1), selectionSha256:createHash('sha256').update(form).digest('hex'), results }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values:v } = parseArgs({options:{at:{type:'string'},points:{type:'string'}}})
  if (!v.at) throw Error('--at AAAA-MM-JJTHH:MM (Dakar) requis')
  const r = modeReceipt(m => JSON.parse(execFileSync(process.execPath, ['scripts/audit_place_connections.mjs','--matrix','--at',v.at,'--modes',m,
    ...(v.points ? ['--points',v.points] : [])], {encoding:'utf8',maxBuffer:4*1024*1024})))
  console.log(JSON.stringify(r,null,2))
}
