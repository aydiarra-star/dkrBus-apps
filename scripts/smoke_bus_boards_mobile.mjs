#!/usr/bin/env node
// Optional end-to-end smoke for the built SPA. No real API, location or tiles.
// Uses an external Playwright installation (no browser binaries in Git).
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const previewUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/dkrBus-apps/'
const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
for (const theme of ['light','dark']) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? await binary.executablePath(), args: binary?.args })
  try {
    const page = await browser.newPage({ viewport:{width:393,height:852},isMobile:true,locale:'fr-FR',timezoneId:'Africa/Dakar',colorScheme:theme,serviceWorkers:'block' })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/**',r => r.fulfill({status:404,contentType:'application/json',body:'{}'}))
    await page.route(/^https:\/\//, r => new URL(r.request().url()).origin === new URL(previewUrl).origin ? r.fallback() : r.abort())
    await page.clock.install({ time:new Date('2026-11-19T19:00:00Z') })
    await page.clock.pauseAt(new Date('2026-11-19T19:00:01Z'))
    await page.goto(previewUrl,{waitUntil:'domcontentloaded'})
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
    const network = f => page.locator(`.network-item-${f} .network-summary-header`)
    const wrapper = page.locator('.bus-board'), input = wrapper.getByRole('searchbox')
    async function tick(timer, green) {
      const read = async () => Number((await timer.getAttribute('datetime')).match(/^PT(\d+)S$/)[1])
      const before = await read(); assert(before > 2)
      assert.equal(await timer.evaluate(el => getComputedStyle(el).color), green)
      for (let i = 1; i <= 2; i++) {
        await page.clock.runFor(1000)
        assert.equal(await read(), before - i)
        const seconds = before - i
        assert.equal(await timer.textContent(), `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`)
      }
    }
    async function inspect(code, side, n, last, green) {
      await input.fill(code)
      assert.equal(await wrapper.locator('[data-line-code]').count(),1)
      await wrapper.locator('.station-board-direction-toggle').nth(side).click()
      const items = wrapper.locator('.bus-occurrences li'), timers = items.locator('[role=timer] strong')
      assert.equal(await items.count(),n); assert.match(await items.last().innerText(),last)
      if (green === null) {
        assert.equal(await timers.count(),0); assert.equal(await items.locator('time,svg').count(),0)
        const estimates = items.locator('.bus-estimate')
        assert([0,n].includes(await estimates.count()))
        if (await estimates.count()) assert((await estimates.locator('strong').allTextContents()).every(v=>v === 'Projection non confirmée'))
        assert((await items.allInnerTexts()).every(v=>!/\b(?:[01]\d|2[0-3]):[0-5]\d\b/.test(v)))
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
        return
      }
      const before = await timers.allTextContents(); assert(before.every(v => /^(?:Dans )?(?:[1-9]\d* min|[1-9]\d* h(?: [0-5]\d)?)$/.test(v)))
      assert.equal(await timers.locator('svg').count(),n)
      assert.equal(await timers.first().evaluate(el=>getComputedStyle(el).color),green)
      const seconds = items.locator('time.passage-remaining'); assert.equal(await seconds.count(), n)
      await tick(seconds.first(), green)
      await page.clock.fastForward(60_000)
      const after = await timers.allTextContents(); assert(after.every(v => /^(?:Dans )?(?:[1-9]\d* min|[1-9]\d* h(?: [0-5]\d)?)$/.test(v))); assert.notDeepEqual(before,after)
      assert.equal(await items.evaluateAll(rows => rows.some(r=>r.scrollWidth>r.clientWidth+1)),false)
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    }
    const green = theme === 'dark' ? 'rgb(0, 177, 64)' : 'rgb(0, 122, 45)'
    for (const mode of ['ter','brt']) {
      await network(mode).click()
      for (const side of ['outbound','inbound']) {
        const rows = page.locator(`.station-direction-${side}`).first()
        await tick(rows.locator('time').first(),green)
        assert.equal(await rows.locator('.is-undeclared time').count(),0)
      }
    }
    const estimates = wrapper.getByRole('checkbox',{name:'Inclure les passages estimés'})
    await network('ddd').click(); assert.equal(await estimates.isChecked(),false)
    const coverage = wrapper.locator('.bus-coverage'); await coverage.locator('summary').click()
    assert.match((await coverage.innerText()).replace(/\s/g,' '),/4 906 rangs d’arrêt.*792 couverts, 1 135 partiels et 2 979 sans heure/)
    await coverage.locator('summary').click(); await input.fill('6'); await wrapper.locator('.station-board-direction-toggle').nth(3).click()
    const missing = wrapper.locator('.bus-occurrences li').first(); assert.equal(await missing.locator('time').count(),0)
    const external = missing.getByRole('link',{name:/Consulter la fiche externe de DDD 6 vers Terminus 6 - 79/}); const url = await external.getAttribute('href')
    assert.match(url,/4256165-0$/); await page.context().route(url,r=>r.fulfill({contentType:'text/plain',body:'Fiche externe de recette'}))
    const popup = page.waitForEvent('popup'); await external.click(); const sheet = await popup
    await sheet.waitForURL(url); await sheet.close(); assert.equal(await missing.locator('time').count(),0)
    const gapBoard = await wrapper.locator('.bus-occurrences').innerText()
    assert.match(gapBoard,/lacune après les départs transcrits/)
    assert.doesNotMatch(gapBoard,/\b(?:[01]\d|2[0-3]):[0-5]\d\b/)
    await inspect('7',2,27,/Gare Palais/,green); await inspect('7',3,29,/Rue Okm 60, 67/,green)
    await inspect('16A',2,65,/Gare Palais/,green); await inspect('16A',3,64,/Terminus Malika/,green)
    await inspect('319',0,27,/Arrivée au terminus/,green); await estimates.check(); await inspect('319',1,26,/Arrivée au terminus/,green)
    await network('aftu_tata').click(); await estimates.uncheck(); await input.fill('42')
    await wrapper.locator('.station-board-direction-toggle').last().click()
    assert.equal(await wrapper.locator('.bus-occurrences li').count(),68)
    assert.equal(await wrapper.locator('.bus-occurrences time').count(),68)
    await tick(wrapper.locator('.bus-occurrences time').first(),green)
    await inspect('58',2,39,/Bvar\. Tapée \/ Rue 18/,green); await inspect('58',3,43,/Arrêt De Bus/,green)
    await inspect('57',0,56,/Arrivée au terminus/,green); await inspect('57',1,57,/Terminus 57/,green)
    await input.fill('87'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    const ref87 = wrapper.locator('.bus-survey-note').filter({hasText:'Départ de référence transmis depuis Maristes'}).locator('summary'); await ref87.click()
    assert.match(await wrapper.locator('.bus-occurrences .bus-survey-note').innerText(),/Mosquée Massalikou Djinane/)
    assert.equal(await wrapper.locator('.bus-occurrences time').count(),0)
    await input.fill('84'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    assert.equal(await wrapper.locator('.bus-occurrences time, .bus-occurrences [role="timer"]').count(),0)
    assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Heures de référence · jour non confirmé/)
    assert.doesNotMatch(await wrapper.locator('.bus-occurrences').innerText(),/\b05:49\b/)
    await estimates.check(); await inspect('84',0,73,/Arrivée au terminus/,null); await inspect('84',1,73,/Jaxaay2 Route Du 84/,null)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await inspect('60',0,8,/Arrivée au terminus/,null); await inspect('60',1,8,/Dernier secteur/,null)
    // The other axis of the 53 and the return description of the 1 are
    // documents: no frequency or green clock, even with estimates enabled.
    for (const [code,n,last] of [['1',12,'Terminus Lat Dior'],['53',10,'Sébikotane']]) {
      await input.fill(code); await wrapper.locator('.station-board-direction-toggle').filter({hasText:'itinéraire documentaire'}).click()
      const rows=wrapper.locator('.bus-occurrences li'); assert.equal(await rows.count(),n)
      assert.equal(await rows.last().locator('.station-board-stop strong').textContent(),last)
      assert.equal(await rows.locator('time, [role=timer], .bus-estimate').count(),0)
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    }
    await wrapper.getByRole('button',{name:'AFTU',exact:true}).click(); await input.fill('80'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    assert.equal(await wrapper.locator('.station-board-direction-toggle').nth(1).locator('time').count(),0); assert.equal(await wrapper.locator('.bus-occurrences li').count(),0); assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Retour non confirmé/)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await input.fill('60'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    const mention=wrapper.locator('details').filter({has:page.locator('summary',{hasText:'Arrêt cité par SETER'})}); await mention.locator('summary').click()
    assert.match(await mention.innerText(),/Gare de Colobane/); assert.equal(await mention.locator('time,[role=timer]').count(),0)
    const note=wrapper.locator('.bus-occurrences .bus-survey-note'); await note.locator('summary').click()
    assert.equal(await note.getByRole('link').getAttribute('href'),'https://www.openstreetmap.org/way/639363334')
    assert.match(await note.innerText(),/ne confirment pas cette correspondance/)
    assert.equal(await note.locator('time').count(),0)
    await network('ddd').click(); await estimates.check(); await input.fill('16B')
    const sides = wrapper.locator('.station-board-direction-toggle')
    await sides.nth(2).click()
    const terminal = wrapper.locator('.bus-occurrences li').last(), clock = terminal.locator('time.passage-remaining')
    // Thursday's 24:00 departure remains on the road until 01:08 Friday.
    await page.clock.pauseAt(new Date('2026-11-20T00:52:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'15:00')
    await page.clock.pauseAt(new Date('2026-11-20T01:07:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000)
    assert.equal(await clock.count(),0); assert.match(await terminal.innerText(),/Fin de service/)
    assert.doesNotMatch(await terminal.innerText(),/\b(?:[01]\d|2[0-3]):[0-5]\d\b/)
    await network('aftu_tata').click(); await estimates.uncheck()
    await input.fill('65'); await wrapper.locator('.station-board-direction-toggle').last().click()
    await page.clock.pauseAt(new Date('2026-11-20T05:10:58Z')); await page.clock.runFor(1000)
    const rankTime = rank => wrapper.locator('.bus-occurrences li').nth(rank-1).locator('time')
    assert.equal(await rankTime(56).textContent(),'0:01'); await page.clock.runFor(1000); assert.equal(await rankTime(56).textContent(),'13:00')
    await input.fill('75'); await wrapper.locator('.station-board-direction-toggle').last().click()
    assert.equal(await rankTime(1).textContent(),'5:00'); await tick(rankTime(1),green)
    await input.fill('60')
    const sixties=wrapper.locator('.station-board-direction-toggle')
    for (const [idx,n] of [[2,50],[1,48]]) {
      await sixties.nth(idx).click(); const rows=wrapper.locator('.bus-occurrences li')
      assert.equal(await rows.count(),n); assert.equal(await rows.locator('time').count(),n)
      assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Début de grille uniquement/)
      assert.equal(await wrapper.getByRole('link',{name:'Index de la ligne'}).count(),idx===1?1:0)
      await tick(rows.last().locator('time'),green)
    }
    await input.fill('73')
    // The undated summary is not a service-day board. Its two possible
    // starts must not replace the independent Lac Rose weekly sheet.
    await page.clock.pauseAt(new Date('2026-11-20T05:30:59Z')); await page.clock.runFor(1000)
    assert.equal(await sides.count(),2)
    for (const side of await sides.all()) {
      const passage = side.locator('[role="timer"]')
      assert.equal(await passage.count(),1)
      assert.match(await passage.innerText(),/Dans \d+ min/)
      assert.match(await passage.locator('time').innerText(),/^\d+:\d{2}$/)
      // Exclude the live countdown's mm:ss text; only reject static clock labels.
      const labels = await side.evaluate(el => { const copy = el.cloneNode(true); copy.querySelectorAll('[role="timer"]').forEach(timer => timer.remove()); return copy.innerText })
      assert.doesNotMatch(labels,/\b(?:[01]\d|2[0-3]):[0-5]\d\b/)
    }
    assert.equal(await sides.locator('time').count(),2)
    await page.clock.pauseAt(new Date('2026-11-20T06:51:59Z')); await page.clock.runFor(1000)
    for (const [side, wording] of [/après Cem Thiaroye/, /Le même quai n’est pas confirmé/].entries()) {
      await wrapper.locator('.station-board-direction-toggle').nth(side).click(); await note.locator('summary').click()
      assert.match(await note.innerText(), wording); assert.equal(await note.locator('time, [role=timer]').count(),0)
      assert.match(await note.getByRole('link', {name:/Grille de la 73 vers/}).getAttribute('href'),side ? /4256343-0$/ : /4256342-0$/)
      const rows=wrapper.locator('.bus-occurrences li'); assert.equal(await rows.count(),75)
      const remaining = i => rows.nth(i).locator('time.passage-remaining').textContent()
      assert.equal(await rows.locator('time.passage-remaining').count(),75)
      assert.equal(await remaining(side ? 68 : 6), side ? '18:00' : '5:00') // Marché De Niaga at r69 / r7; 07:10 / 06:57, not a terminus
      if (side === 0) { assert.equal(await remaining(73),'1:00'); assert.equal(await remaining(74),'2:00') }
      else { assert.equal(await remaining(0),'13:00'); assert.equal(await remaining(1),'14:00') }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    }
    await network('ddd').click(); await input.fill('218'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    await note.locator('summary').click(); assert.match(await note.innerText(),/pas son arrivée au dépôt/)
    assert.equal(await wrapper.locator('.bus-occurrences li').count(),1); assert.equal(await note.locator('time').count(),0)
    assert.equal(await sides.count(),3); assert.doesNotMatch((await sides.allTextContents()).join(' '),/7218|05:28/)
    await network('aftu_tata').click(); await input.fill('73')
    await sides.nth(0).click()
    await page.clock.pauseAt(new Date('2026-11-20T23:37:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); assert.match(await terminal.innerText(),/1 min/)
    await page.clock.runFor(1000); assert.equal(await clock.count(),0); assert.match(await terminal.innerText(), /Fin de service/)
    await sides.nth(1).click()
    await page.clock.pauseAt(new Date('2026-11-20T23:49:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000); assert.match(await terminal.innerText(), /Fin de service/)
    // Friday's final Palais arrival is 00:53 on Saturday.
    await network('ddd').click(); await estimates.check(); await input.fill('16B'); await sides.nth(2).click()
    await page.clock.pauseAt(new Date('2026-11-20T23:59:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'8:01'); await page.clock.runFor(1000); assert.equal(await clock.textContent(),'8:00')
    assert.doesNotMatch(await terminal.innerText(),/\b(?:[01]\d|2[0-3]):[0-5]\d\b/)
    await estimates.uncheck(); await input.fill('311'); await sides.nth(2).click()
    await page.clock.pauseAt(new Date('2026-11-21T20:14:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000); assert.match(await terminal.innerText(),/Fin de service/)
    await sides.nth(1).click(); assert.equal(await clock.textContent(),'11:00'); await tick(clock,green)
    await network('aftu_tata').click(); await input.fill('30'); await sides.nth(1).click()
    await page.clock.pauseAt(new Date('2026-11-21T22:18:58Z')); await page.clock.runFor(1000)
    assert.equal(await wrapper.locator('.bus-occurrences li').count(),74); assert.equal(await clock.textContent(),'0:01')
    await page.clock.runFor(1000); assert.equal(await clock.count(),0); assert.match(await terminal.innerText(),/Fin de service/)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await input.fill('immeuble EMG')
    const report = wrapper.locator('details').filter({has:page.locator('summary',{hasText:'Attente rapportée'})})
    await report.locator('summary').click(); assert.match(await report.innerText(),/pour Ouakam/)
    assert.equal(await report.locator('time,[role=timer]').count(),0)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    // Check the rendered cascade, not just the status attribute: a mobility
    // badge must not recolour the service light. The bus header is never a clock.
    const header = network('ter'), dot = header.locator('.network-summary-dot')
    await header.click()
    const dd = page.getByRole('region', {name:'Horaires TER Dakar - Diamniadio'})
    await dd.waitFor()
    assert.equal(await dd.getByRole('listitem').count(),13)
    await dd.getByRole('button',{name:'Basculer vers le sens Retour'}).click()
    assert.match(await dd.getByRole('listitem').first().innerText(),/Diamniadio/)
    assert.equal(await page.locator('.station-direction-outbound .station-board-row').count(),14)
    for (const [clock, status, color] of [
      ['03:00', 'FINISHED', 'rgb(220, 38, 38)'],
      ['06:05', 'UPCOMING', 'rgb(217, 119, 6)'],
      ['12:00', 'ACTIVE', theme === 'dark' ? 'rgb(34, 160, 101)' : 'rgb(25, 135, 84)'],
    ]) {
      await page.clock.pauseAt(new Date(`2026-11-22T${clock}:00Z`))
      await page.clock.runFor(1000)
      assert.equal(await header.getAttribute('data-service-status'),status)
      assert.equal(await dot.evaluate(el => getComputedStyle(el).backgroundColor),color)
      assert.equal(await header.locator('time').count(),status === 'ACTIVE' ? 1 : 0)
      assert.equal(await network('ddd').locator('.network-summary-passage strong').textContent(),'Par arrêt')
      assert.equal(await network('ddd').locator('time').count(),0)
    }
    const interchange = page.locator('.station-board-row').filter({hasText:'Tous trains'});
    assert.equal(await interchange.count(),2)
    for (const text of await interchange.allTextContents()) {
      assert.match(text,/Tous trains · 20 min/)
      assert.match(text,/AIBD · 30 min/)
    }
    console.log(`TER ${theme} : tableau 13 + 14 gares, retour, trois couleurs effectives, dimanche 20/30, bus sans horloge réseau OK`)
    assert.deepEqual(errors,[]); console.log(`393 × 852 · ${theme} : TER, BRT, DDD, AFTU, TATA : deux sens, rangs, secondes vertes sur fiche, modèles sans timer, 16A et 57 dans les deux sens à 19 h, mentions SETER et EMG hors rang, fin de la 30 samedi, 58 en soirée, 60/65/75 matin, 73 Lac Rose 75 rangs par sens, documents TATA 1/53 sans heure, fins 73 et 311 samedi, 16B à minuit et retour absent OK`)
  } finally { await browser.close() }
}
