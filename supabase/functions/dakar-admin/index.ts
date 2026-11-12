import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOWED_ORIGINS = new Set([
  "https://aydiarra-star.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return json(403, { error: "ORIGIN_FORBIDDEN" }, headers);
    }
    return new Response(null, { status: 204, headers });
  }

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return json(403, { error: "ORIGIN_FORBIDDEN" }, headers);
  }

  if (req.method !== "GET") {
    return json(405, { error: "METHOD_NOT_ALLOWED" }, headers);
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return json(401, { error: "AUTHENTICATION_REQUIRED" }, headers);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(503, { error: "SERVER_CONFIGURATION_MISSING" }, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(match[1]);
  if (userError || !userData.user || !userData.user.email_confirmed_at) {
    return json(401, { error: "AUTHENTICATION_FAILED" }, headers);
  }

  const { data: actor, error: actorError } = await admin
    .from("dakar_admin_actors")
    .select("user_id, role, display_name, active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (actorError) {
    return json(503, { error: "ROLE_LOOKUP_FAILED" }, headers);
  }
  if (!actor || !actor.active) {
    return json(403, { error: "ACTOR_NOT_AUTHORIZED" }, headers);
  }

  return json(200, {
    authenticated: true,
    actor: {
      user_id: actor.user_id,
      display_name: actor.display_name,
      role: actor.role,
    },
  }, headers);
});
