/**
 * Captures de contrôle du tracé TER Dakar – AIBD (outil temporaire, hors application).
 *
 * 1. Carte de l'application (serveur de développement), fond OpenStreetMap chargé.
 * 2. Page de contrôle autonome : tracé en trait fin sur fond OpenStreetMap puis
 *    sur imagerie satellite, pour juger de la position sur les voies.
 *
 * Usage : PUPPETEER_DIR=/tmp/cap CHROME_PATH=... node .github/ter-capture/capture.mjs
 */
import http from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const root = process.cwd()
const outDir = join(root, 'docs/captures/ter-dakar-aibd')
const APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/dkrBus-apps/'
const OFFLINE = process.env.CAPTURE_OFFLINE === '1'
const ONLY = process.env.CAPTURE_ONLY ?? ''
const require = createRequire(join(process.env.PUPPETEER_DIR ?? root, 'package.json'))
const puppeteer = require('puppeteer-core')

const geojson = JSON.parse(readFileSync(join(root, 'data/ter/ter-dakar-aibd.geojson'), 'utf8'))
const coordinates = geojson.features[0].geometry.coordinates
const phase2StartIndex = geojson.features[0].properties.phase_2_start_index
const corridors = readFileSync(join(root, 'src/domain/corridors.ts'), 'utf8')
const stations = [...corridors.matchAll(/\{ id: '(ter-[a-z-]+)', name: '([^']+)',(?: shortName: '[^']+',)? lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map(([, id, name, lat, lon]) => ({ id, name, lat: Number(lat), lon: Number(lon) }))
if (stations.length !== 14) throw new Error(`14 gares TER attendues dans corridors.ts, ${stations.length} lues`)
const stationOf = (id) => stations.find((station) => station.id === id)
const vertex = (index) => ({ lat: coordinates[index][1], lon: coordinates[index][0] })

mkdirSync(outDir, { recursive: true })
const report = { generated_at: new Date().toISOString(), offline: OFFLINE, captures: [], app: {} }

// --- Serveur statique de la page de contrôle -------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' }
const server = http.createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  try {
    let body
    if (path === '/track.json') body = JSON.stringify({ coordinates, phase2StartIndex, stations })
    else if (path === '/verify.html') body = readFileSync(join(root, '.github/ter-capture/verify.html'))
    else if (path.startsWith('/leaflet/') && !path.includes('..')) body = readFileSync(join(root, 'node_modules/leaflet/dist', path.slice('/leaflet/'.length)))
    else throw new Error('introuvable')
    response.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end()
  }
})
await new Promise((resolve) => server.listen(5199, '127.0.0.1', resolve))

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: process.env.CHROME_HEADLESS ?? true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', ...(process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ') : [])],
})
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isTile = (url) => /tile\.openstreetmap\.org|server\.arcgisonline\.com/.test(url)

async function newPage(width, height) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  const statuses = {}
  page.__tileStatuses = statuses
  if (OFFLINE) {
    await page.setRequestInterception(true)
    page.on('request', (request) => (isTile(request.url()) ? request.abort() : request.continue()))
  }
  page.on('response', (response) => {
    if (!isTile(response.url())) return
    statuses[response.status()] = (statuses[response.status()] ?? 0) + 1
  })
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message))
  return page
}

/** Attend que toutes les tuiles visibles soient chargées (ou en échec), 30 s au plus. */
async function waitForTiles(page) {
  const started = Date.now()
  let last = null
  while (Date.now() - started < 30_000) {
    last = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('img.leaflet-tile')]
      return { total: tiles.length, loaded: tiles.filter((tile) => tile.complete && tile.naturalWidth > 0).length, pending: tiles.filter((tile) => !tile.complete).length }
    })
    if (last.total > 0 && last.pending === 0) break
    if (OFFLINE && Date.now() - started > 1_500) break
    await sleep(400)
  }
  await sleep(700)
  return last
}

function resetStatuses(page) {
  for (const key of Object.keys(page.__tileStatuses)) delete page.__tileStatuses[key]
}

// --- 1. Carte de l'application ----------------------------------------------
if (!ONLY || ONLY === 'app') {
  const page = await newPage(1400, 2700)
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForSelector('.leaflet-container', { timeout: 60_000 })
  await sleep(4_000)
  const leafletUrl = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /deps\/leaflet\.js/.test(name)))
  if (!leafletUrl) throw new Error('module Leaflet du serveur de développement introuvable')
  // Récupère l'instance de carte de l'application sans modifier son code.
  await page.evaluate(async (url) => {
    const module = await import(url)
    const L = module.default ?? module
    const original = L.Map.prototype.setZoom
    L.Map.prototype.setZoom = function (...args) { window.__map = this; return original.apply(this, args) }
  }, leafletUrl)
  await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.getAttribute('aria-label') === 'Zoom avant').click())
  await sleep(1_000)
  if (!(await page.evaluate(() => Boolean(window.__map)))) throw new Error('carte de l’application introuvable')

  // Ce que le composant a réellement remis à Leaflet.
  report.app = await page.evaluate((file) => {
    const polylines = []
    window.__map.eachLayer((layer) => {
      if (typeof layer.getLatLngs !== 'function' || typeof layer.getRadius === 'function') return
      const latlngs = layer.getLatLngs()
      if (!Array.isArray(latlngs) || Array.isArray(latlngs[0])) return
      polylines.push({ count: latlngs.length, color: layer.options.color, weight: layer.options.weight, dash: layer.options.dashArray ?? null, identical: latlngs.length === file.length && latlngs.every((latlng, index) => latlng.lat === file[index][1] && latlng.lng === file[index][0]) })
    })
    return {
      attribution: document.querySelector('.leaflet-control-attribution')?.textContent ?? null,
      polylines_total: polylines.length,
      ter_polylines: polylines.filter((polyline) => polyline.count === file.length),
      other_polylines_vertex_counts: polylines.filter((polyline) => polyline.count !== file.length).map((polyline) => polyline.count).sort((a, b) => a - b),
    }
  }, coordinates)

  const lats = coordinates.map(([, lat]) => lat)
  const lons = coordinates.map(([lon]) => lon)
  const dakar = vertex(0)
  const diamniadio = vertex(phase2StartIndex)
  const aibd = vertex(coordinates.length - 1)
  const views = [
    { name: 'app-parcours-complet', bounds: [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]] },
    { name: 'app-dakar-z16', center: dakar, zoom: 16 },
    { name: 'app-dakar-z18', center: dakar, zoom: 18 },
    { name: 'app-diamniadio-z16', center: diamniadio, zoom: 16 },
    { name: 'app-diamniadio-z18', center: diamniadio, zoom: 18 },
    { name: 'app-aibd-z16', center: aibd, zoom: 16 },
    { name: 'app-aibd-z18', center: aibd, zoom: 18 },
  ]
  for (const view of views) {
    resetStatuses(page)
    await page.evaluate((v) => {
      if (v.bounds) window.__map.fitBounds(v.bounds, { animate: false, padding: [60, 60] })
      else window.__map.setView([v.center.lat, v.center.lon], v.zoom, { animate: false })
    }, view)
    await sleep(600)
    // La feuille de contenu recouvre le bas de la carte : masquée pour la capture seulement.
    const box = await page.evaluate(() => {
      const element = window.__map.getContainer()
      const rect = element.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      for (const ratio of [0.3, 0.5, 0.7, 0.9, 0.98]) {
        for (const node of document.elementsFromPoint(x, rect.top + rect.height * ratio)) {
          if (node === element || element.contains(node) || node.contains(element)) continue
          node.style.visibility = 'hidden'
        }
      }
      return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height }
    })
    const tiles = await waitForTiles(page)
    const width = Math.min(1400, box.width)
    const height = Math.min(900, box.height)
    const clip = { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }
    await page.screenshot({ path: join(outDir, `${view.name}.jpg`), type: 'jpeg', quality: 84, clip })
    const zoom = await page.evaluate(() => window.__map.getZoom())
    report.captures.push({ file: `${view.name}.jpg`, kind: 'application', base: 'osm', zoom, tiles, http: { ...page.__tileStatuses } })
    console.log(view.name, JSON.stringify({ zoom, tiles, http: page.__tileStatuses, box }))
  }
  await page.close()
}

// --- 2. Page de contrôle : trait fin sur fond OSM et sur imagerie -----------
if (!ONLY || ONLY === 'verify') {
  const page = await newPage(1400, 900)
  const mid = (a, b) => ({ lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 })
  const dakar = mid(vertex(0), stationOf('ter-dakar'))
  const diamniadio = vertex(phase2StartIndex)
  const aibd = mid(vertex(coordinates.length - 1), stationOf('ter-aibd'))
  const views = [
    { name: 'controle-dakar-osm-z19', base: 'osm', center: dakar, zoom: 19, title: 'Extrémité de Dakar' },
    { name: 'controle-dakar-satellite-z19', base: 'sat', center: dakar, zoom: 19, title: 'Extrémité de Dakar' },
    { name: 'controle-dakar-satellite-z18', base: 'sat', center: dakar, zoom: 18, title: 'Extrémité de Dakar' },
    { name: 'controle-dakar-satellite-z17', base: 'sat', center: dakar, zoom: 17, title: 'Extrémité de Dakar' },
    { name: 'controle-diamniadio-osm-z18', base: 'osm', center: diamniadio, zoom: 18, title: 'Raccord de Diamniadio' },
    { name: 'controle-diamniadio-satellite-z18', base: 'sat', center: diamniadio, zoom: 18, title: 'Raccord de Diamniadio' },
    { name: 'controle-diamniadio-satellite-z17', base: 'sat', center: diamniadio, zoom: 17, title: 'Raccord de Diamniadio' },
    { name: 'controle-aibd-osm-z19', base: 'osm', center: aibd, zoom: 19, title: 'Extrémité de l’aéroport' },
    { name: 'controle-aibd-satellite-z19', base: 'sat', center: aibd, zoom: 19, title: 'Extrémité de l’aéroport' },
    { name: 'controle-aibd-satellite-z18', base: 'sat', center: aibd, zoom: 18, title: 'Extrémité de l’aéroport' },
    { name: 'controle-aibd-satellite-z17', base: 'sat', center: aibd, zoom: 17, title: 'Extrémité de l’aéroport' },
    // Échantillon le long de la ligne : quatre vues en phase 1, quatre en phase 2.
    ...[[60, 'phase 1'], [150, 'phase 1'], [240, 'phase 1'], [290, 'phase 1'], [345, 'phase 2'], [385, 'phase 2'], [425, 'phase 2'], [465, 'phase 2']].map(([index, phase]) => ({
      name: `controle-ligne-${phase.replace(' ', '')}-sommet-${index}-satellite-z17`, base: 'sat', center: vertex(index), zoom: 17, title: `Pleine ligne, ${phase}, autour du sommet ${index}`,
    })),
  ]
  for (const view of views) {
    resetStatuses(page)
    const query = new URLSearchParams({ base: view.base, lat: String(view.center.lat), lon: String(view.center.lon), z: String(view.zoom), title: view.title })
    await page.goto(`http://127.0.0.1:5199/verify.html?${query}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForFunction(() => Boolean(window.__state), { timeout: 30_000 })
    const tiles = await waitForTiles(page)
    await page.screenshot({ path: join(outDir, `${view.name}.jpg`), type: 'jpeg', quality: 84 })
    report.captures.push({ file: `${view.name}.jpg`, kind: 'controle', base: view.base, zoom: view.zoom, tiles, http: { ...page.__tileStatuses } })
    console.log(view.name, JSON.stringify({ tiles, http: page.__tileStatuses }))
  }
  await page.close()
}

writeFileSync(join(outDir, 'rapport.json'), `${JSON.stringify(report, null, 2)}\n`)
await browser.close()
server.close()
console.log('Captures écrites dans', outDir)
