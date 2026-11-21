// An Overpass outage is not an empty query result. The PBF alternative is the
// route/route_master extract from this CI run, not an equivalent Overpass bbox.
export const refs = ['217', '218', '219', '228']
const refPattern = new RegExp(`(?:^|[^0-9])(?:${refs.join('|')})(?:[^0-9]|$)`)

export function fromPbf(extract) {
  const bounds = extract.geographicBounds
  if (!Array.isArray(extract.relations) || !/^[a-f\d]{64}$/.test(extract.sourceSha256 ?? '') ||
      !extract.sourceUrl || !extract.generatedAt || !bounds ||
      ![bounds.south, bounds.north, bounds.west, bounds.east].every(Number.isFinite) ||
      !(bounds.south < bounds.north && bounds.west < bounds.east)) throw Error('Incomplete source metadata in the Dakar PBF extract')
  const relations = extract.relations.filter(r => ['route', 'route_master'].includes(r.tags?.type) && refPattern.test(r.tags.ref ?? ''))
  // Carry the source members, roles and geometry unchanged; never combine two directions or attribute an operator by ref.
  for (const r of relations) {
    if (!Number.isSafeInteger(r.id) || !Array.isArray(r.membersInRelationOrder) || r.membersInRelationOrder.length !== r.memberCount)
      throw Error(`Incomplete ordered membership for relation ${r.id}`)
  }
  return { status:'PBF_FALLBACK', source:extract.sourceUrl, sourceSha256:extract.sourceSha256, generatedAt:extract.generatedAt,
    geographicBounds:bounds, license:extract.license, attribution:extract.attribution, refsQueried:refs,
    relationCount:relations.length, relations,
    warning:'Same-run transport PBF extract, within its own published bounds. A reference is not an operator attribution. No finding proves absence of a commercial service; no new direction, transfer or timetable.' }
}
