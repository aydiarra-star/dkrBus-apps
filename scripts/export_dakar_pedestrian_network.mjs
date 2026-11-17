#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildPedestrianGraph } from './lib/pedestrianNetwork.mjs'

const bbox = '(14.50,-17.60,14.95,-17.05)'
const query = `[out:json][timeout:60];
way["highway"~"^(footway|pedestrian|path|steps|living_street|residential|service|unclassified|tertiary|secondary|primary|trunk|trunk_link)$"]${bbox};
out body geom;`
const endpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const requests = endpoints.map(async endpoint => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'DakarBus-read-only-pedestrian-graph/1.0 (+https://github.com/aydiarra-star/dkrBus-apps)',
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(70000),
  })
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data.elements)) throw new Error(`${endpoint}: missing elements`)
  return { endpoint, data }
})
let source
const pbfWaysPath = process.env.DAKAR_OSM_WAYS_JSON
if (pbfWaysPath) {
  const data = JSON.parse(await readFile(pbfWaysPath, 'utf8'))
  if (!Array.isArray(data.elements)) throw new Error('Le fichier PBF préparé ne contient pas de tableau elements.')
  source = { endpoint: data.endpoint ?? 'Geofabrik OSM PBF', data }
} else {
  try {
    source = await Promise.any(requests)
  } catch (error) {
    throw new Error('Aucun serveur Overpass disponible : ' + error.message)
  }
}
const graph = buildPedestrianGraph(source.data.elements)
const report = {
  generatedAt: new Date().toISOString(),
  endpoint: source.endpoint,
  geographicBounds: bbox,
  query,
  sourceElements: source.data.elements.length,
  ...graph,
  warnings: [
    'Graphe candidat dérivé des ways OSM ; ce n’est pas un réseau certifié par les opérateurs.',
    'Les nœuds d’accès/entrée des arrêts ne sont pas raccordés automatiquement.',
    'Aucune marche de correspondance n’est activée avant validation des liens arrêts-quais-vers-graphe.',
    'Les interdictions d’accès et balises foot sont filtrées ; les barrières et traversées doivent encore être contrôlées.',
  ],
}
await mkdir('artifacts/pedestrian', { recursive: true })
await writeFile('artifacts/pedestrian/dakar-pedestrian-graph-candidate.json', JSON.stringify(report) + '\n')
console.log(JSON.stringify({ endpoint: source.endpoint, sourceElements: report.sourceElements, summary: graph.summary, status: graph.status }, null, 2))
