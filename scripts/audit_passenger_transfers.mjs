#!/usr/bin/env node
// Offline, read-only. Never import a review candidate into the passenger graph.
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'

const { values } = parseArgs({ options: { json: { type: 'boolean' }, markdown: { type: 'boolean' }, packet: { type: 'string' }, at: { type: 'string' } } })
const at = values.at === undefined ? undefined : Date.parse(`${values.at}Z`) / 1000
if (at !== undefined && (!Number.isFinite(at) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(values.at) || new Date(at*1000).toISOString().slice(0,16) !== values.at)) throw Error('--at AAAA-MM-JJTHH:MM (Dakar) attendu.')
const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null } })
try {
  const { dakarTransferReport, reviewDakarPacket } = await server.ssrLoadModule('/src/admin/dakarTransferDossiers.ts')
  let report
  if (values.packet !== undefined) {
    const result = reviewDakarPacket(JSON.parse(await readFile(values.packet, 'utf8')), at)
    report = { scope: 'staging-only', directions: [result] }
    if (result.status === 'blocked' || (at !== undefined && result.timed?.status !== 'DATED_WITNESS')) process.exitCode = 1
  } else {
    const { dakarNetwork } = await server.ssrLoadModule('/src/routing/dakar.ts')
    const edges = [...dakarNetwork.walking.values()].flat()
    report = { scope: 'documentary-inventory', walkingEdges: edges.length, accessOrEgressOnly: edges.filter(e => e.onlyFor).length, directions: dakarTransferReport(dakarNetwork,at) }
  }
  if (at !== undefined) report.atDakar = values.at
  if (values.markdown) {
    if (values.packet || values.json || at === undefined) throw Error('--markdown demande un inventaire daté, sans --json ni --packet.')
    const bySite = Map.groupBy(report.directions, r => r.dossier)
    const all = report.directions.flatMap(r => [r, ...r.otherServiceDirections])
    const blocked = all.filter(r => r.timed.status === 'BLOCKED_BEFORE_TIMETABLE').length
    const out = ['# Correspondances : pièces par sens', '',
      `Calculateur local au ${values.at.replace('T',' à ')} (Dakar), sans édition opérateur : **${bySite.size} dossiers, ${report.directions.length} sens, ${all.length} évaluations, ${blocked} bloquées avant horaire**. Une même gare peut avoir plusieurs directions de service. Les entrées/sorties seules (${report.accessOrEgressOnly} arcs) ne sont pas des chemins de correspondance.`, '',
      'Chaque rubrique sépare descente, montée et droit de passage. Si les portes sont effectivement au même endroit dans le même site, fournir à la place du chemin une autorisation **pour ces deux appels orientés** et un délai minimal. Sinon mesurer chaque segment, traversée et contrôle dans le sens indiqué. Lorsque l’examen s’arrête avant l’horaire, il reste aussi à fournir les deux courses de la même date, heures aux appels et temps pour les joindre. Un blocage dans le calculateur ne prouve pas que le voyage est impossible sur place.', '',
      '[Enquête ciblée, fiches sources et demande aux exploitants](enquete-correspondances.md). Régénérer : `node scripts/audit_passenger_transfers.mjs --at '+values.at+' --markdown`.', '']
    for (const [id, rows] of bySite) {
      out.push(`## ${id}`, '')
      for (const r of rows) {
        out.push(`### Descendre : ${r.from.name} → monter : ${r.to.name}`, '', r.observation, '')
        for (const v of [r,...r.otherServiceDirections]) {
          out.push(`- **${r.from.mode.toUpperCase()} → ${r.to.mode.toUpperCase()}** · \`${r.from.stopId}\` → \`${r.to.stopId}\` · \`${v.timed.status}\`.`)
          for (const [role, end] of Object.entries(v.observed)) if (end) out.push(`  - Déjà identifié (${role==='board'?'montée':'descente'}) : ${end.platformId}, ${end.direction} · ${end.evidence.reference}.`)
          for (const f of v.findings) out.push(`  - ${f.action}`)
        }
        out.push('')
      }
      out.push('Sources : '+rows[0].sources.map((s,i)=>`[${i+1}](${s.startsWith('https://')?s:'../'+s})`).join(' · ')+'.','')
    }
    console.log(out.join('\n'))
  } else if (values.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`${report.scope} · ${report.directions.length} sens étudié(s). Revue seule, aucune activation.`)
    if ('walkingEdges' in report) console.log(`${report.walkingEdges} arcs piétons, dont ${report.accessOrEgressOnly} réservés à l’entrée ou à la sortie, pas aux changements.`)
    for (const r of report.directions) {
      console.log(`\n${r.dossier} · ${r.from.stopId} → ${r.to.stopId} : ${r.status}`)
      console.log(r.observation)
      for (const variant of [r, ...(r.otherServiceDirections ?? [])]) {
        for (const [role, end] of Object.entries(variant.observed ?? {})) if (end) console.log(`  Quai de ${role === 'board' ? 'montée' : 'descente'} : ${end.platformId} · ${end.direction} · ${end.evidence.reference}`)
        if (variant.timed) console.log(`  Témoin calculé à ${values.at} : ${JSON.stringify(variant.timed)}`)
        for (const f of variant.findings) console.log(`  ${f.code} : ${f.action}`)
      }
      if (r.samePosition) console.log(`  Même emplacement du quai, sans marche : délai minimal ${r.samePosition.minimumSeconds} s ; ${r.samePosition.evidence.reference}.`)
      if (r.meters !== null) console.log(`  Chaîne de revue : ${Math.round(r.meters)} m ; sans marches : ${r.walkStepFree}.`)
      console.log(`  Sources documentaires : ${r.sources.join(' ; ')}`)
    }
  }
} catch (error) {
  console.error(`Revue impossible : ${error.message}`)
  process.exitCode = 2
} finally { await server.close() }
