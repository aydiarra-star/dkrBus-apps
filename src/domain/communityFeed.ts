/** Same-origin, no-store shared Direct rue transport. No official verification. */
import { timedRequest, readJsonBody, type TimedRequestOptions } from './http'
import { isFreshTrafficInstant, trafficInstant } from './trafficFreshness'
import { isReportExpired, parseStreetReport, type StreetReport, type StreetReportDraft } from './streetReports'
import { assessStreetReport } from './communityTraffic'

export const COMMUNITY_API_PATH = '/api/traffic/community'
export const COMMUNITY_OWNERSHIP_KEY = 'dakar-bus:community-ownership'
const REPORT_ID = /^cr_[a-f0-9]{32}$/
const DELETE_KEY = /^[a-f0-9]{64}$/
const MAX_SHARED_REPORTS = 500
export interface CommunitySnapshot { generatedAt: string; reports: StreetReport[] }
export type CommunityOwnership = Record<string, { deleteKey: string; expiresAt: string }>

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function sharedReport(value: unknown): StreetReport | null {
  const raw = object(value)
  if (!raw || raw.shared !== true || typeof raw.id !== 'string' || !REPORT_ID.test(raw.id)) return null
  const report = parseStreetReport(raw)
  return report ? { ...report, shared: true } : null
}

export function parseCommunitySnapshot(value: unknown, now = Date.now()): CommunitySnapshot | null {
  const raw = object(value)
  if (!raw || raw.region !== 'Dakar' || raw.sharingAvailable !== true || raw.verification !== 'SELF_REPORTED_NOT_OFFICIAL'
    || !isFreshTrafficInstant(raw.generatedAt, now) || !Array.isArray(raw.reports) || raw.reports.length > MAX_SHARED_REPORTS) return null
  const reports: StreetReport[] = []
  const seen = new Set<string>()
  for (const item of raw.reports) {
    const report = sharedReport(item)
    if (!report || seen.has(report.id)) return null
    seen.add(report.id)
    if (!isReportExpired(report, now)) reports.push(report)
  }
  return { generatedAt: raw.generatedAt as string, reports }
}

export async function fetchCommunitySnapshot(options: TimedRequestOptions = {}): Promise<CommunitySnapshot> {
  return timedRequest(COMMUNITY_API_PATH, options, async (response) => {
    if (!response.ok) throw new Error('Partage Direct rue indisponible.')
    const result = parseCommunitySnapshot(await readJsonBody(response))
    if (!result) throw new Error('Réponse Direct rue invalide ou périmée.')
    return result
  })
}

async function mutate(path: string, method: 'POST' | 'DELETE', body: unknown, key: string | null, options: TimedRequestOptions) {
  const fetcher = options.fetcher ?? fetch
  return timedRequest(path, { ...options, fetcher: (input, init) => fetcher(input, {
    ...init, method, ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Dakar-Community': '1',
      ...(key ? { 'X-Dakar-Report-Key': key } : {}) },
  }) }, async (response) => {
    const payload = await readJsonBody(response)
    if (!response.ok) {
      // Do not echo arbitrary server/remote text into the Assistant or logs.
      throw new Error(response.status === 429 ? 'Trop de signalements ; réessayez dans une minute.'
        : response.status === 403 ? 'Seul l’auteur peut retirer ce signalement.' : 'Le partage Direct rue est indisponible ; votre signalement reste local.')
    }
    return payload
  })
}

export async function publishCommunityReport(draft: StreetReportDraft, options: TimedRequestOptions = {}) {
  const assessment = assessStreetReport(draft)
  if (!assessment.ok) throw new Error(assessment.reason)
  // Only explicitly selected form fields: no local ids, clocks, ownership or
  // automatic passenger GPS. Position is null unless attached by the author.
  const payload = object(await mutate(COMMUNITY_API_PATH, 'POST', assessment.value, null, options))
  const report = sharedReport(payload?.report)
  if (!report || isReportExpired(report) || typeof payload?.deleteKey !== 'string' || !DELETE_KEY.test(payload.deleteKey)) {
    throw new Error('Publication Direct rue non confirmée ; votre signalement reste local.')
  }
  return { report, deleteKey: payload.deleteKey }
}

export async function removeCommunityReport(id: string, key: string, options: TimedRequestOptions = {}): Promise<void> {
  if (!REPORT_ID.test(id) || !DELETE_KEY.test(key)) throw new Error('Seul l’auteur peut retirer ce signalement.')
  const result = object(await mutate(`${COMMUNITY_API_PATH}/${id}`, 'DELETE', null, key, options))
  if (result?.removed !== true) throw new Error('Retrait du signalement non confirmé.')
}

export function pruneCommunityOwnership(value: unknown, now = Date.now()): CommunityOwnership {
  const raw = object(value)
  const kept: CommunityOwnership = {}
  if (!raw) return kept
  for (const [id, item] of Object.entries(raw).slice(0, MAX_SHARED_REPORTS)) {
    const row = object(item)
    const expiry = trafficInstant(row?.expiresAt)
    if (REPORT_ID.test(id) && row && typeof row.deleteKey === 'string' && DELETE_KEY.test(row.deleteKey)
      && expiry !== null && expiry > now && expiry <= now + 60 * 60_000) {
      kept[id] = { deleteKey: row.deleteKey, expiresAt: row.expiresAt as string }
    }
  }
  return kept
}

export function readCommunityOwnership(storage: Storage | null, now = Date.now()): CommunityOwnership {
  if (!storage) return {}
  try {
    const kept = pruneCommunityOwnership(JSON.parse(storage.getItem(COMMUNITY_OWNERSHIP_KEY) ?? '{}'), now)
    writeCommunityOwnership(storage, kept, now)
    return kept
  } catch {
    try { storage.removeItem(COMMUNITY_OWNERSHIP_KEY) } catch { /* storage refused */ }
    return {}
  }
}

export function writeCommunityOwnership(storage: Storage | null, value: CommunityOwnership, now = Date.now()): void {
  try { storage?.setItem(COMMUNITY_OWNERSHIP_KEY, JSON.stringify(pruneCommunityOwnership(value, now))) } catch { /* session-only ownership */ }
}
