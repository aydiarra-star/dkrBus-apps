import {
  inspectContentLength,
  readMultipartWithLimit,
  RequestBodyTooLargeError,
} from "./multipart.ts";

function multipartRequest(body: string, boundary = "dakar-bus-test"): Request {
  return new Request("https://example.invalid/upload", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: body.replaceAll("__BOUNDARY__", boundary),
  });
}

Deno.test("accepts a multipart body within the byte limit without Content-Length", async () => {
  const request = multipartRequest(
    "--__BOUNDARY__\r\nContent-Disposition: form-data; name=\"dataset_id\"\r\n\r\ntest-feed\r\n--__BOUNDARY__--\r\n",
  );
  const form = await readMultipartWithLimit(request, 1024);
  if (form.get("dataset_id") !== "test-feed") {
    throw new Error("The multipart field was not parsed");
  }
});

Deno.test("rejects a multipart body that exceeds the actual stream limit", async () => {
  const request = multipartRequest(
    "--__BOUNDARY__\r\nContent-Disposition: form-data; name=\"payload\"\r\n\r\n" +
      "x".repeat(2048) +
      "\r\n--__BOUNDARY__--\r\n",
  );
  let rejected = false;
  try {
    await readMultipartWithLimit(request, 512);
  } catch (error) {
    rejected = error instanceof RequestBodyTooLargeError;
  }
  if (!rejected) throw new Error("Oversized multipart request was not rejected");
});

Deno.test("rejects non-multipart requests", async () => {
  const request = new Request("https://example.invalid/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  let rejected = false;
  try {
    await readMultipartWithLimit(request, 1024);
  } catch (error) {
    rejected = error instanceof TypeError;
  }
  if (!rejected) throw new Error("A non-multipart request was accepted");
});

Deno.test("accepts an omitted Content-Length because the stream limit remains authoritative", () => {
  const result = inspectContentLength(null, 1024);
  if (!result.valid || result.tooLarge || result.value !== null) {
    throw new Error("An omitted Content-Length should be allowed");
  }
});

Deno.test("accepts a valid decimal Content-Length", () => {
  const result = inspectContentLength("512", 1024);
  if (!result.valid || result.tooLarge || result.value !== 512) {
    throw new Error("A valid decimal Content-Length was rejected");
  }
});

Deno.test("rejects malformed and unsafe Content-Length values", () => {
  for (const value of ["", "-1", "+1", "1.5", "12x", "9007199254740992"]) {
    if (inspectContentLength(value, 1024).valid) {
      throw new Error(`Malformed Content-Length was accepted: ${value}`);
    }
  }
});

Deno.test("flags a declared Content-Length above the request limit", () => {
  const result = inspectContentLength("1025", 1024);
  if (!result.valid || !result.tooLarge) {
    throw new Error("An oversized Content-Length was not flagged");
  }
});
