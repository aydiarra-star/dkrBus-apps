import type {
  MobilityBrainCatalogRecord,
  MobilityBrainDirection,
  MobilityBrainLine,
  MobilityBrainOrderedStop,
  MobilityBrainServicePattern,
  MobilityBrainSnapshot,
  MobilityBrainStop,
} from './mobilityBrainApi'

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}

function networkMention(text: string): string | null {
  if (/\btata\b/.test(text)) return 'tata'
  if (/\baftu\b/.test(text)) return 'aftu'
  if (/\bddd\b|\bdakar dem dikk\b|\bdem dikk\b/.test(text)) return 'ddd'
  return null
}

function networkLabel(snapshot: MobilityBrainSnapshot, code: string): string {
  const network = snapshot.networks.find((item) => item.code === code)
  if (network?.name) return network.name
  if (code === 'ddd') return 'Dakar Dem Dikk'
  if (code === 'aftu') return 'AFTU'
  return 'TATA'
}

function lineCodeMention(text: string): string | null {
  const explicit = /\b(?:ligne|numero|code|bus)\s+([a-z]?\d+[a-z]?|[a-z]\d+)\b/.exec(text)
  if (explicit) return explicit[1]
  const network = /\b(?:dakar dem dikk|dem dikk|ddd|aftu|tata)\s+([a-z]?\d+[a-z]?|[a-z]\d+)\b/.exec(text)
  return network?.[1] ?? null
}

function isUsableRecordStatus(status: string | null | undefined): boolean {
  return status === 'candidate' || status === 'verified' || status === 'published'
}

function linesForNetwork(snapshot: MobilityBrainSnapshot, code: string): MobilityBrainLine[] {
  const networkIds = new Set(snapshot.networks.filter((item) => item.code === code).map((item) => item.id))
  return snapshot.lines.filter((line) => networkIds.has(line.network_id) && isUsableRecordStatus(line.status))
}

function catalogForLine(
  snapshot: MobilityBrainSnapshot,
  line: MobilityBrainLine,
  networkCode: string,
): MobilityBrainCatalogRecord | undefined {
  return snapshot.catalogue.find((record) =>
    isUsableRecordStatus(record.status)
    && record.network_code === networkCode
    && record.line_code.toLowerCase() === line.code.toLowerCase()
  )
}

function stopName(stop: MobilityBrainStop | null | undefined): string | null {
  return stop?.canonical_name?.trim() || null
}

function stopsForDirection(
  snapshot: MobilityBrainSnapshot,
  directionId: string,
): MobilityBrainOrderedStop[] {
  return snapshot.ordered_line_stops
    .filter((row) => row.direction_id === directionId)
    .sort((a, b) => a.stop_sequence - b.stop_sequence)
}

function formatClock(value?: string | null): string | null {
  return value ? value.slice(0, 5) : null
}

function numeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatPattern(pattern: MobilityBrainServicePattern): string {
  const minimum = numeric(pattern.headway_min_minutes)
  const maximum = numeric(pattern.headway_max_minutes)
  const fixed = numeric(pattern.headway_minutes)
  const wait = numeric(pattern.expected_wait_minutes)
  const interval = minimum !== null && maximum !== null && minimum !== maximum
    ? `intervalle ${minimum}–${maximum} min`
    : fixed !== null
      ? `intervalle ${fixed} min`
      : minimum !== null
        ? `intervalle de référence ${minimum} min`
        : 'intervalle non précisé'
  const start = formatClock(pattern.service_start_earliest ?? pattern.service_start ?? pattern.service_start_latest)
  const end = formatClock(pattern.service_end_latest ?? pattern.service_end ?? pattern.service_end_earliest)
  const window = start && end ? ` · service ${start}–${end}` : ''
  const period = pattern.period_label ? `${pattern.period_label.replace(/_/g, ' ')} : ` : ''
  const waitText = wait !== null ? ` · attente de référence ${wait} min` : ''
  const evidenceLabel = pattern.status === 'candidate'
    ? 'repère candidat'
    : pattern.status === 'verified' || pattern.status === 'published'
      ? 'repère vérifié'
      : 'repère non confirmé'
  return `${evidenceLabel} · ${period}${interval}${window}${waitText}`
}

function directionTitle(direction: MobilityBrainDirection): string {
  const origin = direction.origin_label?.trim()
  const destination = direction.destination_label?.trim()
  if (origin && destination) {
    const label = direction.direction_code.includes('circuit')
      ? 'Circuit candidat'
      : direction.direction_method === 'reverse_derived' || direction.direction_code.includes('return')
        ? 'Retour'
        : 'Aller'
    return `${label} : ${origin} → ${destination}`
  }
  return direction.direction_code
}

function lineReply(
  snapshot: MobilityBrainSnapshot,
  line: MobilityBrainLine,
  networkCode: string,
): string {
  const label = networkLabel(snapshot, networkCode)
  const catalog = catalogForLine(snapshot, line, networkCode)
  const directions = snapshot.directions.filter((direction) => direction.line_id === line.id && isUsableRecordStatus(direction.status))
  const blocks = directions.map((direction) => {
    const ordered = stopsForDirection(snapshot, direction.id)
    const names = ordered.map((row) => stopName(row.stop)).filter((name): name is string => Boolean(name))
    const waypoints = Array.isArray(catalog?.raw_record?.waypoints)
      ? catalog.raw_record.waypoints.filter((item): item is string => typeof item === 'string')
      : []
    const route = names.length ? names : waypoints
    const visibleRoute = route.length > 28
      ? `${route.slice(0, 28).join(' → ')} → … (${route.length - 28} autres arrêts)`
      : route.join(' → ')
    const directionStatus = direction.direction_method === 'reverse_derived'
      ? 'Sens retour reconstitué à partir du sens publié.'
      : direction.direction_code.includes('return') && direction.direction_method === 'unknown'
        ? 'Sens retour non documenté : aucune séquence n’est inventée.'
        : direction.direction_code.includes('circuit')
          ? 'Parcours circulaire candidat issu de la fiche source ; aucun sens inverse n’est déduit.'
          : direction.direction_method === 'source_documented' || direction.direction_code === 'source_forward'
            ? 'Sens issu de la fiche source.'
            : 'Sens enregistré dans le référentiel.'
    const patterns = snapshot.service_patterns.filter((pattern) =>
      pattern.direction_id === direction.id && isUsableRecordStatus(pattern.status)
    )
    const frequency = patterns.length
      ? `Fréquence : ${patterns.map(formatPattern).join(' ; ')}.`
      : 'Aucune fréquence par ligne enregistrée pour ce sens.'
    const note = direction.direction_notes?.trim()
    return [
      `${directionTitle(direction)}.`,
      visibleRoute ? `Arrêts dans l’ordre : ${visibleRoute}.` : 'La séquence détaillée des arrêts n’est pas encore renseignée.',
      directionStatus,
      frequency,
      note ? note : '',
    ].filter(Boolean).join('\n')
  })
  const sourceUrl = catalog?.detail_source_url || catalog?.source_url
  const sourceLine = sourceUrl
    ? `\nSource : ${sourceUrl}\nFiche consultée dans le référentiel Supabase ; les données de circulation en direct ne sont pas incluses.`
    : ''
  const lineStatus = line.status === 'published'
    ? 'Fiche publiée dans le référentiel.'
    : line.status === 'verified'
      ? 'Fiche vérifiée dans le référentiel.'
      : 'Fiche candidate du référentiel, conservée séparément des données publiées.'
  const routeTitle = line.public_name
    || (catalog?.origin_label && catalog?.destination_label
      ? `${catalog.origin_label} ↔ ${catalog.destination_label}`
      : 'fiche de ligne')
  return [
    `${label} ${line.code} — ${routeTitle}.`,
    lineStatus,
    blocks.length ? blocks.join('\n\n') : 'Aucun sens de circulation enregistré pour cette ligne.',
    sourceLine,
  ].filter(Boolean).join('\n')
}

function networkSummary(snapshot: MobilityBrainSnapshot, code: string, listAll: boolean, asksFrequency: boolean): string {
  const lines = linesForNetwork(snapshot, code).sort((a, b) => a.code.localeCompare(b.code, 'fr'))
  const directions = snapshot.directions.filter((direction) =>
    lines.some((line) => line.id === direction.line_id) && isUsableRecordStatus(direction.status)
  )
  const label = networkLabel(snapshot, code)
  const summary = `${label} : ${lines.length} lignes et ${directions.length} directions enregistrées dans la mémoire Supabase.`
  const codes = listAll
    ? `\nLignes : ${lines.map((line) => line.code).join(', ')}.`
    : ''
  if (!asksFrequency) {
    const tail = code === 'tata'
      ? '\nTATA conserve son catalogue de lignes distinct. Le repère de fréquence enregistré est partagé avec AFTU et n’est pas une mesure TATA autonome.'
      : '\nDemandez un numéro de ligne pour afficher ses deux sens et ses arrêts.'
    return `${summary}${codes}${tail}`
  }
  const patterns = snapshot.service_patterns.filter((pattern) =>
    isUsableRecordStatus(pattern.status)
    && directions.some((direction) => direction.id === pattern.direction_id)
  )
  const uniquePatterns = [...new Map<string, string>(patterns.map((pattern) => [
    [pattern.period_label, pattern.headway_min_minutes, pattern.headway_max_minutes, pattern.headway_minutes, pattern.expected_wait_minutes].join('|'),
    formatPattern(pattern),
  ] as [string, string])).values()]
  return `${summary}\nRepères de fréquence : ${uniquePatterns.slice(0, 5).join(' ; ') || 'non renseignés'}.${codes}\nUne fréquence de référence ne donne pas l’heure du prochain véhicule.`
}

function stopMatches(snapshot: MobilityBrainSnapshot, text: string): MobilityBrainStop[] {
  return snapshot.reference_stops
    .filter((stop) => isUsableRecordStatus(stop.status))
    .filter((stop) => [stop.canonical_name, ...(stop.aliases ?? [])].some((name) => {
      const candidate = normalize(name)
      return candidate.length >= 3 && text.includes(candidate)
    }))
    .sort((a, b) => (b.canonical_name?.length ?? 0) - (a.canonical_name?.length ?? 0))
}

function stopReply(
  snapshot: MobilityBrainSnapshot,
  matchedStops: MobilityBrainStop[],
  networkCode: string | null,
  asksTransfer: boolean,
): string {
  const targetIds = new Set(matchedStops.map((stop) => stop.id))
  const directionIds = new Set(snapshot.ordered_line_stops
    .filter((row) => targetIds.has(row.stop_id))
    .map((row) => row.direction_id))
  const directionRows = snapshot.directions.filter((direction) =>
    directionIds.has(direction.id) && isUsableRecordStatus(direction.status)
  )
  const lineById = new Map(snapshot.lines.filter((line) => isUsableRecordStatus(line.status)).map((line) => [line.id, line]))
  const networkById = new Map(snapshot.networks.map((network) => [network.id, network]))
  const uniqueLines = new Map<string, { network: string; code: string }>()
  for (const direction of directionRows) {
    const line = lineById.get(direction.line_id)
    const network = line ? networkById.get(line.network_id) : null
    if (!line || !network || (networkCode && network.code !== networkCode)) continue
    uniqueLines.set(`${network.code}:${line.code}`, { network: network.name, code: line.code })
  }
  const stopLabels = matchedStops.map((stop) => stop.canonical_name)
  const linesText = [...uniqueLines.values()]
    .sort((a, b) => a.network.localeCompare(b.network, 'fr') || a.code.localeCompare(b.code, 'fr'))
    .map((line) => `${line.network} ${line.code}`)
  const usableStopIds = new Set(snapshot.reference_stops
    .filter((stop) => isUsableRecordStatus(stop.status))
    .map((stop) => stop.id))
  const transferRows = snapshot.transfers.filter((transfer) =>
    isUsableRecordStatus(transfer.status)
    && usableStopIds.has(transfer.from_stop_id)
    && usableStopIds.has(transfer.to_stop_id)
    && (targetIds.has(transfer.from_stop_id) || targetIds.has(transfer.to_stop_id))
  )
  const transferText = asksTransfer
    ? transferRows.length
      ? `\nCorrespondances enregistrées : ${transferRows.map((transfer) => {
        const from = snapshot.reference_stops.find((stop) => stop.id === transfer.from_stop_id)?.canonical_name ?? 'arrêt'
        const to = snapshot.reference_stops.find((stop) => stop.id === transfer.to_stop_id)?.canonical_name ?? 'arrêt'
        const distance = transfer.walking_distance_m ? ` · ${transfer.walking_distance_m} m à pied` : ''
        return `${from} ↔ ${to}${distance} · statut ${transfer.status === 'published' ? 'publiée' : transfer.status === 'verified' ? 'vérifiée' : 'candidate à vérifier'}`
      }).join(' ; ')}. Leur statut doit être vérifié avant de les présenter comme garanties.`
      : '\nAucune correspondance piétonne enregistrée pour cet arrêt ; je ne déduis pas une correspondance du seul voisinage.'
    : ''
  if (!linesText.length) {
    return `${stopLabels.join(', ')} figure(nt) dans la mémoire des arrêts, mais aucune ligne active n’y est reliée dans ce réseau.${transferText}`
  }
  return `${stopLabels.join(', ')} : lignes enregistrées — ${linesText.join(', ')}.${transferText}\nLa présence dans le référentiel ne signifie pas qu’un véhicule est en approche.`
}

/**
 * Répond à partir du référentiel Supabase uniquement pour les demandes DDD,
 * AFTU, TATA ou les recherches de lignes/arrêts de bus. TER/BRT restent sur
 * le moteur local déjà validé.
 */
export function answerRemoteMobilityQuestion(
  question: string,
  snapshot: MobilityBrainSnapshot | null | undefined,
): string | null {
  if (!snapshot) return null
  const text = normalize(question)
  if (!text) return null

  const explicitNetwork = networkMention(text)
  const busIntent = Boolean(explicitNetwork)
    || /\b(bus|lignes?|arrets?|stations?|dessert|desserte|passage|frequence|horaire|horaires|correspondance|transfert|terminus)\b/.test(text)
  if (!busIntent) return null

  const code = lineCodeMention(text)
  if (code) {
    const candidates = snapshot.lines.filter((line) =>
      isUsableRecordStatus(line.status)
      && line.code.toLowerCase() === code && (!explicitNetwork
        || snapshot.networks.some((network) => network.id === line.network_id && network.code === explicitNetwork))
    )
    if (candidates.length > 1) {
      return `La ligne ${code.toUpperCase()} existe dans plusieurs réseaux du référentiel. Précisez DDD, AFTU ou TATA pour éviter de confondre les lignes.`
    }
    if (candidates.length === 1) {
      const line = candidates[0]
      const network = snapshot.networks.find((item) => item.id === line.network_id)
      return network ? lineReply(snapshot, line, network.code) : null
    }
    if (explicitNetwork) {
      return `Je ne trouve pas la ligne ${code.toUpperCase()} dans le catalogue ${networkLabel(snapshot, explicitNetwork)} actuellement chargé. Je ne la remplace pas par une ligne d’un autre réseau.`
    }
  }

  if (explicitNetwork) {
    const listAll = /\b(liste|quelles|quels|toutes|tous|enumerer)\b/.test(text)
    const asksFrequency = /\b(frequence|attente|passage|horaire|horaires|cadence)\b/.test(text)
    const stopHits = stopMatches(snapshot, text)
      .filter((stop) => snapshot.ordered_line_stops.some((row) => row.stop_id === stop.id))
    if (stopHits.length) return stopReply(snapshot, stopHits.slice(0, 2), explicitNetwork, /\b(correspondance|transfert)\b/.test(text))
    return networkSummary(snapshot, explicitNetwork, listAll, asksFrequency)
  }

  const hits = stopMatches(snapshot, text)
  if (hits.length) {
    return stopReply(snapshot, hits.slice(0, 2), null, /\b(correspondance|transfert)\b/.test(text))
  }

  return null
}
