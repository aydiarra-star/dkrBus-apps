#!/usr/bin/env node
// Run against the built SPA. Use an external browser as for smoke_bus_boards_mobile.
import assert from 'node:assert/strict'
import { journeyMapRows } from './lib/mapPointSmoke.mjs'
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
    await page.clock.install({time:new Date('2026-11-19T18:59:59Z')})
    await page.clock.pauseAt(new Date('2026-11-19T19:00:00Z'))
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
    const boards=async ()=>(await journeyMapRows(page)).filter(p=>p.kind.startsWith('Montée · '))
    await page.getByRole('button',{name:'Rechercher mon itinéraire'}).click(); await ride.waitFor()
    assert.equal((await boards()).length,1); assert.match(await geo.innerText(),/Passage modélisé[^]*35 à 77 min/)
    assert.match(await geo.innerText(),/19:06/); assert.match(await geo.innerText(),/19:14/)
    const clock=geo.locator('.is-selected .leg-clock time').first(), sent=apiTrips.length
    assert.equal(await clock.textContent(),'6:38'); assert.equal(await clock.evaluate(e=>getComputedStyle(e).color),theme==='dark'?'rgb(0, 177, 64)':'rgb(0, 122, 45)')
    await page.clock.runFor(1000); assert.equal(await clock.textContent(),'6:37'); assert.equal(apiTrips.length,sent)
    await page.clock.resume()
    await page.getByRole('button',{name:'DDD actif',exact:true}).click(); await ride.waitFor({state:'detached'})
    await page.getByRole('button',{name:'DDD désactivé',exact:true}).click(); await ride.waitFor()
    await strict.check(); await ride.waitFor({state:'detached'}); await strict.uncheck(); await ride.waitFor()
    for (const d of ['2026-11-19T21:29','2026-11-22T19:00']) { await date.fill(d); await ride.waitFor({state:'detached'}) }
    await date.fill('2026-11-19T19:00'); await ride.waitFor()
    const swap=page.getByRole('button',{name:'Inverser départ et destination'}); await swap.click(); await ride.waitFor({state:'detached'}); await swap.click(); await ride.waitFor()
    await page.getByRole('button',{name:'Utiliser ma position comme départ'}).click(); await ride.waitFor({state:'detached'}); await geo.getByText(/Accès à pied non vérifié entre/).first().waitFor()
    const mode=page.getByRole('group',{name:'Type de calcul'}); await mode.getByRole('button',{name:'Sur horaires · Maristes'}).click()
    await page.getByRole('region',{name:'Carte de Dakar'}).waitFor({state:'detached'}); assert.equal((await boards()).length,0)
    const tripsAtStart=apiTrips.length, hours=page.getByRole('region',{name:'Trajet sur horaires publiés'}), result=hours.getByRole('heading',{name:'Changement possible sur horaires'})
    await date.fill('2026-11-19T05:00'); await hours.getByRole('button',{name:'Comparer les horaires'}).click(); await result.waitFor()
    assert.match(await hours.innerText(),/05:26[^]*05:34[^]*05:46[^]*8 min entre les deux passages/)
    assert.equal(await hours.locator('time.passage-remaining').count(),0)
    const changes=hours.getByLabel('Correspondances autorisées'); await changes.selectOption('0'); await result.waitFor({state:'detached'}); await changes.selectOption('1'); await result.waitFor()
    await strict.check(); await result.waitFor({state:'detached'}); await strict.uncheck(); await result.waitFor()
    await page.getByRole('button',{name:'AFTU actif',exact:true}).click(); await result.waitFor({state:'detached'}); await page.getByRole('button',{name:'AFTU désactivé',exact:true}).click(); await result.waitFor()
    await hours.getByLabel('Départ sur fiche').selectOption('37702627'); await hours.getByLabel('Arrivée sur fiche').selectOption('37702678')
    await date.fill('2026-11-19T19:00'); assert.match(await hours.innerText(),/19:33[^]*19:47/)
    await date.fill('2026-11-22T19:00'); await result.waitFor({state:'detached'}); assert.match(await hours.innerText(),/Pas de grille relue pour ce jour/)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); assert.equal(apiTrips.length,tripsAtStart)
    await mode.getByRole('button',{name:'Sur la carte',exact:true}).click(); await page.getByRole('region',{name:'Carte de Dakar'}).waitFor()
    const clear=page.getByRole('button',{name:'Effacer le trajet'}), submit=page.getByRole('button',{name:'Rechercher mon itinéraire'})
    await date.fill('2026-11-19T19:00'); await clear.click()
    await choose('Départ','École Manguiers'); await choose('Destination','El Malick Sandaga'); await submit.click(); await ride.waitFor()
    assert.match(await geo.innerText(),/19:19/); assert.match((await boards())[0].name,/Manguiers/)
    await clear.click(); await choose('Départ','PMI Médina'); await choose('Destination','Rue 37 × Blaise Diagne'); await submit.click(); await ride.waitFor()
    assert.match(await geo.innerText(),/19:05[^]*19:06/); assert.match(await geo.innerText(),/290 m/)
    // Deliver a GPS callback only AFTER switching to schedules. On returning
    // to the map the selected northbound origin must not have been replaced.
    await page.evaluate(()=>Object.defineProperty(navigator.geolocation,'getCurrentPosition',{configurable:true,value: success=>{
      window.releaseOrigin=()=>success({coords:{latitude:14.6890347,longitude:-17.4577499,accuracy:5}})
    }}))
    await page.getByRole('button',{name:'Utiliser ma position comme départ'}).click(); await page.waitForFunction(()=>typeof window.releaseOrigin==='function')
    await mode.getByRole('button',{name:'Sur horaires · Maristes'}).click(); const n=apiTrips.length
    await page.evaluate(()=>window.releaseOrigin()); await hours.waitFor(); assert.equal(apiTrips.length,n)
    await mode.getByRole('button',{name:'Sur la carte',exact:true}).click(); assert.match(await page.locator('.route-origin-group').innerText(),/PMI Médina/)
    // The HTTP request really was made. The late NOT_PUBLISHED response must
    // not announce a map search in the independent timetable comparison.
    let pending; await page.route('**/api/journeys?**',r=>{ pending=r },{times:1})
    await Promise.all([page.waitForRequest(req=>new URL(req.url()).pathname==='/api/journeys'),submit.click()])
    await page.getByText('Recherche des courses directes déclarées…').waitFor(); await mode.getByRole('button',{name:'Sur horaires · Maristes'}).click()
    await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname==='/api/journeys'),pending.fulfill({status:503,contentType:'application/json',body:'{"error":"NOT_PUBLISHED"}'})])
    await hours.getByRole('button',{name:'Comparer les horaires'}).click(); await result.waitFor(); assert.equal(await geo.count(),0)
    assert.equal(await page.getByText('Aucun jeu de transport publié. Le calcul sur tracés vérifiés fonctionne localement.',{exact:true}).count(),0)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    assert.deepEqual(errors,[]); console.log(`393 × 852 · ${theme} : 3 directs Médina, filtres, Maristes, bascules pendant le GPS et la réponse HTTP OK`)
  } finally { await browser.close() }
}
