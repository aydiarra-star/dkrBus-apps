/** Read the mounted Leaflet point sheets, not the itinerary text or a private
 * React/Leaflet object. These schedule replays have a paused browser clock, so
 * dispatch the clicks without waiting for a pan/zoom animation. Real pointer,
 * touch, keyboard and hit targets are checked in smoke_map_points.mjs. */
export async function journeyMapRows(page) {
  const pins = page.locator('.map-point-marker'), dialog = page.getByRole('dialog', { name:'Points sur la carte' })
  const titles = await pins.evaluateAll(es => es.map(e => e.title))
  const result = []
  for (const title of titles) {
    await page.getByTitle(title,{exact:true}).first().dispatchEvent('click')
    await dialog.waitFor()
    result.push(...await dialog.locator('li[data-point-key]').evaluateAll(es => es.map(e => ({
      id:e.dataset.pointKey, kind:e.querySelector('small').textContent, name:e.querySelector('strong').textContent,
    }))))
    await dialog.getByRole('button',{name:'Fermer les points'}).dispatchEvent('click')
    await dialog.waitFor({state:'detached'})
  }
  return result
}
