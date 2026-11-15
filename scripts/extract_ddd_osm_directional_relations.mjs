#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'artifacts/ddd/osm-217-218-219-228';
const bbox = '(14.35,-17.65,14.95,-17.0)';
const refs = ['217', '218', '219', '228'];
const endpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

function queryFor(ref) {
  return `[out:json][timeout:60];
(
  relation["type"="route"]["ref"~"(^|[^0-9])${ref}([^0-9]|$)"]${bbox};
  relation["type"="route_master"]["ref"~"(^|[^0-9])${ref}([^0-9]|$)"]${bbox};
);
out body geom;`;
}

async function fetchRef(ref) {
  const query = queryFor(ref);
  let lastError = 'no endpoint attempted';
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'DakarBus-read-only-OSM-audit/1.1 (+https://github.com/aydiarra-star/dkrBus-apps)',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(75000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.remark) throw new Error('Overpass remark: ' + data.remark);
      return { ref, query, endpoint, data };
    } catch (error) {
      lastError = String(error);
    }
  }
  throw new Error('All Overpass endpoints failed for ref ' + ref + ': ' + lastError);
}

const results = [];
for (const ref of refs) {
  results.push(await fetchRef(ref));
}

const elementsByKey = new Map();
for (const result of results) {
  for (const element of result.data.elements || []) {
    elementsByKey.set(element.type + '/' + element.id, element);
  }
}
const elements = [...elementsByKey.values()];
const relations = elements.filter(element => element.type === 'relation');
const report = {
  retrievedAt: new Date().toISOString(),
  endpointsTriedInOrder: endpoints,
  queries: results.map(({ ref, query, endpoint, data }) => ({
    ref,
    endpoint,
    elementCount: (data.elements || []).length,
    relationCount: (data.elements || []).filter(element => element.type === 'relation').length,
    query,
  })),
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
  warning: 'An empty result for a ref does not prove that a commercial route is absent from OSM. Relation geometry and members are evidence only, not proof of current service. Queries are split by route reference to reduce server load.',
};
const raw = {
  version: 1,
  retrievedAt: report.retrievedAt,
  sources: results.map(({ ref, endpoint, data }) => ({ ref, endpoint, elements: data.elements || [] })),
  elements,
};

await mkdir(out, { recursive: true });
await writeFile(out + '/overpass-217-218-219-228.raw.json', JSON.stringify(raw, null, 2) + '\n');
await writeFile(out + '/overpass-217-218-219-228-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  refs: report.queries.map(({ ref, endpoint, relationCount }) => ({ ref, endpoint, relationCount })),
  elementCount: report.elementCount,
  relationCount: report.relationCount,
}, null, 2));
