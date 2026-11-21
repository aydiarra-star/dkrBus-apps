#!/usr/bin/env node
// Staging-only: a temporary Python publication intercepted by the browser.
// Check the two actual dated runs of ONE itinerary, not synthetic Dakar data.
import assert from 'node:assert/strict'
import { journeyMapRows } from './lib/mapPointSmoke.mjs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const previewUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/dkrBus-apps/'
const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
const fixture = same => JSON.parse(execFileSync('python3', ['tests/passenger_edition_fixture.py', '--with-snapshot', ...(same ? ['--same-position'] : [])], { encoding: 'utf8', env: { ...process.env, PYTHONPATH: '.' } }))
for (const same of [false,true]) {
  const { snapshot, edition } = fixture(same)
  for (const theme of ['light','dark']) {
    const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROMIUM_PATH ?? await binary.executablePath(), args:binary?.args })
    try {
      const page = await browser.newPage({viewport:{width:393,height:852},isMobile:true,reducedMotion:'reduce',timezoneId:'Africa/Dakar',locale:'fr-FR',colorScheme:theme,serviceWorkers:'block'})
      const errors=[]; let requests=0
      page.on('pageerror', err => errors.push(err.message))
      await page.route('**/api/**', route => {
        const { pathname, searchParams }=new URL(route.request().url())
        if (pathname==='/api/network') return route.fulfill({json:snapshot})
        if (pathname==='/api/passenger-network' && searchParams.get('date')===edition.date) return route.fulfill({json:edition})
        if (pathname==='/api/journeys') requests++
        return route.fulfill({status:404,json:{}})
      })
      await page.route(/^https:\/\//, r => new URL(r.request().url()).origin === new URL(previewUrl).origin ? r.fallback() : r.abort())
      // Select the same three-minute comfort buffer as the offline dossier.
      await page.addInitScript(() => localStorage.setItem('dakar-bus:preferences:v1', JSON.stringify({mobility:{transferBufferMin:3}})))
      await page.clock.install({time:new Date('2026-11-18T08:18:58Z')})
      await page.clock.pauseAt(new Date('2026-11-18T08:19:00Z'))
      await page.goto(previewUrl, {waitUntil:'domcontentloaded'})
      await page.locator('.mobile-nav').getByRole('button',{name:/trajet/i}).click()
      const date=page.getByLabel('Date et heure de départ à Dakar'); await date.fill('2026-11-18T08:19')
      await page.getByText('Réseau publié du jour intégré au calcul sur tracés vérifiés.').waitFor()
      for (const [label,name] of [['Départ','Essai A2'],['Destination','Essai B3']]) {
        await page.getByRole('combobox',{name:label+' du trajet'}).fill(name)
        await page.getByRole('listbox',{name:new RegExp(label+' :')}).getByRole('option',{name:new RegExp('^'+name)}).click()
      }
      await page.getByRole('button',{name:'Rechercher mon itinéraire'}).click()
      const plan=page.getByRole('region',{name:'Itinéraires sur tracés vérifiés'}), steps=plan.locator('.is-selected ol > li')
      await plan.getByRole('heading',{name:'Votre trajet'}).waitFor()
      assert.equal(await steps.count(),same?2:3); assert.match(await plan.innerText(),/08:35/)
      const clocks=steps.locator('time'), before=await clocks.allTextContents(), atStart=requests
      assert.deepEqual(before,same?['1:00','11:00']:['1:00','6:00','11:00'])
      await page.clock.runFor(1000); assert.deepEqual(await clocks.allTextContents(),same?['0:59','10:59']:['0:59','5:59','10:59']); assert.equal(requests,atStart)
      const onward=steps.last(); assert.match(await onward.innerText(),same?/Marge incluse dans l’attente : 300 s/:/Marge incluse dans l’attente : 180 s/)
      assert.match(await onward.innerText(),same?/Temps restant après cette marge : 0 s/:/Temps restant après cette marge : 65 s/)
      if (!same) assert.match(await steps.nth(1).textContent(),/Temps relevé dans ce sens : 55 s/)
      if (!same) assert.match(await onward.innerText(), /08:25:55[^]*08:28:55[^]*08:30:00/)
      const mapRows=await journeyMapRows(page), walk=page.locator('path[stroke-dasharray="4 6"]')
      assert.equal(mapRows.filter(p=>p.kind.startsWith('Montée · ')).length,2);
      assert.equal(mapRows.filter(p=>p.kind==='Correspondance du trajet sélectionné').length,same?1:2); assert.equal(await walk.count(),same?0:1)
      await page.clock.fastForward(659000); assert.equal(await clocks.count(),1); assert.match(await onward.innerText(),/Montée passée/); assert.equal(await clocks.last().textContent(),'5:00')
      await page.clock.fastForward(300000); assert.equal(await clocks.count(),0)
      await date.fill('2026-11-18T08:21'); await plan.getByRole('heading',{name:'Votre trajet'}).waitFor({state:'detached'})
      assert.equal((await journeyMapRows(page)).filter(p=>p.kind.startsWith('Montée · ')).length,0); assert.equal(await walk.count(),0); assert.deepEqual(errors,[])
      console.log(`Fixture · ${theme} · DDD 08:20 → AFTU 08:30 → arrivée 08:35 · ${same?'même point, minimum 300 s':'marche dirigée, marge 180 s'} : secondes, échéance et départ manqué OK`)
    } finally { await browser.close() }
  }
}
