#!/usr/bin/env node
// Offline, read-only. Never import a review candidate into the passenger graph.
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'

const { values } = parseArgs({ options: { json: { type: 'boolean' }, packet: { type: 'string' } } })
const server = await createServer({ configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null } })
try {
  const { dakarTransferReport, reviewDakarPacket } = await server.ssrLoadModule('/src/admin/dakarTransferDossiers.ts')
  let report
  if (values.packet !== undefined) {
    const result = reviewDakarPacket(JSON.parse(await readFile(values.packet, 'utf8')))
    report = { scope: 'staging-only', directions: [result] }
    if (result.status === 'blocked') process.exitCode = 1
  } else {
    const { dakarNetwork } = await server.ssrLoadModule('/src/routing/dakar.ts')
    const edges = [...dakarNetwork.walking.values()].flat()
    report = { scope: 'documentary-inventory', walkingEdges: edges.length, accessOrEgressOnly: edges.filter(e => e.onlyFor).length, directions: dakarTransferReport(dakarNetwork) }
  }
  if (values.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`${report.scope} · ${report.directions.length} sens étudié(s). Revue seule, aucune activation.`)
    if ('walkingEdges' in report) console.log(`${report.walkingEdges} arcs piétons, dont ${report.accessOrEgressOnly} réservés à l’entrée ou à la sortie, pas aux changements.`)
    for (const r of report.directions) {
      console.log(`\n${r.dossier} · ${r.from.stopId} → ${r.to.stopId} : ${r.status}`)
      console.log(r.observation)
      for (const variant of [r, ...(r.otherServiceDirections ?? [])]) {
        for (const [role, end] of Object.entries(variant.observed ?? {})) if (end) console.log(`  Quai de ${role === 'board' ? 'montée' : 'descente'} : ${end.platformId} · ${end.direction} · ${end.evidence.reference}`)
        for (const f of variant.findings) console.log(`  ${f.code} : ${f.action}`)
      }
      if (r.meters !== null) console.log(`  Chaîne de revue : ${Math.round(r.meters)} m ; sans marches : ${r.walkStepFree}.`)
      console.log(`  Sources documentaires : ${r.sources.join(' ; ')}`)
    }
  }
} catch (error) {
  console.error(`Revue impossible : ${error.message}`)
  process.exitCode = 2
} finally { await server.close() }
