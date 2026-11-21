/** Read the mounted Leaflet sheets, not the itinerary text or private map
 * objects. These time-based tests use a frozen clock and the reduced-motion
 * preference. Actual pointer hit testing at normal zooms is a separate smoke. */
export async function journeyMapRows(page) {
  const map = page.locator('.leaflet-map'), dialog = page.getByRole('dialog', {name:'Points sur la carte'})
  if (!await map.count()) return [] // timetable-only mode has no map
  const settled = page.locator('.leaflet-map[aria-busy="false"]')
  await settled.waitFor({state:'attached'})
  const pins = settled.locator('.map-point-marker'), titles = await pins.evaluateAll(es => es.map(e => e.title))
  const result = []
  for (const title of titles) {
    await pins.and(page.getByTitle(title,{exact:true})).dispatchEvent('click')
    await dialog.waitFor()
    result.push(...await dialog.locator('li[data-point-key]').evaluateAll(es => es.map(e => ({
      id:e.dataset.pointKey, kind:e.querySelector('small').textContent, name:e.querySelector('strong').textContent,
    }))))
    await dialog.getByRole('button',{name:'Fermer les points'}).dispatchEvent('click')
    await dialog.waitFor({state:'detached'})
  }
  return result
}
