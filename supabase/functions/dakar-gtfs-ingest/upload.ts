export const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
export const MAX_MANIFEST_BYTES = 1024 * 1024;
export const MAX_JSON_REQUEST_BYTES = MAX_MANIFEST_BYTES + 16 * 1024;
// Supabase signed upload tokens are valid for two hours and cannot be revoked individually.
// Keep failed sessions and their objects until 15 minutes after the token has expired.
export const SIGNED_UPLOAD_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
export const UPLOAD_SESSION_TTL_MS = SIGNED_UPLOAD_TOKEN_TTL_MS + 15 * 60 * 1000;

export function uploadSessionExpiryAfterTokenIssuedAt(tokenIssuedAtMs = Date.now()): string {
  if (!Number.isSafeInteger(tokenIssuedAtMs) || tokenIssuedAtMs < 0) {
    throw new RangeError("tokenIssuedAtMs must be a non-negative safe integer");
  }
  return new Date(tokenIssuedAtMs + UPLOAD_SESSION_TTL_MS).toISOString();
}

export function isUploadSessionExpired(expiresAt: unknown, now = Date.now()): boolean {
  if (typeof expiresAt !== "string" || !Number.isFinite(now)) return false;
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= now;
}

export function isExactBoundedObjectSize(
  actualValue: unknown,
  expectedBytes: number,
  maxBytes: number,
): boolean {
  const actualBytes = typeof actualValue === "number"
    ? actualValue
    : typeof actualValue === "string" && /^[0-9]+$/.test(actualValue)
    ? Number(actualValue)
    : Number.NaN;
  return Number.isSafeInteger(actualBytes) &&
    Number.isSafeInteger(expectedBytes) &&
    Number.isSafeInteger(maxBytes) &&
    expectedBytes > 0 &&
    maxBytes >= expectedBytes &&
    actualBytes === expectedBytes;
}

const DATASET_ID_RE = /^[a-z0-9][a-z0-9-]{0,119}$/;
const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_RE = /^[a-f0-9]{64}$/;
const SOURCE_TYPES = new Set(["OFFICIAL", "GTFS", "VERIFIED", "COMMUNITY", "UNKNOWN"]);
const SERVICE_STATUSES = new Set(["ACTIVE", "PLANNED", "SUSPENDED", "UNKNOWN"]);

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("REQUEST_BODY_TOO_LARGE");
    this.name = "RequestBodyTooLargeError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function hasExactKeys(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

export function isValidDatasetId(value: unknown): value is string {
  return typeof value === "string" && DATASET_ID_RE.test(value);
}

export function isValidUploadId(value: unknown): value is string {
  return typeof value === "string" && UPLOAD_ID_RE.test(value);
}

function isInstant(value: unknown): value is string {
  return typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

export function validManifest(value: unknown, datasetId: string): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const archive = value.archive;
  if (value.schema_version !== "1.0" || value.dataset_id !== datasetId) return false;
  if (value.publication_status !== "NOT_PUBLISHED" || value.publication_ready !== false) return false;
  if (value.review_status !== "PENDING_REVIEW") return false;
  const ingestedAt = value.ingested_at;
  const verifiedAt = value.verified_at;
  if (!isInstant(ingestedAt) || !isInstant(verifiedAt) ||
      Date.parse(verifiedAt) > Date.now() + 5 * 60 * 1000 ||
      Date.parse(verifiedAt) > Date.parse(ingestedAt)) return false;

  if (!isRecord(value.record_count)) return false;
  for (const count of Object.values(value.record_count)) {
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return false;
  }

  for (const key of ["dataset_version", "operator", "source"] as const) {
    if (typeof value[key] !== "string" || !value[key].trim()) return false;
  }
  if (typeof value.source_type !== "string" || !SOURCE_TYPES.has(value.source_type)) return false;
  if (typeof value.service_status !== "string" || !SERVICE_STATUSES.has(value.service_status)) return false;
  if (typeof value.date_source !== "string" || !value.date_source.trim()) return false;
  const validFrom = value.valid_from;
  const validUntil = value.valid_until;
  if (!isInstant(validFrom) || !isInstant(validUntil) ||
      Date.parse(validUntil) <= Date.parse(validFrom)) return false;
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) ||
      value.confidence < 0 || value.confidence > 1) return false;

  if (!isRecord(archive) || archive.stored_as !== "feed.zip") return false;
  if (typeof archive.bytes !== "number" || !Number.isSafeInteger(archive.bytes) ||
      archive.bytes <= 0 || archive.bytes > MAX_ARCHIVE_BYTES) return false;
  if (typeof archive.sha256 !== "string" || !SHA256_RE.test(archive.sha256)) return false;

  if (value.source_url !== null && value.source_url !== undefined) {
    if (typeof value.source_url !== "string") return false;
    try {
      const url = new URL(value.source_url);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Remove every importer-supplied validation attestation before the manifest is
 * persisted. The dedicated server worker creates the only trusted validation
 * report; importer row counts are also excluded from the stored manifest.
 */
export function sanitizeManifest(
  value: Record<string, unknown>,
  serverValidityStatus: "NOT_YET_VALID" | "STALE" | "CURRENT",
  serverIngestedAt: string,
): Record<string, unknown> {
  const archive = value.archive as Record<string, unknown>;
  // Persist only the documented provenance fields. Unknown importer fields,
  // alternate validation claims, counts and approval metadata never survive.
  return {
    schema_version: "1.0",
    dataset_id: value.dataset_id,
    dataset_version: value.dataset_version,
    operator: value.operator,
    source: value.source,
    source_type: value.source_type,
    ...(value.source_url === undefined ? {} : { source_url: value.source_url }),
    date_source: value.date_source,
    verified_at: value.verified_at,
    valid_from: value.valid_from,
    valid_until: value.valid_until,
    confidence: value.confidence,
    service_status: value.service_status,
    review_status: "PENDING_REVIEW",
    publication_status: "NOT_PUBLISHED",
    publication_ready: false,
    archive: {
      stored_as: "feed.zip",
      bytes: archive.bytes,
      sha256: archive.sha256,
    },
    validity_status: serverValidityStatus,
    ingested_at: serverIngestedAt,
  };
}

export function canonicalObjectPaths(datasetId: string, archiveSha256: string): {
  archivePath: string;
  manifestPath: string;
} {
  if (!isValidDatasetId(datasetId) || !SHA256_RE.test(archiveSha256)) {
    throw new RangeError("INVALID_CANONICAL_OBJECT_REFERENCE");
  }
  const root = `${datasetId}/${archiveSha256}`;
  return { archivePath: `${root}/feed.zip`, manifestPath: `${root}/manifest.json` };
}

/** Parse JSON while enforcing a limit on the bytes actually received, not only Content-Length. */
export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }
  if (!request.body) throw new TypeError("REQUEST_BODY_REQUIRED");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let completed = false;
  let cancelled = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        completed = true;
        break;
      }
      received += value.byteLength;
      if (received > maxBytes) {
        cancelled = true;
        try {
          await reader.cancel();
        } catch {
          // The byte limit remains authoritative if upstream cancellation fails.
        }
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    if (!completed && !cancelled) {
      try {
        await reader.cancel();
      } catch {
        // Preserve the original parsing/stream error.
      }
    }
    try {
      reader.releaseLock();
    } catch {
      // A stream implementation may already have released the reader.
    }
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(text);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // DOM/Deno type definitions distinguish ArrayBuffer from ArrayBufferLike.
  // Copy into an owned ArrayBuffer before passing the data to SubtleCrypto.
  const input = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(input).set(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export function isMatchingStagedRow(
  row: Record<string, unknown> | null,
  session: Record<string, unknown>,
): boolean {
  if (!row) return false;
  return row.archive_object_path === session.archive_object_path &&
    row.manifest_object_path === session.manifest_object_path &&
    row.archive_sha256 === session.archive_sha256 &&
    Number(row.archive_bytes) === Number(session.archive_bytes) &&
    row.manifest_sha256 === session.manifest_sha256;
}
