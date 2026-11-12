const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({
    error: "SOURCE_DISABLED",
    message: "Cette collecte de presse a été arrêtée. Les archives historiques sont conservées ; aucune nouvelle observation n'est ingérée.",
  }), { status: 410, headers: corsHeaders });
});
