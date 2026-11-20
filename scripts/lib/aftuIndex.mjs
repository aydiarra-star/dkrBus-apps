// Documentary index only: the heading before a line number names an axis,
// not a pair of directional stop lists. Keep it separate from acquired maps.
export const INDEX = 'https://aftu-senegal.org/infos-pratiques/'
export const SITEMAP = 'https://aftu-senegal.org/waymark_map-sitemap.xml'
export const probes = ['27','36','84','85','86','87','88','89','90','91']
export const mapUrl = slug => `https://aftu-senegal.org/map/dakar-urbain-ligne-${slug}/`

export function decode(text) {
  return text.replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);|&#x([0-9a-f]+);/gi, (_, d, h) => {
      const code = d ? Number(d) : parseInt(h, 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd'
    })
}
const visible = html => html.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, ' ')
export const plain = html => decode(visible(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

function route(raw) {
  let url
  try { url = new URL(decode(raw), INDEX) } catch { return null }
  const match = /^\/map\/dakar-urbain-ligne-(\d+[a-z]?(?:-[a-z0-9-]+)?)\/?$/i.exec(url.pathname)
  if (url.origin !== new URL(INDEX).origin || url.username || url.password || !match) return null
  return { slug:match[1], url:url.origin + url.pathname }
}

export function readIndex(html) {
  const headings = new Map(), links = new Map()
  const text = visible(html)
  let axis = null
  for (const [,level,body] of text.matchAll(/<h([1-6])\b[^>]*>([^]*?)<\/h\1\s*>/gi)) {
    const label = plain(body), code = /^ligne\s+(\d+[a-z]?)$/i.exec(label)?.[1]?.toUpperCase()
    if (code && level === '2') headings.set(code, axis)
    axis = level === '6' ? label : null
  }
  for (const [,href] of text.matchAll(/<a\b[^>]*?\shref\s*=\s*["']([^"']*)["']/gi)) {
    const p = route(href)
    if (p) links.set(p.slug,p.url)
  }
  return {headings,links}
}
export function readSitemap(xml) {
  if (!/<urlset\b/i.test(xml) || !/<\/urlset>/i.test(xml)) throw new Error('Expected Waymark URL set')
  const links = new Map()
  for (const [,url] of xml.matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc>/gi)) {
    const p = route(url)
    if (p) links.set(p.slug,p.url)
  }
  return links
}
export function routeCandidates(index, sitemap) {
  const pages = new Map()
  for (const slug of new Set([...index.links.keys(), ...sitemap?.keys() ?? [], ...probes])) {
    const line = /^\d+[a-z]?/i.exec(slug)[0].toUpperCase()
    pages.set(slug, {
      url:index.links.get(slug) ?? sitemap?.get(slug) ?? mapUrl(slug),
      sourceIndexListed:index.links.has(slug), // historical field = detail URL, NOT heading
      indexHeading:index.headings.has(line) ? 'LISTED' : index.headings.size ? 'NOT_FOUND' : 'INDEX_FORMAT_UNKNOWN',
      indexAxis:index.headings.get(line) ?? null,
      detailLinkInSitemap:sitemap ? sitemap.has(slug) : null,
      discovery:index.links.has(slug) ? 'INDEX_DETAIL' : sitemap?.has(slug) ? 'SITEMAP_DETAIL' : 'PROBE',
    })
  }
  return pages
}
export function errorKind(error) {
  if (error.status === 404 || error.status === 410) return 'DETAIL_NOT_FOUND'
  if (error.status) return 'HTTP_ERROR'
  return 'FETCH_ERROR'
}
