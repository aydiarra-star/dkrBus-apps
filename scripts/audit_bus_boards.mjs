#!/usr/bin/env node
// Offline: exercise exactly the rows Explorer can open, not an inventory of
// potential schedules. Keep these display counts OUT of journey reachability.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'
import { busInventory } from './bus_inventory.mjs'

const digest = v => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const hhmm = t => new Date(t).toISOString().slice(11,16)
const { values } = parseArgs({ options: { markdown: { type: 'string' }, json: { type: 'string' } } })
const app = await createServer({ logLevel: 'error', configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null, ws: false } })
try {
  const load = p => app.ssrLoadModule(p), inventory = await busInventory(load)
  const { BUS_BOARD_LINES } = await load('/src/domain/busBoardCatalog.ts')
  const { default: profiles } = await load('/src/data/bus-board-profiles.json')
  const seenProfiles = new Set()
  const { BUS_BOARD_MODEL, boardDay, busPassage } = await load('/src/domain/busPassageBoard.ts')
  const day = Date.parse('2026-11-19T00:00Z'), now = day + 19*3600_000, report = { model: BUS_BOARD_MODEL, at: new Date(now).toISOString(), totals: {}, lines: [] }
  for (const family of ['ddd','aftu','tata']) {
    const lines = BUS_BOARD_LINES[family], inv = inventory.lines.filter(r => r.network === family)
    assert.deepEqual(lines.map(l => l.code).sort(), inv.map(l => l.code).sort(), family)
    const totals = report.totals[family] = { codes: lines.length, withModel: 0, twoStopLists: 0, twoListsIncludingLandmarks: 0, modelDirections: 0, stopOccurrences: 0, landmarkOccurrences: 0, originOnly: 0, activeAt19: 0 }
    for (const l of lines) {
      const directions = [], ids = new Set(), stopSides = new Set(), sides = new Set()
      for (const d of l.directions) {
        const id = JSON.stringify([l.key,d.source,d.label,d.from,d.to]); assert(!ids.has(id), id); ids.add(id)
        const compiled = boardDay(d, day), ranks = d.points.length, m = d.clock
        let active = 0, example = null, duration = null, terminalDurations = []
        if (m) {
          assert.equal(m.kind, 'model'); assert(compiled, id); assert(m.originBasis && m.offsetBasis && d.source)
          if (m.offsetBasis.includes('historique') && d.pointKind === 'arrêts') {
            const profileKey = `${l.key}:${d.label === 'Aller' ? 'outbound' : 'inbound'}`
            assert.equal(digest(d.points),profiles[profileKey]?.sequenceSha256, profileKey)
            seenProfiles.add(profileKey)
          }
          totals.modelDirections++; duration = ranks > 1 ? m.offsetsMs.at(-1) / 60000 : null
          if (ranks > 1) terminalDurations = [...new Set(compiled.profiles.filter(p => p.today?.length).map(p => p.offsets.at(-1)/60000))].sort((a,b) => a-b)
          const counted = d.pointKind === 'arrêts' ? 'stopOccurrences' : d.pointKind === 'départ seul' ? 'originOnly' : 'landmarkOccurrences'
          totals[counted] += ranks
          const side = d.label.split(' · ')[0]
          if (ranks > 1 && ['Aller','Retour'].includes(side)) { sides.add(side); if (counted === 'stopOccurrences') stopSides.add(side) }
          for (const [index, p] of d.points.entries()) {
            assert(p.trim(), id)
            const result = busPassage(compiled,index,now)
            if (result.state === 'active') {
              assert(result.minutes >= 1 && result.at > now); active++
              if ([0, Math.floor(ranks/2), ranks-1].includes(index)) (example ??= []).push(`${index+1}: ${result.minutes}`)
            }
            // Compare binary lookup with the enumerated runs at a boundary;
            // no invented off-grid final origin, including the terminal call.
            const calls = compiled.profiles.flatMap(p => p.today.map(t => t+p.offsets[index])).sort((a,b) => a-b)
            assert(calls.length, id)
            const probe = calls[Math.floor(calls.length/2)]
            assert.equal(busPassage(compiled,index,probe).at, calls.find(t => t > probe), id)
            assert.equal(busPassage(compiled,index,calls.at(-1)).state, 'finished', id)
          }
        }
        totals.activeAt19 += active
        directions.push({ label: d.label, from: d.from, to: d.to, kind: d.pointKind, ranks, active, example, duration, terminalDurations, peakDuration: m?.peakOffsetsMs ? m.peakOffsetsMs.at(-1)/60000 : null, sequence: digest(d.points), clockSha256: digest(m), week: m?.week ?? null,
          originSlots: compiled ? [...new Set(compiled.profiles.flatMap(p => p.today))].sort((a,b)=>a-b) : [],
          source: d.source, phase: m?.originBasis ?? null, profile: m?.offsetBasis ?? null, reason: d.reason ?? (d.sourceHours && !m ? 'Grille transcrite (hors modèle)' : null) })
      }
      if (directions.some(d => d.profile)) totals.withModel++
      if (sides.size === 2) totals.twoListsIncludingLandmarks++
      if (stopSides.size === 2) totals.twoStopLists++
      if (l.aliasOf) assert(lines.some(other => other.code === l.aliasOf && !other.aliasOf && other.directions.some(d => d.clock)), l.code)
      report.lines.push({ family, code: l.code, ...(l.aliasOf && { aliasOf:l.aliasOf }), directions })
    }
  }
  assert.deepEqual([...seenProfiles].sort(),Object.keys(profiles).sort())
  report.digest = digest(report.lines)
  const md = ['# Passages bus dans Explorer — contrôle du 19 novembre à 19 h à Dakar', '',
    `Modèle \`${BUS_BOARD_MODEL}\`. [Hypothèses, sources et reproduction](modeles-passages-bus.md). Un **rang** est une occurrence : deux libellés identiques ne sont jamais dédoublonnés. Ces estimations ne prouvent ni un quai, ni une course du jour, ni une correspondance. Les éditions datées éventuelles sont affichées à part ; elles ne sont pas comptées ici.`, '',
    '| Famille | Codes | Au moins un modèle | Deux listes d’arrêts | Deux listes, repères inclus | Sens/variantes modélisés | Rangs d’arrêt | Rangs de repère | Origines seules | Rangs actifs à 19 h |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
  for (const [family, t] of Object.entries(report.totals)) md.push(`| ${family.toUpperCase()} | ${Object.values(t).join(' | ')} |`)
  md.push('', 'Une liste de repères peut décrire des rues ou des secteurs historiques, et non des arrêts de montée. « Deux listes » exige des rangs au-delà de l’origine dans chacun des deux sens documentaires. Ils peuvent relever d’éditions différentes ; cela ne certifie ni un aller-retour actuel ni l’identité physique des terminus. Une boucle n’est comptée qu’une fois. Un même numéro dans deux familles ne constitue pas deux services physiques.', '')
  md.push(`Empreinte de toutes les directions (ordre des appels, grilles hebdomadaires, profils et refus) : \`${report.digest}\`. Les bornes du tableau sont le premier et le dernier **créneau calculé à l’origine** le jeudi testé, pas des départs constatés.`, '')
  const clean = s => s.replaceAll('|','\\|'), link = (s, name) => /^https:\/\//.test(s) ? `[${name}](${s})` : clean(s)
  for (const [family] of Object.entries(report.totals)) {
    md.push(`## ${family.toUpperCase()}`, '', '| Ligne | Sens et terminus de la fiche | Rangs modélisés | Créneaux à l’origine · base | Durée et profil | Exemples à 19 h (rang : min) |', '|---|---|---|---|---|---|')
    for (const l of report.lines.filter(l => l.family === family)) for (const d of l.directions) {
      const title = d.label + ' · ' + d.from + ' → ' + d.to
      const slots = d.originSlots, span = slots.length ? `${hhmm(slots[0])}–${hhmm(slots.at(-1))}${slots.at(-1) >= day+86400_000 ? ' (+1 j)' : ''} · ` : ''
      md.push(`| ${l.code} | ${(/^https:\/\//.test(d.source) ? link(d.source,clean(title)) : clean(title) + ' · ' + clean(d.source))} | ${d.profile ? `${d.ranks} ${d.kind}` : '—'} | ${span}${d.phase ? d.phase.replace(/https:\/\/[^ ]+/, url => link(url,'Grille du sens')) : '—'} | ${d.profile ? `${d.duration === null ? '' : `${d.terminalDurations.length > 2 ? `${+d.terminalDurations[0].toFixed(1)}–${+d.terminalDurations.at(-1).toFixed(1)}` : `${+d.duration.toFixed(1)}${d.peakDuration ? ` / ${d.peakDuration}` : ''}`} min · `}${clean(d.profile.split(' · corridor ')[0])}` : d.reason} | ${d.example?.join(' ; ') ?? '—'} |`)
    }
    md.push('')
  }
  if (values.json) await writeFile(values.json, JSON.stringify(report, null, 2) + '\n')
  if (values.markdown) await writeFile(values.markdown, md.join('\n'))
  console.log(JSON.stringify(report.totals, null, 2))
} finally { await app.close() }
