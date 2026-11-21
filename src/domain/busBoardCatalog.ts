/** Reconciles source sheets for the display, not for routing. A sheet carries
 * its own stops AND grid. Never match a timetable to another array by number. */
import { DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES as official, DDD_OFFICIAL_ROUTE_SOURCE } from '../data/dddOfficialPublishedRoutes'
import { DDD1_TABLE, DDD1_TO_LECLERC, DDD1_TOWARD_PARCELLES } from '../data/ddd1OperatorStops'
import { DDD_319_OUTBOUND, DDD_319_PROFILES } from '../data/busBoardCallSheets'
import { TATA_DESCRIPTIONS, TATA_DOCUMENT_SOURCE, TATA_2020_ADDITIONS, TATA_RETURN_SECTORS, TATA_UNTIMED_STAGES, TATA_2020_SOURCE } from '../data/tataBoardReview'
import { existingSheetHours, withNewSheetDirections } from './busSheetCatalog'
import { MINUTE } from './stopPassageCountdown'
import mobility from '../data/mobility-lines.json'
import tata from '../data/tata-lines.json'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
import { DDD_501_PROJECT_SEQUENCE } from '../data/ddd501ProjectSequence'
import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from '../data/dddPublishedDepartureWindows'
import { DDD23_DIRECTIONS, DDD_NUMBERED_VARIANTS, DDD_PALAIS_PAIRS, DDD16B_CHECKPOINTS } from '../data/dddSecondaryBoardSheets'
import { thiaroyeCheckpoints } from './thiaroyeCheckpoints'
import { DDD311_SHEETS } from '../data/ddd311BoardSheets'
import { DDD12_SHEETS } from '../data/ddd12DirectionSheets'
import { AFTU_CETUD_SCHEDULE_SETTINGS as cetud } from '../data/aftuScheduleSettings'
import { AFTU_PUBLIC_LINE_CATALOG, DDD_PUBLIC_LINE_CATALOG, TATA_PUBLIC_LINE_CATALOG, type PublicBusLineReference } from './publicBusLineCatalog'
import { DDD_ESTIMATED_LINE_SCHEDULES, type EstimatedLineSchedule } from './estimatedSchedules'
import { transcribedOffsets, type BusBoardDirection, type BusBoardLine, type BusFamily, type PointKind, type Side } from './busPassageBoard'
import { checkpointProfiles, fixedModelWeek, modelClock, publishedBounds, sheetWeek } from './busBoardModel'

type Route = { origin: string; destination: string; waypoints: string[]; times?: string[] }
type Sheet = { network: string; code: string; waypoints?: string[]; directions?: Record<Side, Route>; inboundWaypoints?: string[];
  outboundSchedule?: EstimatedLineSchedule; inboundSchedule?: EstimatedLineSchedule; detailSourceUrl?: string | null; inboundDetailSourceUrl?: string | null;
  outboundOrigin?: string; outboundDestination?: string; inboundOrigin?: string; inboundDestination?: string
  outboundDurationMinutes?: number; inboundDurationMinutes?: number; sourceStatus?: string
  frequency?: { intervalMinutes: number }; sourceLabel?: string }
const sheets = Object.values(import.meta.glob<Sheet>(['../data/aftu-*-directions.json', '../data/aftu-66-return.json', '!../data/aftu-85-directions.json'], { eager: true, import: 'default' }))
const label = (side: Side) => side === 'outbound' ? 'Aller' : 'Retour'
const sides = ['outbound', 'inbound'] as const
function missing(side: Side, from: string, to: string, source: string, reason = 'Sens non documenté'): BusBoardDirection {
  return { label: label(side), from, to, points: [], pointKind: 'arrêts', clock: null, source, reason }
}
function direction(family: BusFamily, code: string, side: Side, points: readonly string[], kind: PointKind, source: string,
  options: Parameters<typeof modelClock>[5] = {}): BusBoardDirection {
  return { label: label(side), from: points[0], to: points.at(-1)!, points, pointKind: kind, source, clock: modelClock(family, code, side, points, kind, options) }
}
const unavailable = (d: BusBoardDirection, reason: string): BusBoardDirection => ({ ...d, clock: null, reason })
const emptyPair = (r: PublicBusLineReference) => [missing('outbound', r.origin, r.destination, r.sourceUrl), missing('inbound', r.destination, r.origin, r.sourceUrl)]
function stripReturnNotes(points: readonly string[]): string[] {
  return points.filter(p => !/^retour\b/i.test(p)).map(p => p.replace(/\s*\(retour [^)]+\)/i, ''))
}
// Keep numbers (Jaxaay 1 ≠ 2, Palais 1 ≠ 2) and require complete words.
function tokens(s: string): string[] {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bucad\b/g, 'universite cheikh anta diop')
    .replace(/\bsham\b/g, 'sahm').replace(/\b(terminus|gare|de|des|la|les|du|principale|route|routiere)\b/g, ' ').match(/[a-z0-9]+/g) ?? []
}
function fits(point: string, end: string) {
  const p = tokens(point), e = tokens(end.replace(/\s*\([^)]*\)/g, ''))
  return e.length > 0 && e.every(t => p.includes(t))
}

// Flat source files without a headsign in the JSON. The keys specify the
// destination of each actual timetable, not the direction of the index title.
const flatAxes: Record<string, readonly [string, string]> = {
  '30': ['Guédiawaye', 'Gare de Colobane'], '58': ['Fass Mbao','Gueule Tapée'], '57': ['Rufisque', 'Liberté 6'], '62': ['Rufisque', 'Penc Mi'],
  '64': ['Guédiawaye', 'Rufisque'], '65': ['Colobane', 'Jaxaay'], '66': ['Yoff', 'Gorom'], '67': ['Rufisque', 'Ouakam'],
  '68': ['Bargny', 'Yeumbeul'], '71': ['Keur Massar', 'Fann Hock / Claudel'],
  '75': ['Yeumbeul', 'Gare de Colobane'],
  '82': ['Rebeuss', 'Yeumbeul'],
}
function aftuDirections(r: PublicBusLineReference): BusBoardDirection[] {
  const c = r.line, s = sheets.find(f => f.network === 'aftu' && f.code === c), pair = emptyPair(r)
  if (s?.directions) return sides.map(side => {
    const route = s.directions![side], points = route.waypoints
    const d = direction('aftu', c, side, points, 'arrêts', s.sourceLabel ?? r.sourceLabel, { owner: true,
      ...(c === '90' && { duration: (cetud.line90.averageJourneyMinutes.min + cetud.line90.averageJourneyMinutes.max) / 2 }),
      ...(s.frequency && { week: fixedModelWeek(c === '84' && side === 'inbound' ? '05:49' : c === '84' ? '06:00' : cetud.generalServiceWindow.start,
        c === '84' ? '21:00' : cetud.generalServiceWindow.end, s.frequency.intervalMinutes), originBasis: `CETUD · cadence ${s.frequency.intervalMinutes} min · phase modèle` }),
    })
    if (c === '86' || c === '87') return unavailable(d, 'Variante à confirmer')
    if (c === '84' && side === 'inbound') {
      const offsets = transcribedOffsets(route.times ?? [], points.length)
      if (!offsets || d.clock?.kind !== 'model') return unavailable(d, 'Profil incomplet')
      d.clock = { ...d.clock, offsetsMs: offsets, offsetBasis: 'CETUD · 73 écarts depuis 05:49' }
    }
    return d
  })
  if (s && (flatAxes[c] || s.sourceStatus === 'secondary-numbered-directional-sheets')) {
    const dirs = sides.map((side, i) => {
      const pts = i === 0 ? s.waypoints : s.inboundWaypoints
      const grid = i === 0 ? s.outboundSchedule : s.inboundSchedule
      const source = i === 0 ? s.detailSourceUrl : s.inboundDetailSourceUrl
      const [from, to] = flatAxes[c] ?? []
      const origin = i === 0 ? s.outboundOrigin ?? from : s.inboundOrigin ?? to
      const destination = i === 0 ? s.outboundDestination ?? to : s.inboundDestination ?? from
      if (!grid || grid.line !== c || !pts?.length || grid.sourceUrl !== source || !origin || !destination) return pair[i]
      const d = { ...direction('aftu', c, side, pts, 'arrêts', source, { week: sheetWeek(grid), originBasis: source, duration: i === 0 ? s.outboundDurationMinutes : s.inboundDurationMinutes }),
        from: origin, to: destination, directionPage: source }
      return c === '73' ? thiaroyeCheckpoints(d) : d
    })
    return c === '58' ? [...pair, ...dirs] : dirs
  }
  // 58 Comico is not the Fass Mbao sheet; 85-unverified is not Banoba.
  const base = mobility.find(f => f.network === 'aftu' && f.code === c)
  if (!base?.waypoints.length || c === '58') return pair
  const points = stripReturnNotes(base.waypoints), source = base.detailSourceUrl ?? r.sourceUrl
  if (c === '74' || c === '80') {
    pair[0] = direction('aftu', c, 'outbound', points, 'repères', source)
    pair[1] = missing('inbound', points.at(-1)!, points[0], source, 'Retour non confirmé')
    return pair
  }
  const a = points[0], b = points.at(-1)!
  const out = fits(a, r.origin) && fits(b, r.destination), back = fits(a, r.destination) && fits(b, r.origin)
  if (out !== back) pair[out ? 0 : 1] = direction('aftu', c, out ? 'outbound' : 'inbound', points, 'repères', source)
  if ((c === '2' || c === '5') && out) {
    // Only the streets specifically marked 'retour' in the official text,
    // not the forward list reversed and not a list of TATA boarding stops.
    pair[1] = direction('aftu', c, 'inbound', [b, 'Rue 37', 'Rue 17', a], 'repères', source)
  }
  // Exact operator body from a distinct page. Do not attach these landmarks
  // (or a frequency scraped by number) to the conflicting index heading.
  if (!out && !back && ['1','26','37','45','50','52','56','69'].includes(c) && source === `https://aftu-senegal.org/map/dakar-urbain-ligne-${c}/`)
    pair.push({ ...direction('aftu', c, 'outbound', points, 'repères', source), label: 'Aller · fiche détaillée' })
  return pair
}

function returnSectors(c: string, source: string): BusBoardDirection {
  const d = direction('tata', c, 'inbound', TATA_RETURN_SECTORS[c].split('|'), 'secteurs', TATA_2020_SOURCE)
  return { ...d, label: 'Retour · secteurs 2020', clock: d.clock?.kind === 'model'
    ? { ...d.clock, offsetBasis: `secteurs du retour 2020 · ${d.clock.offsetBasis} · corridor ${source}` } : null }
}
function tataDirections(r: PublicBusLineReference): BusBoardDirection[] {
  const c = r.line, s = tata.find(f => f.network === 'tata' && f.code === c), pair = emptyPair(r)
  const source = s?.detailSourceUrl ?? s?.sourceUrl ?? TATA_2020_SOURCE
  const stages: BusBoardDirection[] = (TATA_UNTIMED_STAGES[c] ?? []).map(({ side, points }) => ({
    label: `${label(side)} · sections 2020`, from: points[0], to: points.at(-1)!, points, pointKind: 'secteurs',
    source: TATA_2020_SOURCE, clock: null, reason: 'Sections tarifaires de 2020 · aucun horaire',
  }))
  const older = source === TATA_2020_SOURCE
  // Only the independently recrossed 2020 textual itineraries. Not a current
  // stop list. 63 and 74 here have their OWN historical end points.
  // 84 only has tariff stages. 83's return table ends at Jaxaay, NOT Arafat.
  if (older && !TATA_2020_ADDITIONS[c] && !['61','62','63','65','66','67','68','71','73','74','75','76','77','78','80','81','82','83'].includes(c)) return [...pair, ...stages]
  const extra = TATA_2020_ADDITIONS[c]
  if (!s && !extra) return pair
  const pts = extra ? extra.split('|') : stripReturnNotes(s!.waypoints)
  if (!extra) {
    const from = s!.origin, to = c === '74' ? 'Cité Tawfeex' : s!.destination
    if (pts[0] !== from) pts.unshift(from)
    if (pts.at(-1) !== to && !(c === '62' && pts.at(-1) === 'Penc Mi')) pts.push(to)
  }
  pair[0] = { ...direction('tata', c, 'outbound', pts, 'repères', source), label: older ? 'Aller · tracé 2020' : 'Aller' }
  pair[1] = TATA_RETURN_SECTORS[c] ? returnSectors(c, source) : missing('inbound', pts.at(-1)!, pts[0], source)
  const described = TATA_DESCRIPTIONS[c]
  if (described) {
    const { side, points } = described
    const sheet: BusBoardDirection = { label: `${label(side)} · itinéraire documentaire`, from: points[0], to: points.at(-1)!,
      pointKind: 'repères', points, clock: null, source: TATA_DOCUMENT_SOURCE, reason: 'Repères du document · validité et heures non indiquées' }
    // Only the HLM Grand Yoff → Lat-Dior slot: the landmarks are documented
    // in this order. The 53 from Lac Rose is NOT the one from Keur Massar.
    if (c === '1' && side === 'inbound' && pair[1].from === 'HLM Grand Yoff' && pair[1].to === 'Lat-Dior' && !pair[1].points.length && !pair[1].clock) pair[1] = {...sheet, indexSource:pair[1].source}
    else pair.push(sheet)
  }
  return [...pair, ...stages]
}
function dddDirections(r: PublicBusLineReference): BusBoardDirection[] {
  const c = r.line, pair = emptyPair(r)
  if (c === '501') return sides.map(side => direction('ddd', c, side, DDD_501_PROJECT_SEQUENCE.directions[side].waypoints, 'arrêts', 'https://github.com/aydiarra-star/dkrBus-apps/blob/e6240379239c4dc4750520930974ca38f151f0b7/src/data/ddd501ProjectSequence.ts', { owner: true }))
  const pub = DDD_PUBLISHED_ROUTES.find(f => f.line === c)
  const additional = official.find(f => f.line === c)
  if (c === 'TAF_TAF' && additional) return DDD_PUBLISHED_DEPARTURE_WINDOWS.filter(w => w.service === 'TAF TAF').map(w => {
    const out = w.origin === 'Ouakam'
    return { ...direction('ddd', c, out ? 'outbound' : 'inbound', [w.origin], 'départ seul', w.sourceUrl, {
      week: publishedBounds(w.firstDeparture, w.lastDeparture), originBasis: `${w.sourceUrl} · bornes du terminus + cadence modèle`,
      // No median urban length for an airport journey. Only model the origin
      // until a corridor-specific airport duration can be sourced.
    }), from: w.origin, to: w.destination }
  })
  if (c === 'TAF_TAF_TO1') return [missing('outbound', r.origin, r.destination, r.sourceUrl, 'Voir la fiche TO1')]
  if (!pub && additional && ['15','502','503'].includes(c)) {
    const points = additional.stops.join('|').replace('Rond Point Bel|Air', 'Rond-point Bel Air').split('|')
    const d = direction('ddd', c, 'outbound', points, 'repères', r.sourceUrl)
    return c === '15' ? [d, pair[1]] : [{ ...d, label: 'Circuit' }]
  }
  // The double arrows on the operator's Info voyageurs page independently
  // establish origins; they do not establish a return stop order or duration.
  const bothOrigins = r.sourceUrl === 'https://demdikk.sn/info-voyageurs/' && !['18','20','319','TO1'].includes(c)
  if (bothOrigins) for (const [i,d] of pair.entries()) pair[i] = { ...direction('ddd', c, sides[i], [d.from], 'départ seul', r.sourceUrl), from: d.from, to: d.to }
  const conflict = !pub || pub.sourceConflict || ['6','23','208','311'].includes(c)
  if (pub && !conflict) {
    pair[0] = direction('ddd', c, 'outbound', pub.stops, 'repères', pub.sourceUrl, { dddPublished: true })
    if (pub.kind === 'published_circuit') return [{ ...pair[0], label: 'Circuit' }]
  }
  if (c === '311') return [missing('outbound','Lac Rose / Croisement Niague','Croisement Keur Massar',r.sourceUrl,'Circuit incomplet'),
    ...DDD311_SHEETS.map((s,i) => {
      const fromMinutes = (v: readonly number[]) => v.map(m => m * MINUTE)
      const d = direction('ddd', c, sides[i], s.points, 'arrêts', s.source, { week: s.week, originBasis: s.timetable,
        offsets: fromMinutes(s.quiet), offsetBasis: 'Moovit · grille hebdomadaire par rang et départ' })
      if (d.clock?.kind === 'model') d.clock = { ...d.clock, peakOffsetsMs: fromMinutes(s.busy),
        byOrigin: Object.fromEntries(Object.entries(s.byOrigin).map(([time, v]) => [time, fromMinutes(v)])) }
      return { ...d, from:s.from, to:s.to, label:`${d.label} · fiche RN 1` }
    })]

  if (Object.hasOwn(DDD_NUMBERED_VARIANTS, c)) {
    const g = DDD_ESTIMATED_LINE_SCHEDULES.find(g => g.line === c)!, week = sheetWeek(g)
    const sheet = DDD_PALAIS_PAIRS[c]
    const moovit = sheet && `https://moovitapp.com/index/fr/transport_en_commun-line-${c.toLowerCase()}-Dakar-5996-1618037-${sheet.moovitId}`
    if (sheet) {
      const url = `${moovit}-1`
      const go = direction('ddd', c, 'outbound', sheet.toPalais, 'arrêts', url, { week: sheet.weekToPalais, duration: sheet.durationToPalais, originBasis: url })
      if (c === '16B' && go.clock?.kind === 'model') {
        const profiles = checkpointProfiles(go.points, DDD16B_CHECKPOINTS)
        go.clock = profiles ? { ...go.clock, offsetsMs:profiles[0], peakOffsetsMs:profiles[1], offsetBasis:'Moovit · points horodatés 00:00 / 07:00 et interpolation' } : null
      }
      pair.push({ ...go, label:'Aller · fiche détaillée' })
    }
    const d = direction('ddd', c, ['217','218'].includes(c) ? 'outbound' : 'inbound', DDD_NUMBERED_VARIANTS[c as keyof typeof DDD_NUMBERED_VARIANTS], 'arrêts', g.sourceUrl, {
      week: c === '218' ? { ...week, sunday: [] } : week, originBasis: g.sourceUrl,
      ...(sheet && { duration: sheet.durationFromPalais, offsetBasis:`Durée Moovit du sens · ${moovit}-0 · interpolation par rang` }),
    })
    pair.push({ ...d, directionPage:g.sourceUrl, label: `${d.label} · fiche détaillée` })
  }
  if (c === '23') for (const [i,g] of DDD23_DIRECTIONS.entries()) {
    const source = `https://moovitapp.com/index/fr/transport_en_commun-line-23-Dakar-5996-1618037-18051449-${i}`
    const weekend = [{ start: g.weekendStart, end: g.weekendEnd, every: 20 }]
    const d = direction('ddd', c, sides[i], g.points, 'arrêts', source, { week: { weekday: [{ start: g.start, end: g.end, every: 10 }], saturday: weekend, sunday: weekend }, duration: 48, originBasis: source })
    pair.push({ ...d, label: `${d.label} · Gare Palais` })
  }
  if (!pub) return pair
  if (c === '1') for (const [i, w] of DDD_PUBLISHED_DEPARTURE_WINDOWS.filter(w => w.service === 'Ligne 1').entries()) {
    const d = direction('ddd', c, sides[i], i ? [w.origin] : pub.stops, i ? 'départ seul' : 'repères', pub.sourceUrl, {
      week: publishedBounds(w.firstDeparture, w.lastDeparture), originBasis: `${w.sourceUrl} · bornes du terminus + cadence modèle`, dddPublished: !i })
    pair[i] = { ...d, from: w.origin, to: w.destination }
  }
  if (c === '1') for (const [i, points] of [DDD1_TO_LECLERC,DDD1_TOWARD_PARCELLES].entries()) {
    pair.push({ label: i ? 'Retour · extrait opérateur' : 'Aller · arrêts opérateur', from: points[0], to: points.at(-1)!,
      points, pointKind:'arrêts', source:DDD1_TABLE, clock:null, partialList:Boolean(i),
      reason: i ? 'Extrait après Leclerc · terminus et heures non renseignés' : 'Liste de l’opérateur · aucune heure par arrêt' })
  }
  if (c === '319') {
    const ref = mobility.find(f => f.network === 'ddd' && f.code === '319')!, go = DDD_ESTIMATED_LINE_SCHEDULES.find(f => f.line === c)!, back = ref.inboundSchedule!
    return [go, back].map((g,i) => ({ ...direction('ddd', c, sides[i], i ? ref.inboundWaypoints! : DDD_319_OUTBOUND, 'arrêts', g.sourceUrl, {
      week: sheetWeek(g), originBasis: g.sourceUrl, offsets: DDD_319_PROFILES[i].map(m => m * MINUTE),
      offsetBasis: `Moovit · profil du premier départ ${i ? '06:50' : '06:55'}`,
    }), from: i ? 'Ouakam' : 'Liberté 6', to: i ? 'Liberté 6' : 'Ouakam' }))
  }
  if (c === '12') for (const [i, s] of DDD12_SHEETS.entries()) {
    const d = direction('ddd', c, sides[i], s.points, 'arrêts', s.schedule.sourceUrl, { offsets: s.offsetMinutes.map(m => m*MINUTE), offsetBasis: `Moovit · profils ${i ? '06:00 / 07:08' : '05:00 / 07:00'}`, week: sheetWeek(s.schedule), originBasis: s.schedule.sourceUrl })
    if (d.clock?.kind === 'model') d.clock = { ...d.clock, peakOffsetsMs: s.peakMinutes.map(m => m*MINUTE) }
    pair.push({ ...d, label: `${d.label} · Maristes` })
  }
  return pair
}
function sheetsFor(family: BusFamily, r: PublicBusLineReference) {
  const base = {ddd:dddDirections, aftu:aftuDirections, tata:tataDirections}[family](r)
  return withNewSheetDirections(family,r.line,base.map(d => ({ ...d, sourceHours:existingSheetHours(family,r.line,d) })))
}
const dddCodes = new Map(DDD_PUBLIC_LINE_CATALOG.map(r => [r.line, r]))
for (const r of official) if (!dddCodes.has(r.line)) dddCodes.set(r.line, { network: 'ddd', line: r.line, origin: r.stops[0], destination: r.stops.at(-1)!, sourceUrl: DDD_OFFICIAL_ROUTE_SOURCE.url, sourceLabel: DDD_OFFICIAL_ROUTE_SOURCE.label })
const tataCodes = new Map(TATA_PUBLIC_LINE_CATALOG.map(r => [r.line, r]))
for (const r of tata) if (!tataCodes.has(r.code)) tataCodes.set(r.code, { network: 'tata', line: r.code, origin: r.origin, destination: r.destination, sourceUrl: r.sourceUrl, sourceLabel: 'Fiche TATA' })
export const BUS_BOARD_LINES: Readonly<Record<BusFamily, readonly BusBoardLine[]>> = {
  ddd: [...dddCodes.values()].sort((a,b) => a.line.localeCompare(b.line, 'fr', { numeric: true })).map(r => ({ key: `ddd:${r.line}`, family: 'ddd', code: r.line, ...(r.line === 'TAF_TAF_TO1' && { aliasOf:'TO1' }), directions: sheetsFor('ddd',r) })),
  aftu: AFTU_PUBLIC_LINE_CATALOG.map(r => ({ key: `aftu:${r.line}`, family: 'aftu', code: r.line, directions: sheetsFor('aftu',r) })),
  tata: [...tataCodes.values()].sort((a,b) => Number(a.line) - Number(b.line)).map(r => ({ key: `tata:${r.line}`, family: 'tata', code: r.line, directions: sheetsFor('tata',r) })),
}
