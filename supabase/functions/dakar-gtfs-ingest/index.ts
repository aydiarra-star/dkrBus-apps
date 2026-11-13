import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { classifyStagingObjectReferences, cleanupUploadedObjects, getExactlyOneFormValue, hasOnlyExpectedFormFields, inspectContentLength, readMultipartWithLimit, RequestBodyTooLargeError } from "./multipart.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "dakar-gtfs-staging";
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_ARCHIVE_BYTES + 2 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://aydiarra-star.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const DATASET_ID_RE = /^[a-z0-9][a-z0-9-]{0,119}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
const SOURCE_TYPES = new Set(["OFFICIAL", "GTFS", "VERIFIED", "COMMUNITY", "UNKNOWN"]);
const SERVICE_STATUSES = new Set(["ACTIVE", "PLANNED", "SUSPENDED", "UNKNOWN"]);

function headers(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function reply(status: number, body: Record<string, unknown>, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function isInstant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function validManifest(value: unknown, datasetId: string): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const m = value as Record<string, unknown>;
  const archive = m.archive;
  if (m.schema_version !== "1.0" || m.dataset_id !== datasetId) return false;
  if (m.publication_status !== "NOT_PUBLISHED" || m.publication_ready !== false) return false;
  if (m.review_status !== "PENDING_REVIEW") return false;
  if (!isInstant(m.ingested_at) || Date.parse(String(m.verified_at)) > Date.parse(String(m.ingested_at))) return false;
  // The manifest is importer-controlled metadata. Never trust a client-declared
  // validation status; only the separate trusted server validator may set integrity_status.
  if (!m.record_count || typeof m.record_count !== "object" || Array.isArray(m.record_count)) return false;
  for (const count of Object.values(m.record_count as Record<string, unknown>)) {
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return false;
  }
  for (const key of ["dataset_version", "operator", "source"] as const) {
    if (typeof m[key] !== "string" || !m[key].trim()) return false;
  }
  if (typeof m.source_type !== "string" || !SOURCE_TYPES.has(m.source_type)) return false;
  if (typeof m.service_status !== "string" || !SERVICE_STATUSES.has(m.service_status)) return false;
  if (typeof m.date_source !== "string" || !m.date_source.trim()) return false;
  if (!isInstant(m.verified_at) || !isInstant(m.valid_from) || !isInstant(m.valid_until)) return false;
  if (Date.parse(m.valid_until) <= Date.parse(m.valid_from)) return false;
  if (typeof m.confidence !== "number" || !Number.isFinite(m.confidence) || m.confidence < 0 || m.confidence > 1) return false;
  if (!archive || typeof archive !== "object" || Array.isArray(archive)) return false;
  const a = archive as Record<string, unknown>;
  if (a.stored_as !== "feed.zip" || typeof a.bytes !== "number" || !Number.isSafeInteger(a.bytes) || a.bytes <= 0) return false;
  if (typeof a.sha256 !== "string" || !SHA256_RE.test(a.sha256)) return false;
  if (m.source_url !== null && m.source_url !== undefined) {
    if (typeof m.source_url !== "string") return false;
    try {
      const url = new URL(m.source_url);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    } catch {
      return false;
    }
  }
  return true;
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
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return reply(503, { error: "SERVER_CONFIGURATION_MISSING" }, cors);

  const contentLength = inspectContentLength(req.headers.get("Content-Length"), MAX_REQUEST_BYTES);
  if (!contentLength.valid) {
    return reply(400, { error: "INVALID_CONTENT_LENGTH" }, cors);
  }
  if (contentLength.tooLarge) {
    return reply(413, { error: "REQUEST_TOO_LARGE", max_bytes: MAX_REQUEST_BYTES }, cors);
  }

  const bearer = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return reply(401, { error: "AUTHENTICATION_REQUIRED" }, cors);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await admin.auth.getUser(bearer);
  const user = userData?.user;
  if (authError || !user || !user.email_confirmed_at) {
    return reply(401, { error: "AUTHENTICATION_FAILED" }, cors);
  }

  const { data: actor, error: actorError } = await admin
    .from("dakar_admin_actors")
    .select("user_id, role, active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (actorError) return reply(503, { error: "ROLE_LOOKUP_FAILED" }, cors);
  if (!actor?.active || actor.role !== "reviewer") {
    return reply(403, { error: "REVIEWER_ROLE_REQUIRED" }, cors);
  }

  let form: FormData;
  try {
    form = await readMultipartWithLimit(req, MAX_REQUEST_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return reply(413, { error: "REQUEST_TOO_LARGE", max_bytes: MAX_REQUEST_BYTES }, cors);
    }
    return reply(400, { error: "MULTIPART_FORM_REQUIRED" }, cors);
  }

  if (!hasOnlyExpectedFormFields(form, ["feed", "manifest", "dataset_id"])) {
    return reply(400, { error: "UNEXPECTED_MULTIPART_FIELD" }, cors);
  }

  const archive = getExactlyOneFormValue(form, "feed");
  const manifestFile = getExactlyOneFormValue(form, "manifest");
  const datasetId = getExactlyOneFormValue(form, "dataset_id");
  if (!(archive instanceof File) || !(manifestFile instanceof File) || typeof datasetId !== "string" || !DATASET_ID_RE.test(datasetId)) {
    return reply(400, { error: "FEED_MANIFEST_AND_VALID_DATASET_ID_REQUIRED" }, cors);
  }
  if (archive.size <= 0 || archive.size > MAX_ARCHIVE_BYTES) {
    return reply(413, { error: "ARCHIVE_SIZE_OUT_OF_RANGE", max_bytes: MAX_ARCHIVE_BYTES }, cors);
  }
  if (manifestFile.size <= 0 || manifestFile.size > 1024 * 1024) {
    return reply(413, { error: "MANIFEST_SIZE_OUT_OF_RANGE", max_bytes: 1024 * 1024 }, cors);
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(await manifestFile.text());
  } catch {
    return reply(400, { error: "MANIFEST_INVALID_JSON" }, cors);
  }
  if (!validManifest(manifest, datasetId)) return reply(422, { error: "MANIFEST_SCHEMA_INVALID" }, cors);

  const archiveBytes = new Uint8Array(await archive.arrayBuffer());
  if (archiveBytes.byteLength !== archive.size || archiveBytes.byteLength < 4 ||
      archiveBytes[0] !== 0x50 || archiveBytes[1] !== 0x4b) {
    return reply(422, { error: "ARCHIVE_NOT_A_VALID_ZIP_HEADER" }, cors);
  }
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", archiveBytes));
  const actualSha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const declaredArchive = (manifest as Record<string, unknown>).archive as Record<string, unknown>;
  if (declaredArchive.bytes !== archiveBytes.byteLength || declaredArchive.sha256 !== actualSha256) {
    return reply(422, { error: "ARCHIVE_MANIFEST_CHECKSUM_MISMATCH" }, cors);
  }

  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const manifestDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", manifestBytes));
  const manifestSha256 = Array.from(manifestDigest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const objectRoot = `${datasetId}/${actualSha256}`;
  const archivePath = `${objectRoot}/feed.zip`;
  const manifestPath = `${objectRoot}/manifest.json`;

  const { error: archiveUploadError } = await admin.storage.from(BUCKET).upload(archivePath, archiveBytes, {
    contentType: "application/zip",
    upsert: false,
  });
  if (archiveUploadError) {
    return reply(409, { error: "ARCHIVE_UPLOAD_FAILED" }, cors);
  }

  const { error: manifestUploadError } = await admin.storage.from(BUCKET).upload(manifestPath, manifestBytes, {
    contentType: "application/json",
    upsert: false,
  });
  if (manifestUploadError) {
    const cleanupSucceeded = await cleanupUploadedObjects(
      (paths) => admin.storage.from(BUCKET).remove(paths),
      [archivePath],
    );
    return cleanupSucceeded
      ? reply(500, { error: "MANIFEST_UPLOAD_FAILED" }, cors)
      : reply(500, { error: "MANIFEST_UPLOAD_FAILED_CLEANUP_INCOMPLETE" }, cors);
  }

  const m = manifest as Record<string, unknown>;
  const { error: insertError } = await admin.from("dakar_admin_staged_datasets").insert({
    dataset_id: datasetId,
    dataset_version: m.dataset_version,
    operator: m.operator,
    source: m.source,
    source_type: m.source_type,
    source_url: m.source_url ?? null,
    date_source: m.date_source,
    verified_at: m.verified_at,
    valid_from: m.valid_from,
    valid_until: m.valid_until,
    confidence: m.confidence,
    service_status: m.service_status,
    validity_status: Date.now() < Date.parse(String(m.valid_from))
      ? "NOT_YET_VALID"
      : Date.now() >= Date.parse(String(m.valid_until)) ? "STALE" : "CURRENT",
    archive_bucket: BUCKET,
    archive_object_path: archivePath,
    manifest_object_path: manifestPath,
    archive_sha256: actualSha256,
    archive_bytes: archiveBytes.byteLength,
    manifest_sha256: manifestSha256,
    record_count: {},
    validation_report: {
      status: "PENDING_SERVER_VALIDATION",
      note: "The upload checksum was verified. Full GTFS structure and cross-reference validation has not run.",
    },
    integrity_status: "PENDING_SERVER_CHECK",
    review_status: "PENDING_REVIEW",
    publication_status: "NOT_PUBLISHED",
    imported_by: user.id,
  });

  if (insertError) {
    // A network error can occur after Postgres committed the insert. Resolve the
    // outcome before deleting any object that a committed row may reference.
    const { data: existing, error: lookupError } = await admin
      .from("dakar_admin_staged_datasets")
      .select("archive_object_path, manifest_object_path")
      .eq("dataset_id", datasetId)
      .maybeSingle();

    if (lookupError) {
      return reply(503, { error: "STAGING_REGISTRATION_OUTCOME_UNKNOWN" }, cors);
    }

    const references = classifyStagingObjectReferences(existing, archivePath, manifestPath);
    if (references === "BOTH") {
      return reply(409, { error: "DATASET_ALREADY_REGISTERED" }, cors);
    }
    if (references === "PARTIAL") {
      return reply(503, { error: "STAGING_REGISTRATION_OUTCOME_UNKNOWN" }, cors);
    }

    const cleanupSucceeded = await cleanupUploadedObjects(
      (paths) => admin.storage.from(BUCKET).remove(paths),
      [archivePath, manifestPath],
    );
    return cleanupSucceeded
      ? reply(409, { error: "STAGING_REGISTRATION_FAILED" }, cors)
      : reply(500, { error: "STAGING_REGISTRATION_FAILED_CLEANUP_INCOMPLETE" }, cors);
  }

  return reply(202, {
    accepted: true,
    dataset_id: datasetId,
    archive_sha256: actualSha256,
    manifest_sha256: manifestSha256,
    integrity_status: "PENDING_SERVER_CHECK",
    review_status: "PENDING_REVIEW",
    publication_status: "NOT_PUBLISHED",
    next_step: "A separate trusted validator must inspect the ZIP contents before integrity_status can become OK.",
  }, cors);
});
