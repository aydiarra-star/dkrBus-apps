import assert from 'node:assert/strict'
import test from 'node:test'
import {errorKind,INDEX,mapUrl,readIndex,readSitemap,routeCandidates} from './aftuIndex.mjs'

const index = `<h6>UCAD &amp; JAXAAY</h6><h2><b>LIGNE 84</b></h2><a href="${INDEX}#">Voir itinéraire</a>
  <h6> APIX - DOUGAR </h6><h2>LIGNE 91</h2><a href="">Voir itinéraire</a>
  <h6>Autre axe</h6><h2>Ligne 83</h2><a href='${mapUrl('83')}'>Voir itinéraire</a>
  <script>"<h2>LIGNE 90</h2>"</script><a href='https://example.org/map/dakar-urbain-ligne-90/'>Externe</a>`
const sitemap = `<urlset><url><loc>${mapUrl('27')}</loc></url><url><loc>${mapUrl('83')}</loc></url></urlset>`
test('a heading, a detail URL, a sitemap entry and a probe are independent evidence', () => {
  const pages = routeCandidates(readIndex(index),readSitemap(sitemap))
  assert.equal(pages.get('84').indexAxis,'UCAD & JAXAAY')
  assert.equal(pages.get('84').sourceIndexListed,false)
  assert.equal(pages.get('84').discovery,'PROBE')
  assert.equal(pages.get('91').indexHeading,'LISTED')
  assert.equal(pages.get('90').indexHeading,'NOT_FOUND')
  assert.equal(pages.get('27').discovery,'SITEMAP_DETAIL')
  assert.equal(pages.get('83').discovery,'INDEX_DETAIL')
  assert.equal(pages.get('83').detailLinkInSitemap,true)
  assert.equal(routeCandidates(readIndex(index),null).get('90').detailLinkInSitemap,null)
  assert.throws(()=>readSitemap('<html>maintenance</html>'))
})
test('a change of markup or transport failure is not a 404 or proof the route is absent', () => {
  assert.equal(routeCandidates(readIndex('<h3>other format</h3>'),new Map()).get('90').indexHeading,'INDEX_FORMAT_UNKNOWN')
  assert.equal(errorKind({status:404}),'DETAIL_NOT_FOUND')
  assert.equal(errorKind({status:503}),'HTTP_ERROR')
  assert.equal(errorKind(new TypeError('fetch failed')),'FETCH_ERROR')
})
