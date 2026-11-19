// Source inventory, not a passenger feed. Load the same modules as the application
// (including Vite's JSON glob); do not scrape TS with regexes or use the number
// of displayed rows as the denominator. No network access, calendars or mutations.
import { readdir, readFile } from 'node:fs/promises'

const sides = ['outbound', 'inbound']
export async function busInventory(load) {
  const data = name => load(`/src/data/${name}.ts`)
  const domain = name => load(`/src/domain/${name}.ts`)
  const rows = new Map(), unassigned = []
  function add(network, code, origin) {
    if (!['ddd', 'aftu', 'tata'].includes(network) || !String(code ?? '').trim()) throw Error(`Invalid line identity: ${network}/${code}`)
    const key = `${network}:${code}`
    if (!rows.has(key)) rows.set(key, { network, code, evidence: [] })
    rows.get(key).evidence.push(origin)
  }
  const record = (source, kind, side, labels, extra = {}) => ({ source, kind, side, ...extra, ...(labels?.length ? { labels: [...labels] } : {}) })
  const publicLines = await domain('publicBusLineCatalog')
  for (const key of ['DDD_PUBLIC_LINE_CATALOG','AFTU_PUBLIC_LINE_CATALOG','TATA_PUBLIC_LINE_CATALOG','AFTU_TATA_PUBLIC_LINE_CATALOG']) {
    for (const r of publicLines[key]) add(r.network, r.line, record(key, key === 'AFTU_TATA_PUBLIC_LINE_CATALOG' ? 'display' : 'catalogue', 'unspecified', r.waypoints,
      { termini: [r.origin, r.destination], url: r.sourceUrl }))
  }
  const json = async file => JSON.parse(await readFile(new URL(`../src/data/${file}`, import.meta.url), 'utf8'))
  for (const file of ['mobility-lines.json','tata-lines.json']) for (const r of await json(file)) {
    add(r.network, r.code, record(file, 'source-order', 'as-published', r.waypoints, { termini: [r.origin, r.destination], url: r.detailSourceUrl ?? r.sourceUrl, note: r.note }))
    if (r.outboundSchedule || r.inboundSchedule) for (const side of sides) {
      const w = r[`${side}Schedule`]
      if (w) add(r.network, r.code, record(file, 'service-reference', side, null, { schedule: w }))
    }
    if (r.inboundWaypoints?.length) add(r.network, r.code, record(file, 'directional-sheet', 'inbound', r.inboundWaypoints, { url: r.inboundDetailSourceUrl, note: r.note }))
  }
  const publishedDdd = (await data('dddPublishedRoutes')).DDD_PUBLISHED_ROUTES
  const circuits = new Set(publishedDdd.filter(r => r.kind === 'published_circuit').map(r => r.line))
  for (const r of publishedDdd)
    add('ddd', r.line, record('dddPublishedRoutes', r.kind === 'published_circuit' ? 'circuit' : 'source-order', 'as-published', r.stops, { termini: [r.origin, r.destination], url: r.sourceUrl, conflict: r.sourceConflict }))
  const official = await data('dddOfficialPublishedRoutes')
  for (const r of official.DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES)
    add('ddd', r.line, record('dddOfficialPublishedRoutes', circuits.has(r.line) || r.stops[0] === r.stops.at(-1) ? 'circuit' : 'source-order', 'as-published', r.stops, { url: official.DDD_OFFICIAL_ROUTE_SOURCE.url }))
  for (const r of (await domain('bidirectionalBusLines')).BIDIRECTIONAL_BUS_LINES) for (const side of sides) {
    const d = r.directions[side]
    // Historical stopIds in status stops_mapped are often *street names*. Their
    // presence isn't proof of a WGS84 platform, nor even a resolved foreign key.
    add(r.network, r.line, record('bidirectionalBusLines', d.sequenceValidatedByProjectOwner ? 'owner-sequence' : d.stopIds.length ? 'source-order' : 'placeholder', side,
      d.stopNames.length ? d.stopNames : d.stopIds, { termini: [d.origin, d.destination], status: d.status, stopIdStrings: d.stopIds, resolvedPlatforms: false, url: d.sourceUrl, label: d.sourceLabel }))
  }
  const files = (await readdir(new URL('../src/data/', import.meta.url))).filter(f => /^aftu-.+-(directions|return)\.json$/.test(f)).sort()
  for (const file of files) {
    const r = await json(file)
    if (r.unconfirmedReturn) add(r.network, r.code, record(file, 'unconfirmed-return', 'inbound', r.unconfirmedReturn.waypoints, {
      url: r.unconfirmedReturn.url, note: r.unconfirmedReturn.reason }))
    if (r.otherCorridor) for (const side of sides) add(r.network, r.code, record(file, 'service-reference', side, null, {
      termini: side === 'outbound' ? r.otherCorridor.termini : [...r.otherCorridor.termini].reverse(), schedule: r.otherCorridor[`${side}Schedule`], scope: 'other-corridor' }))
    for (const side of sides) {
      const nested = r.directions?.[side], flat = side === 'outbound' ? r.waypoints : r.inboundWaypoints
      const blocks = [[side === 'outbound' ? 'waypoints' : 'inboundWaypoints', flat], [`directions.${side}`, nested?.waypoints]].filter(([, a]) => a?.length)
      const schedule = r[`${side}Schedule`]
      if (side === 'outbound' && r.operatingProfile && !r.code.endsWith('-unverified'))
        add(r.network, r.code, record(file, 'operating-profile', 'unspecified', null, { profile: r.operatingProfile, timeStatus: r.timeStatus }))
      if (schedule && !r.code.endsWith('-unverified')) add(r.network, r.code, record(file, 'service-reference', side, null, { schedule }))
      // Some files contain both representations. Merge identical copies in this
      // file, keep BOTH if they differ. Never synthesise the reverse direction.
      for (const [i, [field, labels]] of blocks.entries()) {
        if (i && JSON.stringify(labels) === JSON.stringify(blocks[0][1])) continue
        const item = record(file, (r.validatedByProjectOwner || r.sourceStatus === 'user-validated-directional-sequences') ? 'owner-sequence' : 'directional-sheet', side, labels, {
          field, url: (side === 'outbound' ? r.detailSourceUrl : r.inboundDetailSourceUrl) ?? null,
          label: r.sourceLabel ?? r[`${side}SourceLabel`], status: r.sourceStatus,
          termini: [nested?.origin ?? r[`${side}Origin`] ?? labels[0], nested?.destination ?? r[`${side}Destination`] ?? labels.at(-1)],
          frequency: r.frequency, note: r[`${side}Note`] ?? r.note,
          ...(nested?.times && JSON.stringify(labels) === JSON.stringify(nested.waypoints) && { sourceTimeCount: nested.times.length, sourceTimes: [...nested.times] }),
          ...(nested?.transcribedTimesUnvalidated && { withheldTimeCount: nested.transcribedTimesUnvalidated.length }) })
        if (r.code.endsWith('-unverified')) unassigned.push({ network: r.network, sourceCode: r.code, ...item })
        else add(r.network, r.code, item)
      }
    }
  }
  for (const r of (await domain('passengerLineSheets')).PASSENGER_LINE_SHEETS)
    add(r.network, r.line, record('passengerLineSheets', 'reader-sheet', 'as-published', r.labels, { url: r.url, ...(r.drawing && { drawing: r.drawing }) }))
  for (const [file, key, network] of [['aftuPublishedRouteCandidates','AFTU_PUBLISHED_ROUTE_CANDIDATES','aftu'], ['tataPublishedRouteCandidates','TATA_PUBLISHED_ROUTE_CANDIDATES','tata']]) {
    for (const r of (await data(file))[key]) add(network, r.line, record(file, 'description', 'as-published', null, { url: r.sourceUrl, status: r.directionCoverage, description: r.description, publishedOn: r.publishedOn, returnVariants: r.returnVariants }))
  }
  const schedules = await domain('estimatedSchedules')
  for (const [key, network] of [['DDD_ESTIMATED_LINE_SCHEDULES','ddd'], ['AFTU_ESTIMATED_LINE_SCHEDULES','aftu']])
    for (const r of schedules[key]) add(network, r.line, record(key, 'service-reference', 'unspecified', null, { schedule: r }))
  for (const r of (await data('dddPublishedDepartureWindows')).DDD_PUBLISHED_DEPARTURE_WINDOWS)
    add('ddd', r.service === 'TAF TAF' ? 'TAF_TAF' : r.service.replace(/^Ligne /, ''), record('dddPublishedDepartureWindows','terminal-window','as-published',null,{ termini: [r.origin,r.destination], start: r.firstDeparture, end: r.lastDeparture, interval: null, url: r.sourceUrl }))
  for (const [file, key, network] of [['dddAdditionalMapRoutes','DDD_ADDITIONAL_MAP_ROUTES','ddd'], ['aftuTataMapRoutes','AFTU_TATA_MAP_ROUTES','aftu']])
    for (const r of (await data(file))[key]) add(network, r.line, record(file,'map-landmarks','as-published',r.waypoints.map(w => w.name), { mapId: r.id, referencePoints: r.waypoints.length }))
  for (const p of (await data('greaterDakarBusCoverage')).GREATER_DAKAR_BUS_COVERAGE_POINTS) for (const r of p.routes) {
    // The regional map uses an AFTU/TATA palette, not a separate TATA attribution.
    add(r.network === 'ddd' ? 'ddd' : 'aftu', r.line, record('greaterDakarBusCoverage', 'area-marker', 'unspecified', null, { name: p.name, url: p.osmUrl, mapFamily: r.network }))
  }
  for (const r of (await domain('corridors')).CORRIDOR_LINES.filter(r => ['ddd','aftu_tata'].includes(r.network))) {
    const m = /^(DDD|AFTU|TATA) (\S+)$/.exec(r.shortName)
    const item = record('corridors', 'reference-poles','as-published', r.stopIds, { mapId: r.id })
    if (m) add(m[1].toLowerCase(), m[2], item); else unassigned.push({ mapFamily: r.network, ...item })
  }
  for (const r of (await data('dddHistoricalArcgisRegistry')).DDD_HISTORICAL_ARCGIS_REGISTRY)
    add('ddd', r.line, record('dddHistoricalArcgisRegistry', 'historical-layer', 'unspecified', null, { stopsLayer: r.stopLayerId, routeLayer: r.routeLayerId, url: r.sourceUrl }))
  const line13 = await data('dddLine13HistoricalMerged')
  add('ddd', '13', record('dddLine13HistoricalMerged', 'historical-layer', 'as-published', line13.DDD_LINE_13_HISTORICAL_STOPS.map(s => s.name), {
    layers: [0,8], spatialCandidates: line13.DDD_LINE_13_SPATIAL_MATCH_COUNT, routeDate: line13.DDD_LINE_13_HISTORICAL_ROUTE_SOURCE_DATE,
  }))
  const arcgis = await data('dddBanlieueArcgisRegistry')
  for (const key of ['DDD_BANLIEUE_ARCGIS_LAYERS','DDD_URBAN_ARCGIS_ROUTE_LAYERS','DDD_URBAN_ARCGIS_STOP_LAYERS','DDD_BANLIEUE_ARCGIS_STOP_GROUPS'])
    for (const r of arcgis[key]) add('ddd', r.line, record(key,'historical-layer','unspecified',null,{ layer: r.layerId, group: r.sourceGroup, url: r.layerUrl }))
  for (const r of (await data('aftuOfficialIndexCrosswalk')).AFTU_OFFICIAL_INDEX_CROSSWALK)
    add('aftu', r.line, record('aftuOfficialIndexCrosswalk', 'crosscheck', 'unspecified', null, { status: r.status, note: r.observation, officialCorridor: r.officialCorridor }))
  for (const r of (await data('dddOfficialSourceCrosswalk')).DDD_OFFICIAL_SOURCE_CROSSWALK) {
    // Joint decision about two DIFFERENT services, not one more line.
    const codes = r.line === 'TAF_TAF / TO1' ? ['TAF_TAF', 'TO1'] : [r.line]
    for (const code of codes) add('ddd', code, record('dddOfficialSourceCrosswalk', 'crosscheck', 'unspecified', null, { sourceCode: r.line, status: r.kind, note: r.decision, claims: r.claims }))
  }
  const { stationOsmPins } = await data('reviewedPassengerLinks')
  const station = stationOsmPins()
  const { BUS_SECTION_MARKERS } = await data('busSectionReview')
  const { BUS_SECTION_WAYS } = await data('busSectionWays')
  const { busScopes } = await load('/src/routing/busGeography.ts')
  const { dakarNetwork } = await load('/src/routing/dakar.ts')
  for (const { review: r, markers, parts } of busScopes) add(r.family, r.line, record('busSectionReview', 'cartographic-section', r.towards, markers.map(m => m.name), {
    id: r.id, ...(r.sourceSlice && { sourceSlice: r.sourceSlice }), ...(r.relation ? {relation: r.relation, version: r.version} : {directionUrl: r.directionUrl}), url: r.descriptionUrl, ways: r.ways, markerIds: markers.map(m => m.id), markerKind: r.landmarkKind, meters: Math.round(parts.reduce((s, p) => s + p.meters, 0)),
  }))
  const { line90, ...networkSettings } = (await data('aftuScheduleSettings')).AFTU_CETUD_SCHEDULE_SETTINGS
  add('aftu', '90', record('aftuScheduleSettings', 'operating-profile', 'unspecified', null, { profile: line90 }))
  const lines = [...rows.values()].sort((a,b) => a.network.localeCompare(b.network) || a.code.localeCompare(b.code, 'fr', { numeric:true }))
  return { version: 2, lines, unassigned,
    // PBF drift checks must detect moved interior nodes even if the way
    // retained its version. Keep the literal bounded subchain in storage order.
    pinnedOsm: { attribution: '© OpenStreetMap contributors · ODbL 1.0',
      markers: [...Object.entries(BUS_SECTION_MARKERS).map(([id,[version,lat,lon]]) => [Number(id),version,lat,lon]), ...station.markers],
      ways: [...Object.entries(BUS_SECTION_WAYS).map(([id,w]) => [Number(id),w.version,w.vertices,w.oneWay]), ...station.ways], relations: station.relations },
    context: { aftuNetworkSettings: networkSettings, siteObservations: (await data('cetudFrequencyObservations')).CETUD_FREQUENCY_OBSERVATIONS,
      officialPageAudit: (await data('aftuOfficialPageAudit')).AFTU_OFFICIAL_PAGE_AUDIT },
    staticRouting: {
      patterns: dakarNetwork.patterns.map(p => ({ mode: p.mode, lineId: p.lineId, direction: p.direction, calls: p.calls.length })),
      footways: [...dakarNetwork.walking.values()].reduce((n, ways) => n + ways.length, 0), rejected: dakarNetwork.rejected,
    },
  }
}

/** Compact, regenerable denominator. The detailed JSON retains every source,
 * variant and label (including multiple copies with different provenance). */
export function coverageTable(inventory) {
  const textKinds = new Set(['source-order','directional-sheet','owner-sequence','reader-sheet','circuit'])
  const out = ['# Couverture locale des sources de bus', '',
    'Une ligne de tableau = un couple **provenance + code**. Ni une ligne en circulation, ni une course. AFTU et TATA peuvent décrire le même minibus ; les pièces de comparaison restent distinctes.', '',
    'Les colonnes donnent les nombres d’occurrences par liste, sans additionner les transcriptions. Un même nombre peut correspondre à plusieurs variantes : consulter le JSON de `npm run audit:bus -- --output inventaire.json` pour les noms, l’ordre, les terminus et la provenance. « Ordre publié » ne veut pas dire « aller ». Une description de rues n’est pas une liste de quais. Une fenêtre ou un intervalle ne vaut pas service daté.', '']
  for (const family of ['ddd','aftu','tata']) {
    const rows = inventory.lines.filter(r => r.network === family)
    out.push(`## ${family.toUpperCase()} — ${rows.length} identifiants`, '', '| Code | Ordre publié | Aller | Retour | Autres pièces | Portions de carte |', '|---|---|---|---|---|---|')
    for (const r of rows) {
      const e = r.evidence, has = kind => e.some(v => v.kind === kind)
      const counts = side => [...new Set(e.filter(v => textKinds.has(v.kind) && (side === 'published' ? v.side === 'as-published' : v.side === side)).map(v => v.labels?.length).filter(Boolean))].sort((a,b) => a-b).join(' / ') || '—'
      const refs = [has('catalogue') && 'catalogue', has('circuit') && 'circuit', has('description') && 'descriptif', has('historical-layer') && 'ArcGIS',
        (has('area-marker') || has('reference-poles') || has('map-landmarks')) && 'repères', (e.some(v => v.kind === 'service-reference' && !v.scope) || has('terminal-window')) && 'horaires de référence', e.some(v => v.scope === 'other-corridor') && 'grilles d’un autre parcours', has('unconfirmed-return') && 'retour non attesté', has('operating-profile') && 'profil indicatif', e.some(v => v.sourceTimeCount) && 'heures aux repères', has('crosscheck') && 'revue de sources'].filter(Boolean)
      const parts = e.filter(v => v.kind === 'cartographic-section').map(v => `${v.meters} m vers ${v.side}${v.sourceSlice ? ` (fiche ${v.sourceSlice.side === 'inbound' ? 'retour' : 'aller'}, rangs ${v.sourceSlice.first}–${v.sourceSlice.last})` : ''}`)
      out.push(`| ${r.code} | ${counts('published')} | ${counts('outbound')} | ${counts('inbound')} | ${refs.join(', ') || '—'} | ${parts.join(' ; ') || '—'} |`)
    }
    out.push('')
  }
  out.push('Hors attribution :', ...inventory.unassigned.map(u => `- ${u.source}${u.sourceCode ? ` (${u.sourceCode})` : ''} : ${u.side}, ${u.labels?.length ?? 0} occurrences.`), '',
    `Calcul daté local (hors édition opérateur) : ${inventory.staticRouting.patterns.filter(p => ['ddd','aftu','tata'].includes(p.mode)).length} sens de bus ; ${inventory.staticRouting.footways} arcs piétons orientés (tous usages confondus). Une ligne absente du calculateur n’est pas déclarée hors service.`, '')
  return out.join('\n')
}
