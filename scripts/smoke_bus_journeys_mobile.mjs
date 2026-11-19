#!/usr/bin/env node
// Run against the built SPA. Use an external browser as for smoke_bus_boards_mobile.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
for (const theme of ['light','dark']) {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH ?? await binary.executablePath(),args:binary?.args})
  try {
    const page = await browser.newPage({viewport:{width:393,height:852},isMobile:true,locale:'fr-FR',timezoneId:'Africa/Dakar',colorScheme:theme,serviceWorkers:'block',
      permissions:['geolocation'],geolocation:{latitude:14.6890347,longitude:-17.4577499}})
    page.setDefaultTimeout(10000)
    const errors=[], apiTrips=[]; page.on('pageerror', e=>errors.push(e.message))
    await page.route('**/api/**', r=>{ if (new URL(r.request().url()).pathname==='/api/journeys') apiTrips.push(r.request().url()); return r.fulfill({status:404,contentType:'application/json',body:'{}'}) })
    await page.route(/^https:\/\/.*\.tile\.openstreetmap\.org\//, r=>r.abort())
    await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/dkrBus-apps/', {waitUntil:'domcontentloaded'})
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
    await page.locator('.mobile-nav').getByRole('button',{name:/trajet/i}).click()
    const date=page.getByLabel('Date et heure de départ à Dakar'), strict=page.getByLabel(/Uniquement les parcours sans marches vérifiés/)
    await date.fill('2026-11-19T19:00')
    async function choose(field, name) {
      await page.getByRole('combobox',{name:field+' du trajet'}).fill(name)
      await page.getByRole('listbox',{name:new RegExp(field+' :')}).getByRole('option',{name:new RegExp('^'+name+' · DDD 1')}).click()
    }
    await choose('Départ','École Manguiers'); await choose('Destination','Stade Iba Mar Diop')
    const geo=page.getByRole('region',{name:'Itinéraires sur tracés vérifiés'}), ride=geo.getByRole('heading',{name:'Votre trajet'})
    const boards=page.locator('.leaflet-marker-icon[title^="Montée ·"]')
    await page.getByRole('button',{name:'Rechercher mon itinéraire'}).click(); await ride.waitFor(); await boards.first().waitFor()
    assert.equal(await boards.count(),1); assert.match(await geo.innerText(),/Passage modélisé[^]*35 à 77 min/)
    assert.match(await geo.innerText(),/19:06/); assert.match(await geo.innerText(),/19:14/)
    await page.getByRole('button',{name:'DDD actif',exact:true}).click(); await ride.waitFor({state:'detached'})
    await page.getByRole('button',{name:'DDD désactivé',exact:true}).click(); await ride.waitFor()
    await strict.check(); await ride.waitFor({state:'detached'}); await strict.uncheck(); await ride.waitFor()
    for (const d of ['2026-11-19T21:29','2026-11-22T19:00']) { await date.fill(d); await ride.waitFor({state:'detached'}) }
    await date.fill('2026-11-19T19:00'); await ride.waitFor()
    const swap=page.getByRole('button',{name:'Inverser départ et destination'}); await swap.click(); await ride.waitFor({state:'detached'}); await swap.click(); await ride.waitFor()
    await page.getByRole('button',{name:'Utiliser ma position comme départ'}).click(); await ride.waitFor({state:'detached'}); await geo.getByText(/Accès à pied non vérifié entre/).first().waitFor()
    const mode=page.getByRole('group',{name:'Type de calcul'}); await mode.getByRole('button',{name:'Sur horaires · Maristes'}).click()
    await page.getByRole('region',{name:'Carte de Dakar'}).waitFor({state:'detached'}); assert.equal(await boards.count(),0)
    const tripsAtStart=apiTrips.length, hours=page.getByRole('region',{name:'Trajet sur horaires publiés'}), result=hours.getByRole('heading',{name:'Changement possible sur horaires'})
    await date.fill('2026-11-19T05:00'); await hours.getByRole('button',{name:'Comparer les horaires'}).click(); await result.waitFor()
    assert.match(await hours.innerText(),/05:26[^]*05:34[^]*05:46[^]*8 min entre les deux passages/)
    const changes=hours.getByLabel('Correspondances autorisées'); await changes.selectOption('0'); await result.waitFor({state:'detached'}); await changes.selectOption('1'); await result.waitFor()
    await strict.check(); await result.waitFor({state:'detached'}); await strict.uncheck(); await result.waitFor()
    await page.getByRole('button',{name:'AFTU actif',exact:true}).click(); await result.waitFor({state:'detached'}); await page.getByRole('button',{name:'AFTU désactivé',exact:true}).click(); await result.waitFor()
    await hours.getByLabel('Départ sur fiche').selectOption('37702627'); await hours.getByLabel('Arrivée sur fiche').selectOption('37702678')
    await date.fill('2026-11-19T19:00'); assert.match(await hours.innerText(),/19:33[^]*19:47/)
    await date.fill('2026-11-22T19:00'); await result.waitFor({state:'detached'}); assert.match(await hours.innerText(),/Pas de grille relue pour ce jour/)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); assert.equal(apiTrips.length,tripsAtStart)
    await mode.getByRole('button',{name:'Sur la carte',exact:true}).click(); await page.getByRole('region',{name:'Carte de Dakar'}).waitFor()
    assert.deepEqual(errors,[]); console.log(`393 × 852 · ${theme} : Médina, sens/heure/filtres/GPS, Maristes et retour à la carte OK`)
  } finally { await browser.close() }
}
