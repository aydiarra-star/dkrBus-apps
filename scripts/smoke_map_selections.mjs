#!/usr/bin/env node
// Complement smoke_map_points (zoom, neighbours, keyboard and historical fixtures).
// Here the only data available to the built app are its real, checked-in reference points.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer, preview } from 'vite'

const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
const source = await createServer({ configFile:false, logLevel:'error', server:{ middlewareMode:true, hmr:false, watch:null, ws:false } })
let stops
try { ({ ALL_CORRIDOR_STOPS:stops } = await source.ssrLoadModule('/src/domain/corridors.ts')) } finally { await source.close() }
const refKey = s => `ref:${s.id}`, badge = s => s.id.split('-')[0].toUpperCase()
const totals = Object.fromEntries(['TER','BRT','DDD','AFTU','TATA'].map(b => [b, stops.filter(s => badge(s) === b).length]))
assert.deepEqual(totals, { TER:14, BRT:23, DDD:14, AFTU:13, TATA:6 })
const sorted = xs => [...xs].sort()

async function verify(page, touch) {
  const activate = el => touch ? el.tap() : el.click({ noWaitAfter:true })
  const pins = page.locator('.map-point-marker'), dialog = page.getByRole('dialog', { name:'Points sur la carte' })
  const pin = title => pins.and(page.getByTitle(title, {exact:true}))
  const count = n => page.waitForFunction(n => [...document.querySelectorAll('.map-point-marker')]
    .reduce((sum, p) => sum + 1 + Number(p.querySelector('.map-point-count')?.textContent ?? 0), 0) === n, n)
  async function readLists() {
    const rows = new Map()
    for (const title of await pins.evaluateAll(es => es.map(e => e.title))) {
      await activate(pin(title)); await dialog.waitFor()
      const records = await dialog.locator('li').evaluateAll(es => es.map(e => ({ key:e.dataset.pointKey,
        name:e.querySelector('strong').lastChild.textContent, badges:[...e.querySelectorAll('.map-point-badge')].map(b => b.textContent) })))
      for (const row of records) {
        assert.ok(!rows.has(row.key), `Duplicate row: ${row.key}`)
        rows.set(row.key, { ...row, title, grouped:records.length > 1 })
      }
      await activate(dialog.getByRole('button', {name:'Fermer les points'})); await dialog.waitFor({state:'detached'})
    }
    return rows
  }
  await count(137)
  const all = await readLists()
  assert.deepEqual(sorted([...all.keys()].filter(k => k.startsWith('ref:'))), sorted(stops.map(refKey)))
  const layers = page.getByRole('button', {name:'Couches', exact:true})
  async function toggle(name, checked) {
    await activate(layers)
    const box = page.getByRole('checkbox', {name, exact:true})
    assert.equal(await box.isChecked(), checked)
    await activate(box.locator('..')); assert.equal(await box.isChecked(), !checked)
    await activate(layers)
  }
  for (const [name, hidden, remaining] of [['TER', ['TER'], 56], ['BRT', ['BRT'], 47],
    ['Dakar Dem Dikk', ['DDD'], 56], ['AFTU / TATA', ['AFTU','TATA','AFTU/TATA'], 51]]) {
    await toggle(name, true)
    const wanted = [...all.values()].map(p => ({...p, badges:p.badges.filter(b => !hidden.includes(b))})).filter(p => p.badges.length)
    await count(wanted.length)
    const visible = await readLists()
    assert.deepEqual(sorted(visible.keys()), sorted(wanted.map(p => p.key)), name)
    for (const p of wanted) assert.deepEqual(visible.get(p.key).badges, p.badges, p.key)
    assert.equal([...visible.keys()].filter(k => k.startsWith('ref:')).length, remaining)
    await toggle(name, false); await count(137)
  }

  await activate(touch ? page.locator('.mobile-nav').getByRole('button', {name:/trajet/i}) : page.getByRole('tab', {name:/trajet/i}))
  await count(137)
  const owners = await readLists(), map = page.locator('.leaflet-map')
  for (const [i,s] of stops.entries()) {
    // Alternate roles; clear the field after each choice. Don't start a fictitious trip.
    const origin = i % 2 === 0, field = page.locator(origin ? '.route-origin-group' : '.route-destination-group')
    const id = refKey(s), owner = owners.get(id)
    assert.deepEqual(owner?.badges, [badge(s)], id); assert.equal(owner.name, s.name)
    await activate(field.getByRole('button', {name:'Choisir un point sur la carte'}))
    await page.locator('.map-pick-banner').waitFor()
    if (!touch) assert.equal(await map.evaluate(e => getComputedStyle(e).cursor), 'crosshair')
    await activate(pin(owner.title))
    if (owner.grouped) {
      await dialog.waitFor()
      const search = dialog.getByRole('searchbox'); if (await search.count()) await search.fill(s.name)
      const row = dialog.locator(`[data-point-key="${id}"]`)
      await activate(row.getByRole('button', {name:`Choisir ce point : ${badge(s)} — ${s.name}`, exact:true}))
    }
    await page.locator('.map-pick-banner').waitFor({state:'detached'})
    await field.getByText(s.name, {exact:true}).waitFor()
    assert.equal(await field.locator('.combobox-picked small').innerText(), `${badge(s)} · référence · ${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`, id)
    assert.equal(await page.getByRole('button', {name:'Rechercher mon itinéraire'}).isEnabled(), false)
    await activate(field.getByRole('button', {name:origin ? 'Retirer le départ' : 'Retirer la destination'})); await count(137)
  }
}

const local = process.env.PREVIEW_URL ? null : await preview({ preview:{host:'127.0.0.1',port:0,open:false}, logLevel:'error' })
const url = process.env.PREVIEW_URL ?? `http://127.0.0.1:${local.httpServer.address().port}/dkrBus-apps/`
try {
  for (const [width,height,touch,colorScheme] of [[393,852,true,'dark'],[1366,900,false,'light']]) {
    const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH ?? await binary.executablePath(), args:binary?.args})
    try {
      const page = await browser.newPage({viewport:{width,height}, hasTouch:touch, isMobile:touch, colorScheme, locale:'fr-FR', serviceWorkers:'block'})
      page.setDefaultTimeout(15000)
      const errors = []; page.on('pageerror', e => errors.push(e.message))
      await page.route(/^https:\/\//, r => new URL(r.request().url()).origin === new URL(url).origin ? r.continue() : r.abort()); await page.route('**/api/**', r => r.fulfill({status:404,json:{}}))
      await page.goto(url, {waitUntil:'domcontentloaded'})
      await verify(page, touch); assert.deepEqual(errors, [])
      console.log(`${width} × ${height} · ${colorScheme} : 70/70 choix individuels (14 TER, 23 BRT, 14 DDD, 13 AFTU, 6 TATA), réseau et coordonnées des deux champs, quatre couches vérifiées séparément`)
    } finally { await browser.close() }
  }
} finally { if (local) await new Promise(resolve => local.httpServer.close(resolve)) }
