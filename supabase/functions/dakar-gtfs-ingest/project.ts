const DAKAR_BUS_PROJECT_HOST = "mdmuxzaewzqzqutkqdylo.supabase.co";
const DAKAR_BUS_PROJECT_URLS = new Set([
  `https://${DAKAR_BUS_PROJECT_HOST}`,
  `https://${DAKAR_BUS_PROJECT_HOST}/`,
  `https://${DAKAR_BUS_PROJECT_HOST}:443`,
  `https://${DAKAR_BUS_PROJECT_HOST}:443/`,
]);

/**
 * Accept only the exact canonical HTTPS URL variants of the dedicated Dakar Bus
 * project. String equality deliberately rejects URL-parser normalizations such
 * as surrounding whitespace, encoded dot segments, alternate hosts and paths.
 */
export function isDakarBusSupabaseUrl(value: string): boolean {
  return DAKAR_BUS_PROJECT_URLS.has(value);
}
