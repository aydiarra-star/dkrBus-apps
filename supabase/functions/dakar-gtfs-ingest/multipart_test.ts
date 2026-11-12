import {
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
