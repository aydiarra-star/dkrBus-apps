export type ContentLengthInspection =
  | { valid: true; tooLarge: boolean; value: number | null }
  | { valid: false; tooLarge: false; value: null };

/** Validate an optional HTTP Content-Length without trusting it as the stream limit. */
export function inspectContentLength(header: string | null, maxBytes: number): ContentLengthInspection {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }
  if (header === null) return { valid: true, tooLarge: false, value: null };
  if (!/^\\d+$/.test(header)) return { valid: false, tooLarge: false, value: null };
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
  const boundedBody = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        reader.releaseLock();
        controller.close();
        return;
      }
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        exceeded = true;
        await reader.cancel();
        controller.error(new RequestBodyTooLargeError());
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  try {
    return await new Response(boundedBody, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch (error) {
    if (exceeded) throw new RequestBodyTooLargeError();
    throw error;
  }
}
