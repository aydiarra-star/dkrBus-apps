#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { busInventory, coverageTable } from './bus_inventory.mjs'

const { values } = parseArgs({ options: { output: { type: 'string' }, markdown: { type: 'string' }, json: { type: 'boolean' } } })
const server = await createServer({ configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null, ws: false } })
try {
  const load = p => server.ssrLoadModule(p)
  const inventory = await busInventory(load)
  if (values.output) await writeFile(values.output, JSON.stringify(inventory, null, 2) + '\n')
  if (values.markdown) await writeFile(values.markdown, coverageTable(inventory))
  if (values.json) console.log(JSON.stringify(inventory, null, 2))
  else for (const family of ['ddd','aftu','tata']) {
    const rows = inventory.lines.filter(r => r.network === family)
    console.log(`${family.toUpperCase()} : ${rows.length} identifiants source · ${rows.map(r => r.code).join(', ')}`)
  }
} finally { await server.close() }
