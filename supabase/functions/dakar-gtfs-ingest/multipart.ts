export type ContentLengthInspection =
  | { valid: true; tooLarge: boolean; value: number | null }
  | { valid: false; tooLarge: false; value: null };

/** Validate an optional HTTP Content-Length without trusting it as the stream limit. */
export function inspectContentLength(header: string | null, maxBytes: number): ContentLengthInspection {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }
  if (header === null) return { valid: true, tooLarge: false, value: null };
  if (!/^\d+$/.test(header)) return { valid: false, tooLarge: false, value: null };
  const value = Number(header);
  if (!Number.isSafeInteger(value)) return { valid: false, tooLarge: false, value: null };
  return { valid: true, tooLarge: value > maxBytes, value };
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("REQUEST_TOO_LARGE");
    this.name = "RequestBodyTooLargeError";
  }
}

/**
 * Parse multipart data while enforcing a byte limit on the actual incoming
 * stream. Content-Length is optional and therefore cannot be the only guard.
 */
export async function readMultipartWithLimit(request: Request, maxBytes: number): Promise<FormData> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw new TypeError("MULTIPART_FORM_REQUIRED");
  }
  if (!request.body) {
    throw new TypeError("MULTIPART_BODY_REQUIRED");
  }

  const reader = request.body.getReader();
  let receivedBytes = 0;
  let exceeded = false;
  let readerReleased = false;

  const releaseReader = () => {
    if (readerReleased) return;
    try {
      reader.releaseLock();
      readerReleased = true;
    } catch {
      // A pending read is cancelled in finally before another release attempt.
    }
  };

  const cancelReader = async (reason?: unknown) => {
    if (readerReleased) return;
    try {
      await reader.cancel(reason);
    } finally {
      releaseReader();
    }
  };

  const boundedBody = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        releaseReader();
        controller.close();
        return;
      }
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        exceeded = true;
        try {
          await cancelReader();
        } catch {
          // The size violation remains authoritative even if upstream cancellation fails.
        }
        controller.error(new RequestBodyTooLargeError());
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return cancelReader(reason);
    },
  });

  try {
    return await new Response(boundedBody, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch (error) {
    if (exceeded) throw new RequestBodyTooLargeError();
    throw error;
  } finally {
    // Release the original request stream on malformed multipart bodies too.
    try {
      await cancelReader();
    } catch {
      releaseReader();
    }
  }
}


/** Return a multipart field only when it occurs exactly once. */
export function getExactlyOneFormValue(form: FormData, name: string): FormDataEntryValue | null {
  const values = form.getAll(name);
  return values.length === 1 ? values[0] : null;
}

/**
 * Best-effort cleanup for objects created by the current request.
 * A failed or throwing removal is surfaced to the caller instead of being hidden.
 */
export async function cleanupUploadedObjects(
  remove: (paths: string[]) => Promise<{ error: unknown | null }>,
  paths: string[],
): Promise<boolean> {
  if (paths.length === 0) return true;
  try {
    const result = await remove(paths);
    return result.error === null;
  } catch {
    return false;
  }
}

/** Reject multipart entries that are not part of the intake contract. */
export function hasOnlyExpectedFormFields(form: FormData, expectedNames: readonly string[]): boolean {
  const expected = new Set(expectedNames);
  for (const [name] of form.entries()) {
    if (!expected.has(name)) return false;
  }
  return true;
}

export type StagingObjectReferenceState = "NONE" | "BOTH" | "PARTIAL";

/**
 * Classify whether an existing staged row references either object from a
 * failed insert. Never delete an object that may already be referenced by a row.
 */
export function classifyStagingObjectReferences(
  existing: { archive_object_path?: unknown; manifest_object_path?: unknown } | null,
  archivePath: string,
  manifestPath: string,
): StagingObjectReferenceState {
  if (!existing) return "NONE";
  const archiveReferenced = existing.archive_object_path === archivePath;
  const manifestReferenced = existing.manifest_object_path === manifestPath;
  if (archiveReferenced && manifestReferenced) return "BOTH";
  if (archiveReferenced || manifestReferenced) return "PARTIAL";
  return "NONE";
}

export type ManifestUploadFailureDecision =
  | "CLEANUP_ARCHIVE"
  | "DATASET_ALREADY_REGISTERED"
  | "OUTCOME_UNKNOWN";

/**
 * Decide whether the archive uploaded before a manifest failure may be removed.
 * An uncertain lookup or any existing reference always preserves the objects.
 */
export function classifyManifestUploadFailure(
  existing: { archive_object_path?: unknown; manifest_object_path?: unknown } | null,
  lookupFailed: boolean,
  archivePath: string,
  manifestPath: string,
): ManifestUploadFailureDecision {
  if (lookupFailed) return "OUTCOME_UNKNOWN";
  const references = classifyStagingObjectReferences(existing, archivePath, manifestPath);
  if (references === "BOTH") return "DATASET_ALREADY_REGISTERED";
  if (references === "PARTIAL") return "OUTCOME_UNKNOWN";
  return "CLEANUP_ARCHIVE";
}

