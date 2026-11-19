const DAKAR_BUS_PROJECT_REF = "mdmuxzaewzqzqutkqdylo";
const DAKAR_BUS_PROJECT_HOST = `${DAKAR_BUS_PROJECT_REF}.supabase.co`;
export const DAKAR_BUS_TUS_UPLOAD_ENDPOINT =
  `https://${DAKAR_BUS_PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable`;
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
