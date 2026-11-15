import { isDakarBusSupabaseUrl } from "./project.ts";

Deno.test("accepts the canonical Dakar Bus Supabase URL", () => {
  if (!isDakarBusSupabaseUrl("https://mdmuxzaewzqzqutkqdylo.supabase.co")) {
    throw new Error("The dedicated Dakar Bus project URL was rejected");
  }
});

Deno.test("accepts the canonical URL with one trailing slash", () => {
  if (!isDakarBusSupabaseUrl("https://mdmuxzaewzqzqutkqdylo.supabase.co/")) {
    throw new Error("A canonical trailing slash should be accepted");
  }
});

Deno.test("rejects another Supabase project", () => {
  if (isDakarBusSupabaseUrl("https://anphzspjnnhzcqzwhpsg.supabase.co")) {
    throw new Error("A different Supabase project was accepted");
  }
});

Deno.test("rejects non-HTTPS and non-canonical URLs", () => {
  const invalid = [
    "http://mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://user@mdmuxzaewzqzqutkqdylo.supabase.co",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co:444",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/storage",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/?project=other",
    "https://mdmuxzaewzqzqutkqdylo.supabase.co/#other",
    "not a URL",
    "",
  ];
  for (const value of invalid) {
    if (isDakarBusSupabaseUrl(value)) {
      throw new Error(`Non-canonical Supabase URL was accepted: ${value}`);
    }
  }
});
