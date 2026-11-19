import {
  bytesEqual,
  canonicalObjectPaths,
  hasExactKeys,
  isMatchingStagedRow,
  isValidDatasetId,
  isValidUploadId,
  MAX_ARCHIVE_BYTES,
  MAX_MANIFEST_BYTES,
  isUploadSessionExpired,
  isExactBoundedObjectSize,
  readJsonWithLimit,
  SIGNED_UPLOAD_TOKEN_TTL_MS,
  SIGNED_UPLOAD_ISSUANCE_SAFETY_MARGIN_MS,
  TUS_UPLOAD_URL_TTL_MS,
  UPLOAD_CLEANUP_GRACE_MS,
  UPLOAD_SESSION_TTL_MS,
  RequestBodyTooLargeError,
  sanitizeManifest,
  sha256Hex,
  signedTusHeaders,
  uploadSessionExpiryAfterTokenIssuedAt,
  validManifest,
} from "./upload.ts";

function syntheticManifest(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "1.0",
    dataset_id: "synthetic-feed",
    dataset_version: "synthetic-v1",
    operator: "Synthetic test operator",
    source: "CI fixture only",
    source_type: "UNKNOWN",
    source_url: null,
    date_source: "CI fixture",
    verified_at: "2026-11-19T10:00:00Z",
    ingested_at: "2026-11-19T10:01:00Z",
    valid_from: "2026-11-19T00:00:00Z",
    valid_until: "2026-12-31T23:59:59Z",
    confidence: 0.5,
    service_status: "UNKNOWN",
    record_count: { routes: 1, stops: 2 },
    review_status: "PENDING_REVIEW",
    publication_status: "NOT_PUBLISHED",
    publication_ready: false,
    archive: { stored_as: "feed.zip", bytes: 128, sha256: "a".repeat(64) },
    ...overrides,
  };
}

Deno.test("accepts a structurally well-formed synthetic intake manifest", () => {
  if (!validManifest(syntheticManifest(), "synthetic-feed")) {
    throw new Error("A valid synthetic manifest was rejected");
  }
});

Deno.test("rejects a manifest for another dataset or a client-approved status", () => {
  if (validManifest(syntheticManifest(), "other-feed")) {
    throw new Error("A manifest bound to another dataset was accepted");
  }
  if (validManifest(syntheticManifest({ review_status: "APPROVED" }), "synthetic-feed")) {
    throw new Error("A client-supplied approval status was accepted");
  }
  if (validManifest(syntheticManifest({ publication_ready: true }), "synthetic-feed")) {
    throw new Error("A client-supplied publication-ready flag was accepted");
  }
});

Deno.test("rejects oversized archive declarations and malformed SHA-256", () => {
  if (validManifest(syntheticManifest({
    archive: { stored_as: "feed.zip", bytes: MAX_ARCHIVE_BYTES + 1, sha256: "a".repeat(64) },
  }), "synthetic-feed")) {
    throw new Error("An archive larger than the bucket limit was accepted");
  }
  if (validManifest(syntheticManifest({
    archive: { stored_as: "feed.zip", bytes: 128, sha256: "not-a-hash" },
  }), "synthetic-feed")) {
    throw new Error("A malformed archive digest was accepted");
  }
});

Deno.test("rejects a future verified_at even when the importer also claims a future ingestion time", () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  if (validManifest(syntheticManifest({ verified_at: future, ingested_at: future }), "synthetic-feed")) {
    throw new Error("A future verification timestamp was accepted");
  }
});

Deno.test("rejects unsafe source URLs and inverted validity periods", () => {
  if (validManifest(syntheticManifest({ source_url: "javascript:alert(1)" }), "synthetic-feed")) {
    throw new Error("A non-HTTP source URL was accepted");
  }
  if (validManifest(syntheticManifest({ source_url: "https://user:pass@example.invalid/feed.zip" }), "synthetic-feed")) {
    throw new Error("A source URL containing credentials was accepted");
  }
  if (validManifest(syntheticManifest({
    valid_from: "2026-12-31T00:00:00Z",
    valid_until: "2026-11-19T00:00:00Z",
  }), "synthetic-feed")) {
    throw new Error("An inverted validity period was accepted");
  }
});

Deno.test("removes importer-supplied validation reports and row counts", () => {
  const sanitized = sanitizeManifest(syntheticManifest({
    validation: { status: "STRUCTURALLY_VALID", report: { structure_valid: true } },
    integrity_status: "OK",
    validation_report: { structure_valid: true },
    validator_version: "client-controlled",
    structure_valid: true,
    production_ready: true,
    approved_by: "attacker",
    server_validation: { integrity_status: "OK" },
    unknown_extension: { trusted: true },
    archive: { stored_as: "feed.zip", bytes: 128, sha256: "a".repeat(64), validation: "OK" },
  }), "CURRENT", "2026-11-19T12:00:00.000Z");
  for (const key of [
    "validation", "record_count", "integrity_status", "validation_report",
    "validator_version", "structure_valid", "production_ready",
  ]) {
    if (Object.hasOwn(sanitized, key)) {
      throw new Error(`Importer-supplied validation field was retained: ${key}`);
    }
  }
  if (sanitized.validity_status !== "CURRENT") {
    throw new Error("Server-computed validity status was not stored");
  }
  if (sanitized.ingested_at !== "2026-11-19T12:00:00.000Z") {
    throw new Error("The importer-controlled ingestion time was not replaced by the server time");
  }
  if (sanitized.approved_by !== undefined || sanitized.server_validation !== undefined ||
      sanitized.unknown_extension !== undefined) {
    throw new Error("Unknown or alternate importer attestations were retained");
  }
  if (sanitized.review_status !== "PENDING_REVIEW" ||
      sanitized.publication_status !== "NOT_PUBLISHED" ||
      sanitized.publication_ready !== false) {
    throw new Error("Server-owned review and publication states were not fixed to quarantine");
  }
  if (Object.keys(sanitized.archive as Record<string, unknown>).sort().join(",") !== "bytes,sha256,stored_as") {
    throw new Error("Unknown archive metadata was retained");
  }

});

Deno.test("uses only canonical server-generated object paths", () => {
  const paths = canonicalObjectPaths("synthetic-feed", "a".repeat(64));
  if (paths.archivePath !== `synthetic-feed/${"a".repeat(64)}/feed.zip` ||
      paths.manifestPath !== `synthetic-feed/${"a".repeat(64)}/manifest.json`) {
    throw new Error("Canonical GTFS object paths changed");
  }
  for (const [datasetId, sha] of [["../escape", "a".repeat(64)], ["synthetic-feed", "../escape"]]) {
    let rejected = false;
    try {
      canonicalObjectPaths(datasetId, sha);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("An unsafe object path component was accepted");
  }
});

Deno.test("validates dataset and upload identifiers", () => {
  if (!isValidDatasetId("synthetic-feed") || isValidDatasetId("../feed")) {
    throw new Error("Dataset identifier validation is incorrect");
  }
  if (!isValidUploadId("8b3c0e51-5e42-4f5c-9a0a-2d5f9c3f8b11") || isValidUploadId("../upload")) {
    throw new Error("Upload identifier validation is incorrect");
  }
});

Deno.test("requires exact JSON command keys", () => {
  if (!hasExactKeys({ action: "finalize_upload", upload_id: "id" }, ["action", "upload_id"])) {
    throw new Error("A valid command shape was rejected");
  }
  if (hasExactKeys({ action: "finalize_upload", upload_id: "id", path: "../other" }, ["action", "upload_id"])) {
    throw new Error("An untrusted extra path field was accepted");
  }
});

Deno.test("accepts bounded JSON without Content-Length", async () => {
  const request = new Request("https://example.invalid/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "finalize_upload", upload_id: "synthetic" }),
  });
  const parsed = await readJsonWithLimit(request, 256);
  if (!hasExactKeys(parsed, ["action", "upload_id"])) {
    throw new Error("A valid bounded JSON body was not parsed");
  }
});

Deno.test("rejects JSON whose actual stream exceeds the limit", async () => {
  const request = new Request("https://example.invalid/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(2048) }),
  });
  let rejected = false;
  try {
    await readJsonWithLimit(request, 128);
  } catch (error) {
    rejected = error instanceof RequestBodyTooLargeError;
  }
  if (!rejected) throw new Error("An oversized JSON stream was accepted");
  if (request.body?.locked) throw new Error("The JSON request reader remained locked");
});

Deno.test("compares staged references and bytes exactly", async () => {
  const left = new Uint8Array([1, 2, 3]);
  const right = new Uint8Array([1, 2, 3]);
  if (!bytesEqual(left, right) || bytesEqual(left, new Uint8Array([1, 2, 4]))) {
    throw new Error("Byte comparison is incorrect");
  }
  if (await sha256Hex(new Uint8Array()) !== "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
    throw new Error("SHA-256 helper does not match the standard empty digest");
  }

  const session = {
    archive_object_path: "synthetic-feed/" + "a".repeat(64) + "/feed.zip",
    manifest_object_path: "synthetic-feed/" + "a".repeat(64) + "/manifest.json",
    archive_sha256: "a".repeat(64),
    archive_bytes: 128,
    manifest_sha256: "b".repeat(64),
  };
  if (!isMatchingStagedRow({ ...session }, session)) {
    throw new Error("An identical staged row was not recognized");
  }
  if (isMatchingStagedRow({ ...session, manifest_sha256: "c".repeat(64) }, session)) {
    throw new Error("A staged row with a different manifest digest was accepted");
  }
});


Deno.test("bounds Storage metadata sizes before downloading existing objects", () => {
  if (!isExactBoundedObjectSize(128, 128, MAX_MANIFEST_BYTES) ||
      !isExactBoundedObjectSize("128", 128, MAX_MANIFEST_BYTES)) {
    throw new Error("An exact bounded Storage object size was rejected");
  }
  if (isExactBoundedObjectSize(MAX_MANIFEST_BYTES + 1, MAX_MANIFEST_BYTES + 1, MAX_MANIFEST_BYTES) ||
      isExactBoundedObjectSize("1.5", 1, MAX_MANIFEST_BYTES) ||
      isExactBoundedObjectSize(-1, 1, MAX_MANIFEST_BYTES)) {
    throw new Error("An oversized or malformed Storage object size was accepted");
  }
});

Deno.test("reserves an issuance safety margin before requesting the signed token", () => {
  const requestStartedAt = Date.parse("2026-11-19T12:00:00.000Z");
  const initialExpiry = Date.parse(uploadSessionExpiryAfterTokenIssuedAt(
    requestStartedAt + SIGNED_UPLOAD_ISSUANCE_SAFETY_MARGIN_MS,
  ));
  if (initialExpiry - requestStartedAt !==
      SIGNED_UPLOAD_ISSUANCE_SAFETY_MARGIN_MS + UPLOAD_SESSION_TTL_MS) {
    throw new Error("The pre-request session expiry must include the issuance safety margin");
  }
});

Deno.test("signed TUS headers carry only the immutable upload token", () => {
  const headers = signedTusHeaders("synthetic-signed-token");
  if (Object.keys(headers).join(",") !== "x-signature" ||
      headers["x-signature"] !== "synthetic-signed-token" ||
      Object.hasOwn(headers, "x-upsert")) {
    throw new Error("The TUS grant must use x-signature only and never enable upsert");
  }
  let rejected = false;
  try {
    signedTusHeaders("");
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("An empty signed upload token was accepted");
});

Deno.test("anchors failed-session cleanup grace to the signed-token issuance time", () => {
  const issuedAt = Date.parse("2026-11-19T12:00:00.000Z");
  const cleanupAt = Date.parse(uploadSessionExpiryAfterTokenIssuedAt(issuedAt));
  if (cleanupAt - issuedAt !== UPLOAD_SESSION_TTL_MS) {
    throw new Error("The cleanup deadline was not anchored to token issuance");
  }
  const lastPossibleTusExpiry = issuedAt + SIGNED_UPLOAD_TOKEN_TTL_MS + TUS_UPLOAD_URL_TTL_MS;
  if (cleanupAt - lastPossibleTusExpiry !== UPLOAD_CLEANUP_GRACE_MS) {
    throw new Error("Cleanup must follow the last possible TUS URL expiry by the full grace period");
  }
});

Deno.test("does not permit failed-session cleanup before the signed token expires", () => {
  const createdAt = Date.parse("2026-11-19T12:00:00.000Z");
  const signedTokenExpiresAt = createdAt + SIGNED_UPLOAD_TOKEN_TTL_MS;
  const lastPossibleTusExpiry = signedTokenExpiresAt + TUS_UPLOAD_URL_TTL_MS;
  const cleanupAt = lastPossibleTusExpiry + UPLOAD_CLEANUP_GRACE_MS;
  const sessionExpiresAt = createdAt + UPLOAD_SESSION_TTL_MS;
  if (sessionExpiresAt !== cleanupAt || UPLOAD_SESSION_TTL_MS <= SIGNED_UPLOAD_TOKEN_TTL_MS) {
    throw new Error("The cleanup deadline must include token, resumable URL and grace lifetimes");
  }
  if (isUploadSessionExpired(new Date(sessionExpiresAt).toISOString(), lastPossibleTusExpiry)) {
    throw new Error("A failed session became cleanup-eligible while a TUS URL could still be valid");
  }
  if (isUploadSessionExpired(new Date(sessionExpiresAt).toISOString(), cleanupAt - 1)) {
    throw new Error("A failed session became cleanup-eligible before the safety margin elapsed");
  }
  if (!isUploadSessionExpired(new Date(sessionExpiresAt).toISOString(), cleanupAt)) {
    throw new Error("An expired failed session was not cleanup-eligible");
  }
  if (isUploadSessionExpired("not-a-timestamp", sessionExpiresAt + 1)) {
    throw new Error("An invalid expiry timestamp must not authorize deletion");
  }
});
