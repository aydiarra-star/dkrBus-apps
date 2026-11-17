import { readFile } from 'node:fs/promises'

export const DAKAR_PEDESTRIAN_BBOX = '(14.50,-17.60,14.95,-17.05)'
export const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const query = `[out:json][timeout:60];
way[\"highway\"~\"^(footway|pedestrian|path|steps|living_street|residential|service|unclassified|tertiary|secondary|primary|trunk|trunk_link)$\"]${DAKAR_PEDESTRIAN_BBOX};
out body geom;
>;
out body;`

/** Prefer a prepared local PBF extract. Network access is used only when absent. */
export async function loadPedestrianSource({
  pbfWaysPath,
  fetchImpl = fetch,
  readFileImpl = readFile,
} = {}) {
  if (pbfWaysPath) {
    const data = JSON.parse(await readFileImpl(pbfWaysPath, 'utf8'))
    if (!Array.isArray(data.elements)) {
      throw new Error('Le fichier PBF préparé ne contient pas de tableau elements.')
    }
    return { endpoint: data.endpoint ?? 'Geofabrik OSM PBF', data }
  }

  const requests = OVERPASS_ENDPOINTS.map(async endpoint => {
    const response = await fetchImpl(endpoint, {
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
    // Overpass peut renvoyer HTTP 200 avec un jeu partiel après un timeout.
    // Un tel résultat ne doit jamais être pris pour un réseau complet.
    if (typeof data.remark === 'string' && data.remark.trim()) {
      throw new Error(`${endpoint}: réponse Overpass incomplète (${data.remark.trim()})`)
    }
    const ways = data.elements.filter(element => element?.type === 'way')
    const usableWays = ways.filter(way =>
      Array.isArray(way.nodes) &&
      way.nodes.length >= 2 &&
      Array.isArray(way.geometry) &&
      way.geometry.length === way.nodes.length,
    )
    if (usableWays.length === 0) {
      throw new Error(`${endpoint}: aucun way avec géométrie complète`)
    }
    return { endpoint, data }
  })

  try {
    return await Promise.any(requests)
  } catch (error) {
    throw new Error('Aucun serveur Overpass disponible avec une réponse complète : ' + error.message)
  }
}
