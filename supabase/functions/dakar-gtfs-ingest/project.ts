const DAKAR_BUS_PROJECT_HOST = "mdmuxzaewzqzqutkqdylo.supabase.co";

/**
 * Accept only the canonical HTTPS URL of the dedicated Dakar Bus Supabase
 * project. This prevents an accidentally misconfigured Edge Function from
 * writing private GTFS staging metadata or objects into another project.
 */
export function isDakarBusSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === DAKAR_BUS_PROJECT_HOST &&
      (url.port === "" || url.port === "443") &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "";
  } catch {
    return false;
  }
}
