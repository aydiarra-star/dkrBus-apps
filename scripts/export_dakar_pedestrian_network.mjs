#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { buildPedestrianGraph } from './lib/pedestrianNetwork.mjs'
import { DAKAR_PEDESTRIAN_BBOX, loadPedestrianSource } from './lib/pedestrianSource.mjs'

const source = await loadPedestrianSource({ pbfWaysPath: process.env.DAKAR_OSM_WAYS_JSON })
const graph = buildPedestrianGraph(source.data.elements)
const report = {
  generatedAt: new Date().toISOString(),
  endpoint: source.endpoint,
  geographicBounds: DAKAR_PEDESTRIAN_BBOX,
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
