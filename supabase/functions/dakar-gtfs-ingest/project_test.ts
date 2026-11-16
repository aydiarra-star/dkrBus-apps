import { isDakarBusSupabaseUrl } from "./project.ts";

Deno.test("accepts only canonical Dakar Bus Supabase URL variants", () => {
  for (const value of [
    "https://mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co:443",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co:443/",
  ]) {
    if (!isDakarBusSupabaseUrl(value)) {
      throw new Error(`Canonical Dakar Bus project URL was rejected: ${value}`);
    }
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
    "http://mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://user@mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://user:password@mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co:444",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/storage",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/?project=other",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/#other",
    " https://mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://MDMUXZAEWZQZQUTKQDYLO.supabase.co",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co./",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/%2e%2e",
    "not a URL",
    "",
  ];
  for (const value of invalid) {
    if (isDakarBusSupabaseUrl(value)) {
      throw new Error(`Non-canonical Supabase URL was accepted: ${value}`);
    }
  }
});
