import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { isDakarBusSupabaseUrl } from "./project.ts";
import {
  cleanupUploadedObjects,
  classifyStagingObjectReferences,
  inspectContentLength,
} from "./multipart.ts";
import {
  canonicalObjectPaths,
  hasExactKeys,
  isMatchingStagedRow,
  isRecord,
  isValidDatasetId,
  isValidUploadId,
  MAX_ARCHIVE_BYTES,
  MAX_JSON_REQUEST_BYTES,
  MAX_MANIFEST_BYTES,
  readJsonWithLimit,
  RequestBodyTooLargeError,
  sanitizeManifest,
  sha256Hex,
  UPLOAD_SESSION_TTL_MS,
  validManifest,
} from "./upload.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "dakar-gtfs-staging";
const STAGED_TABLE = "dakar_admin_staged_datasets";
const UPLOAD_TABLE = "dakar_admin_gtfs_upload_sessions";
const ALLOWED_ORIGINS = new Set([
  "https://aydiarra-star.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

type UploadSession = Record<string, unknown> & {
  upload_id: string;
  dataset_id: string;
  archive_object_path: string;
  manifest_object_path: string;
  archive_sha256: string;
  archive_bytes: number;
  manifest_sha256: string;
  manifest_text?: string;
  imported_by: string;
  expires_at: string;
  state: string;
};

function headers(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Pragma": "no-cache",
  };
}

function reply(status: number, body: Record<string, unknown>, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function validityStatus(validFrom: unknown, validUntil: unknown): "NOT_YET_VALID" | "STALE" | "CURRENT" {
  const now = Date.now();
  if (now < Date.parse(String(validFrom))) return "NOT_YET_VALID";
  if (now >= Date.parse(String(validUntil))) return "STALE";
  return "CURRENT";
}

async function authenticateReviewer(req: Request, admin: ReturnType<typeof createClient>) {
  const bearer = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return { user: null, status: 401, error: "AUTHENTICATION_REQUIRED" };

  const { data: userData, error: authError } = await admin.auth.getUser(bearer);
  const user = userData?.user;
  if (authError || !user || !user.email_confirmed_at) {
    return { user: null, status: 401, error: "AUTHENTICATION_FAILED" };
  }

  const { data: actor, error: actorError } = await admin
    .from("dakar_admin_actors")
    .select("user_id, role, active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (actorError) return { user: null, status: 503, error: "ROLE_LOOKUP_FAILED" };
  if (!actor?.active || actor.role !== "reviewer") {
    return { user: null, status: 403, error: "REVIEWER_ROLE_REQUIRED" };
  }
  return { user, status: 200, error: null };
}

async function markSession(
  admin: ReturnType<typeof createClient>,
  uploadId: string,
  state: "FINALIZED" | "FAILED",
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await admin.from(UPLOAD_TABLE).update({
    state,
    finalized_at: state === "FINALIZED" ? now : null,
    ...(state === "FAILED" ? { expires_at: now } : {}),
  }).eq("upload_id", uploadId);
  return !error;
}

/**
 * Delete only objects proven not to be referenced by a staged dataset.
 * Any uncertain database outcome preserves both objects and the session.
 */
async function cleanupSession(
  admin: ReturnType<typeof createClient>,
  session: UploadSession,
): Promise<boolean> {
  const { data: existing, error: lookupError } = await admin
    .from(STAGED_TABLE)
    .select("archive_object_path, manifest_object_path, archive_sha256, archive_bytes, manifest_sha256")
    .eq("dataset_id", session.dataset_id)
    .maybeSingle();
  if (lookupError) return false;

  const references = classifyStagingObjectReferences(
    existing,
    session.archive_object_path,
    session.manifest_object_path,
  );
  if (references === "BOTH") {
    if (isMatchingStagedRow(existing as Record<string, unknown>, session)) {
      await markSession(admin, session.upload_id, "FINALIZED");
      return true;
    }
    return false;
  }
  if (references === "PARTIAL") return false;

  const cleaned = await cleanupUploadedObjects(
    (paths) => admin.storage.from(BUCKET).remove(paths),
    [session.archive_object_path, session.manifest_object_path],
  );
  if (!cleaned) return false;

  const { error: deleteError } = await admin
    .from(UPLOAD_TABLE)
    .delete()
    .eq("upload_id", session.upload_id);
  return !deleteError;
}

async function cleanupExpiredSessions(admin: ReturnType<typeof createClient>): Promise<void> {
  const { data: sessions, error } = await admin
    .from(UPLOAD_TABLE)
    .select("upload_id, dataset_id, archive_object_path, manifest_object_path, archive_sha256, archive_bytes, manifest_sha256, expires_at, state")
    .in("state", ["UPLOAD_PENDING", "FAILED"])
    .lt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(25);
  if (error || !sessions) return;

  for (const value of sessions) {
    const session = value as UploadSession;
    await cleanupSession(admin, session);
  }
}

async function getStagedRow(admin: ReturnType<typeof createClient>, datasetId: string) {
  return await admin
    .from(STAGED_TABLE)
    .select("dataset_id, archive_object_path, manifest_object_path, archive_sha256, archive_bytes, manifest_sha256")
    .eq("dataset_id", datasetId)
    .maybeSingle();
}

async function ensureManifestObject(
  admin: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array,
  expectedSha256: string,
): Promise<boolean> {
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/json",
    cacheControl: "3600",
    upsert: false,
  });
  if (!uploadError) return true;

  // A concurrent or retried finalization may have created the same immutable
  // manifest. Accept it only after downloading and hashing the exact bytes.
  const { data: existing, error: downloadError } = await admin.storage.from(BUCKET).download(path);
  if (downloadError || !existing) return false;
  try {
    const existingBytes = new Uint8Array(await existing.arrayBuffer());
    return existingBytes.byteLength <= MAX_MANIFEST_BYTES &&
      await sha256Hex(existingBytes) === expectedSha256 &&
      existingBytes.byteLength === bytes.byteLength &&
      existingBytes.every((byte, index) => byte === bytes[index]);
  } catch {
    return false;
  }
}

function sameInstant(left: unknown, right: unknown): boolean {
  const leftMs = Date.parse(String(left));
  const rightMs = Date.parse(String(right));
  return Number.isFinite(leftMs) && Number.isFinite(rightMs) && leftMs === rightMs;
}

function sessionManifestMatches(session: UploadSession, manifest: Record<string, unknown>): boolean {
  const archive = manifest.archive as Record<string, unknown>;
  return manifest.dataset_version === session.dataset_version &&
    manifest.operator === session.operator &&
    manifest.source === session.source &&
    manifest.source_type === session.source_type &&
    (manifest.source_url ?? null) === (session.source_url ?? null) &&
    manifest.date_source === session.date_source &&
    sameInstant(manifest.verified_at, session.verified_at) &&
    sameInstant(manifest.valid_from, session.valid_from) &&
    sameInstant(manifest.valid_until, session.valid_until) &&
    manifest.validity_status === session.validity_status &&
    Math.round(Number(manifest.confidence) * 1000) / 1000 === Number(session.confidence) &&
    manifest.service_status === session.service_status &&
    Number(archive.bytes) === Number(session.archive_bytes) &&
    archive.sha256 === session.archive_sha256;
}

function acceptedResponse(session: UploadSession, cors: Record<string, string>, sessionStateUpdated: boolean) {
  return reply(202, {
    accepted: true,
    dataset_id: session.dataset_id,
    archive_sha256: session.archive_sha256,
    manifest_sha256: session.manifest_sha256,
    integrity_status: "PENDING_SERVER_CHECK",
    review_status: "PENDING_REVIEW",
    publication_status: "NOT_PUBLISHED",
    session_state_update_pending: !sessionStateUpdated,
    next_step: "The dedicated server worker must hash and structurally validate the private ZIP before integrity_status can become OK.",
  }, cors);
}

async function createUpload(
  body: Record<string, unknown>,
  user: { id: string },
  admin: ReturnType<typeof createClient>,
  cors: Record<string, string>,
): Promise<Response> {
  if (!hasExactKeys(body, ["action", "dataset_id", "manifest"]) ||
      body.action !== "create_upload" || !isValidDatasetId(body.dataset_id)) {
    return reply(400, { error: "UPLOAD_COMMAND_INVALID" }, cors);
  }
  const datasetId = String(body.dataset_id);
  if (!validManifest(body.manifest, datasetId)) {
    return reply(422, { error: "MANIFEST_SCHEMA_INVALID" }, cors);
  }

  const inputManifest = body.manifest as Record<string, unknown>;
  const serverIngestedAt = new Date().toISOString();
  const serverValidityStatus = validityStatus(inputManifest.valid_from, inputManifest.valid_until);
  const manifest = sanitizeManifest(inputManifest, serverValidityStatus, serverIngestedAt);
  let manifestText: string;
  try {
    const serialized = JSON.stringify(manifest);
    if (typeof serialized !== "string") return reply(400, { error: "MANIFEST_SERIALIZATION_FAILED" }, cors);
    manifestText = serialized;
  } catch {
    return reply(400, { error: "MANIFEST_SERIALIZATION_FAILED" }, cors);
  }
  const manifestBytes = new TextEncoder().encode(manifestText);
  if (manifestBytes.byteLength <= 0 || manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
    return reply(413, { error: "MANIFEST_SIZE_OUT_OF_RANGE", max_bytes: MAX_MANIFEST_BYTES }, cors);
  }
  const manifestSha256 = await sha256Hex(manifestBytes);
  const archive = manifest.archive as Record<string, unknown>;
  const paths = canonicalObjectPaths(datasetId, String(archive.sha256));

  await cleanupExpiredSessions(admin);

  const { data: staged, error: stagedLookupError } = await getStagedRow(admin, datasetId);
  if (stagedLookupError) return reply(503, { error: "STAGING_LOOKUP_FAILED" }, cors);
  if (staged) return reply(409, { error: "DATASET_ALREADY_REGISTERED" }, cors);

  const { data: existingSession, error: sessionLookupError } = await admin
    .from(UPLOAD_TABLE)
    .select("upload_id, state, expires_at")
    .eq("dataset_id", datasetId)
    .maybeSingle();
  if (sessionLookupError) return reply(503, { error: "UPLOAD_SESSION_LOOKUP_FAILED" }, cors);
  if (existingSession) return reply(409, { error: "UPLOAD_SESSION_ALREADY_EXISTS" }, cors);

  const { data: existingObjects, error: objectLookupError } = await admin.storage
    .from(BUCKET)
    .list(`${datasetId}/${archive.sha256}`, { limit: 10 });
  if (objectLookupError) return reply(503, { error: "STORAGE_PATH_LOOKUP_FAILED" }, cors);
  if (existingObjects?.length) return reply(409, { error: "CANONICAL_STORAGE_PATH_ALREADY_EXISTS" }, cors);

  const now = Date.now();
  const expiresAt = new Date(now + UPLOAD_SESSION_TTL_MS).toISOString();
  const { data: session, error: insertError } = await admin.from(UPLOAD_TABLE).insert({
    dataset_id: datasetId,
    dataset_version: manifest.dataset_version,
    operator: manifest.operator,
    source: manifest.source,
    source_type: manifest.source_type,
    source_url: manifest.source_url ?? null,
    date_source: manifest.date_source,
    verified_at: manifest.verified_at,
    valid_from: manifest.valid_from,
    valid_until: manifest.valid_until,
    confidence: manifest.confidence,
    service_status: manifest.service_status,
    validity_status: serverValidityStatus,
    archive_object_path: paths.archivePath,
    manifest_object_path: paths.manifestPath,
    archive_sha256: archive.sha256,
    archive_bytes: archive.bytes,
    manifest_sha256: manifestSha256,
    manifest_text: manifestText,
    imported_by: user.id,
    expires_at: expiresAt,
  }).select("upload_id, dataset_id, archive_object_path, archive_bytes, archive_sha256, expires_at").single();

  if (insertError || !session) {
    return reply(409, { error: "UPLOAD_SESSION_CREATE_FAILED" }, cors);
  }

  const { data: signedUpload, error: signedUploadError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(paths.archivePath, { upsert: false });
  if (signedUploadError || !signedUpload?.token) {
    const { error: deleteError } = await admin.from(UPLOAD_TABLE).delete().eq("upload_id", session.upload_id);
    if (deleteError) {
      await admin.from(UPLOAD_TABLE).update({
        state: "FAILED",
        expires_at: new Date().toISOString(),
      }).eq("upload_id", session.upload_id);
    }
    return reply(503, { error: "SIGNED_UPLOAD_URL_CREATION_FAILED" }, cors);
  }

  return reply(201, {
    upload_id: session.upload_id,
    bucket: BUCKET,
    path: paths.archivePath,
    token: signedUpload.token,
    upload_method: "uploadToSignedUrl",
    content_type: "application/zip",
    archive_bytes: archive.bytes,
    archive_sha256: archive.sha256,
    max_archive_bytes: MAX_ARCHIVE_BYTES,
    expires_at: expiresAt,
    signed_url_validity_seconds: 7200,
  }, cors);
}

async function finalizeUpload(
  body: Record<string, unknown>,
  user: { id: string },
  admin: ReturnType<typeof createClient>,
  cors: Record<string, string>,
): Promise<Response> {
  if (!hasExactKeys(body, ["action", "upload_id"]) ||
      body.action !== "finalize_upload" || !isValidUploadId(body.upload_id)) {
    return reply(400, { error: "FINALIZE_COMMAND_INVALID" }, cors);
  }

  const { data: rawSession, error: sessionError } = await admin
    .from(UPLOAD_TABLE)
    .select("*")
    .eq("upload_id", body.upload_id)
    .maybeSingle();
  if (sessionError) return reply(503, { error: "UPLOAD_SESSION_LOOKUP_FAILED" }, cors);
  if (!rawSession) return reply(404, { error: "UPLOAD_SESSION_NOT_FOUND" }, cors);

  const session = rawSession as UploadSession;
  if (session.imported_by !== user.id) return reply(403, { error: "UPLOAD_SESSION_OWNER_REQUIRED" }, cors);

  const { data: existing, error: stagedLookupError } = await getStagedRow(admin, session.dataset_id);
  if (stagedLookupError) return reply(503, { error: "STAGING_LOOKUP_FAILED" }, cors);
  if (existing && isMatchingStagedRow(existing as Record<string, unknown>, session)) {
    const updated = await markSession(admin, session.upload_id, "FINALIZED");
    return acceptedResponse(session, cors, updated);
  }
  if (existing) {
    return reply(409, { error: "DATASET_ALREADY_REGISTERED_WITH_DIFFERENT_OBJECTS" }, cors);
  }

  if (session.state !== "UPLOAD_PENDING") {
    return reply(410, { error: "UPLOAD_SESSION_NOT_ACTIVE" }, cors);
  }
  if (!Number.isFinite(Date.parse(session.expires_at)) || Date.parse(session.expires_at) <= Date.now()) {
    const cleaned = await cleanupSession(admin, session);
    return reply(cleaned ? 410 : 503, {
      error: cleaned ? "UPLOAD_SESSION_EXPIRED" : "UPLOAD_SESSION_EXPIRED_CLEANUP_PENDING",
    }, cors);
  }

  const paths = canonicalObjectPaths(session.dataset_id, session.archive_sha256);
  if (session.archive_object_path !== paths.archivePath ||
      session.manifest_object_path !== paths.manifestPath ||
      !Number.isSafeInteger(Number(session.archive_bytes)) ||
      Number(session.archive_bytes) <= 0 ||
      Number(session.archive_bytes) > MAX_ARCHIVE_BYTES) {
    await markSession(admin, session.upload_id, "FAILED");
    return reply(500, { error: "UPLOAD_SESSION_INTEGRITY_INVALID" }, cors);
  }

  if (typeof session.manifest_text !== "string") {
    await markSession(admin, session.upload_id, "FAILED");
    return reply(500, { error: "STORED_MANIFEST_MISSING" }, cors);
  }
  const manifestBytes = new TextEncoder().encode(session.manifest_text);
  if (manifestBytes.byteLength <= 0 || manifestBytes.byteLength > MAX_MANIFEST_BYTES ||
      await sha256Hex(manifestBytes) !== session.manifest_sha256) {
    await markSession(admin, session.upload_id, "FAILED");
    return reply(500, { error: "STORED_MANIFEST_INTEGRITY_INVALID" }, cors);
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(session.manifest_text);
  } catch {
    await markSession(admin, session.upload_id, "FAILED");
    return reply(500, { error: "STORED_MANIFEST_JSON_INVALID" }, cors);
  }
  if (!validManifest(manifest, session.dataset_id) ||
      !sessionManifestMatches(session, manifest as Record<string, unknown>)) {
    await markSession(admin, session.upload_id, "FAILED");
    return reply(500, { error: "STORED_MANIFEST_SESSION_MISMATCH" }, cors);
  }

  const { data: archiveInfo, error: archiveInfoError } = await admin.storage
    .from(BUCKET)
    .info(session.archive_object_path);
  if (archiveInfoError || !archiveInfo) {
    return reply(409, { error: "ARCHIVE_UPLOAD_NOT_COMPLETE" }, cors);
  }
  const actualArchiveBytes = Number(archiveInfo.size);
  if (!Number.isSafeInteger(actualArchiveBytes) ||
      actualArchiveBytes !== Number(session.archive_bytes) ||
      actualArchiveBytes <= 0 ||
      actualArchiveBytes > MAX_ARCHIVE_BYTES) {
    const cleaned = await cleanupSession(admin, session);
    return reply(cleaned ? 422 : 503, {
      error: cleaned ? "ARCHIVE_ACTUAL_SIZE_MISMATCH" : "ARCHIVE_SIZE_MISMATCH_CLEANUP_PENDING",
    }, cors);
  }

  const manifestStored = await ensureManifestObject(
    admin,
    session.manifest_object_path,
    manifestBytes,
    session.manifest_sha256,
  );
  if (!manifestStored) {
    const cleaned = await cleanupSession(admin, session);
    return reply(cleaned ? 500 : 503, {
      error: cleaned ? "MANIFEST_STORAGE_FAILED" : "MANIFEST_STORAGE_FAILED_CLEANUP_PENDING",
    }, cors);
  }

  const { error: insertError } = await admin.from(STAGED_TABLE).insert({
    dataset_id: session.dataset_id,
    dataset_version: session.dataset_version,
    operator: session.operator,
    source: session.source,
    source_type: session.source_type,
    source_url: session.source_url ?? null,
    date_source: session.date_source,
    verified_at: session.verified_at,
    valid_from: session.valid_from,
    valid_until: session.valid_until,
    confidence: session.confidence,
    service_status: session.service_status,
    validity_status: session.validity_status,
    archive_bucket: BUCKET,
    archive_object_path: session.archive_object_path,
    manifest_object_path: session.manifest_object_path,
    archive_sha256: session.archive_sha256,
    archive_bytes: actualArchiveBytes,
    manifest_sha256: session.manifest_sha256,
    imported_by: user.id,
  });

  if (insertError) {
    const { data: existingAfterInsert, error: lookupError } = await getStagedRow(admin, session.dataset_id);
    if (lookupError) {
      return reply(503, { error: "STAGING_REGISTRATION_OUTCOME_UNKNOWN" }, cors);
    }
    if (existingAfterInsert && isMatchingStagedRow(existingAfterInsert as Record<string, unknown>, session)) {
      const updated = await markSession(admin, session.upload_id, "FINALIZED");
      return acceptedResponse(session, cors, updated);
    }

    const references = classifyStagingObjectReferences(
      existingAfterInsert,
      session.archive_object_path,
      session.manifest_object_path,
    );
    if (references !== "NONE") {
      return reply(503, { error: "STAGING_REGISTRATION_REFERENCE_CONFLICT" }, cors);
    }
    const cleaned = await cleanupSession(admin, session);
    return reply(cleaned ? 409 : 503, {
      error: cleaned ? "STAGING_REGISTRATION_FAILED" : "STAGING_REGISTRATION_CLEANUP_PENDING",
    }, cors);
  }

  const updated = await markSession(admin, session.upload_id, "FINALIZED");
  return acceptedResponse(session, cors, updated);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const cors = headers(origin);

  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return reply(403, { error: "ORIGIN_FORBIDDEN" }, cors);
    return new Response(null, { status: 204, headers: cors });
  }
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return reply(403, { error: "ORIGIN_FORBIDDEN" }, cors);
  if (req.method !== "POST") return reply(405, { error: "METHOD_NOT_ALLOWED" }, cors);
  if (!isDakarBusSupabaseUrl(SUPABASE_URL)) {
    return reply(503, { error: "DAKAR_BUS_PROJECT_CONFIGURATION_INVALID" }, cors);
  }
  if (!SERVICE_ROLE_KEY) return reply(503, { error: "SERVER_CONFIGURATION_MISSING" }, cors);

  const contentType = req.headers.get("Content-Type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return reply(415, { error: "APPLICATION_JSON_REQUIRED" }, cors);
  }
  const contentLength = inspectContentLength(req.headers.get("Content-Length"), MAX_JSON_REQUEST_BYTES);
  if (!contentLength.valid) return reply(400, { error: "INVALID_CONTENT_LENGTH" }, cors);
  if (contentLength.tooLarge) {
    return reply(413, { error: "REQUEST_TOO_LARGE", max_bytes: MAX_JSON_REQUEST_BYTES }, cors);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const auth = await authenticateReviewer(req, admin);
    if (!auth.user) return reply(auth.status, { error: auth.error }, cors);

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_JSON_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return reply(413, { error: "REQUEST_TOO_LARGE", max_bytes: MAX_JSON_REQUEST_BYTES }, cors);
      }
      return reply(400, { error: "JSON_BODY_INVALID" }, cors);
    }
    if (!isRecord(body) || typeof body.action !== "string") {
      return reply(400, { error: "JSON_COMMAND_REQUIRED" }, cors);
    }

    if (body.action === "create_upload") {
      return await createUpload(body, auth.user, admin, cors);
    }
    if (body.action === "finalize_upload") {
      return await finalizeUpload(body, auth.user, admin, cors);
    }
    return reply(400, { error: "UNKNOWN_UPLOAD_ACTION" }, cors);
  } catch {
    return reply(500, { error: "GTFS_INTAKE_INTERNAL_ERROR" }, cors);
  }
});
