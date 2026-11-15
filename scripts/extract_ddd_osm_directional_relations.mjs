#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'artifacts/ddd/osm-217-218-219-228';
const refs = ['217', '218', '219', '228'];
const bbox = '(14.35,-17.65,14.95,-17.0)';
const query = `[out:json][timeout:35];
(
  relation["type"="route"]["ref"~"(^|[^0-9])(${refs.join('|')})([^0-9]|$)"]${bbox};
  relation["type"="route_master"]["ref"~"(^|[^0-9])(${refs.join('|')})([^0-9]|$)"]${bbox};
);
out body geom;`;
const endpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

let data = null;
let usedEndpoint = null;
const attempts = [];
for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'DakarBus-read-only-OSM-audit/1.2 (+https://github.com/aydiarra-star/dkrBus-apps)',
      },
      body: 'data=' + encodeURIComponent(query),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const candidate = await response.json();
    if (candidate.remark) throw new Error('Overpass remark: ' + candidate.remark);
    data = candidate;
    usedEndpoint = endpoint;
    break;
  } catch (error) {
    attempts.push({ endpoint, error: String(error) });
  }
}
if (!data) {
  throw new Error('All Overpass endpoints failed: ' + attempts.map(a => a.endpoint + ' => ' + a.error).join(' | '));
}

const elements = data.elements || [];
const relations = elements.filter(element => element.type === 'relation');
const report = {
  retrievedAt: new Date().toISOString(),
  endpoint: usedEndpoint,
  endpointsTried: endpoints.slice(0, attempts.length + 1),
  failedAttempts: attempts,
  refsQueried: refs,
  query,
  elementCount: elements.length,
  relationCount: relations.length,
  relations: relations.map(relation => ({
    id: relation.id,
    tags: relation.tags || {},
    memberCount: (relation.members || []).length,
    memberTypes: (relation.members || []).reduce((counts, member) => {
      counts[member.type] = (counts[member.type] || 0) + 1;
      return counts;
    }, {}),
  })),
  warning: 'An empty result for a ref does not prove that a commercial route is absent from OSM. Relation geometry and members are evidence only, not proof of current service. This targeted query is split by ref values in one bounded request to reduce server load.',
};
await mkdir(out, { recursive: true });
await writeFile(out + '/overpass-217-218-219-228.raw.json', JSON.stringify(data, null, 2) + '\n');
await writeFile(out + '/overpass-217-218-219-228-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  endpoint: usedEndpoint,
  refsQueried: refs,
  elementCount: elements.length,
  relationCount: relations.length,
  relations: report.relations,
}, null, 2));
