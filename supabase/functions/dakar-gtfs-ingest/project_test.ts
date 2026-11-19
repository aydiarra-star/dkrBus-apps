import { DAKAR_BUS_TUS_UPLOAD_ENDPOINT, isDakarBusSupabaseUrl } from "./project.ts";

Deno.test("accepts only canonical Dakar Bus Supabase URL variants", () => {
  for (const value of [
    "https://mdmuxzaewqzqutkqdylo.supabase.co",
    "https://mdmuxzaewqzqutkqdylo.supabase.co/",
    "https://mdmuxzaewqzqutkqdylo.supabase.co:443",
    "https://mdmuxzaewqzqutkqdylo.supabase.co:443/",
  ]) {
    if (!isDakarBusSupabaseUrl(value)) {
      throw new Error(`Canonical Dakar Bus project URL was rejected: ${value}`);
    }
  }
});

Deno.test("pins resumable uploads to the dedicated Dakar Bus Storage hostname", () => {
  if (DAKAR_BUS_TUS_UPLOAD_ENDPOINT !==
      "https://mdmuxzaewqzqutkqdylo.storage.supabase.co/storage/v1/upload/resumable") {
    throw new Error("The TUS endpoint is not pinned to the Dakar Bus Storage host");
  }
});

Deno.test("rejects another Supabase project, including the Yere project", () => {
  for (const value of [
    "https://anphzspjnnhzcqzwhpsg.supabase.co",
    "https://example.supabase.co",
  ]) {
    if (isDakarBusSupabaseUrl(value)) {
      throw new Error(`A different Supabase project was accepted: ${value}`);
    }
  }
});

Deno.test("rejects non-HTTPS, credentials, non-canonical ports and URL components", () => {
  const invalid = [
    "http://mdmuxzaewqzqutkqdylo.supabase.co",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://user@mdmuxzaewqzqutkqdylo.supabase.co",
    "https://user:password@mdmuxzaewqzqutkqdylo.supabase.co",
    "https://mdmuxzaewqzqutkqdylo.supabase.co:444",
    "https://mdmuxzaewqzqutkqdylo.supabase.co/storage",
    "https://mdmuxzaewqzqutkqdylo.supabase.co/?project=other",
    "https://mdmuxzaewqzqutkqdylo.supabase.co/#other",
    " https://mdmuxzaewqzqutkqdylo.supabase.co",
    "https://MDMUXZAEWZQZQUTKQDYLO.supabase.co",
    "https://mdmuxzaewqzqutkqdylo.supabase.co./",
    "https://mdmuxzaewqzqutkqdylo.supabase.co/%2e%2e",
    "not a URL",
    "",
  ];
  for (const value of invalid) {
    if (isDakarBusSupabaseUrl(value)) {
      throw new Error(`Non-canonical Supabase URL was accepted: ${value}`);
    }
  }
});
