#!/usr/bin/env node
// Optional end-to-end smoke for the built SPA. No real API, location or tiles.
// Uses an external Playwright installation (no browser binaries in Git).
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
for (const theme of ['light','dark']) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? await binary.executablePath(), args: binary?.args })
  try {
    const page = await browser.newPage({ viewport:{width:393,height:852},isMobile:true,locale:'fr-FR',timezoneId:'Africa/Dakar',colorScheme:theme,serviceWorkers:'block' })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/**',r => r.fulfill({status:404,contentType:'application/json',body:'{}'}))
    await page.route(/^https:\/\/.*\.tile\.openstreetmap\.org\//,r => r.abort())
    await page.clock.install({ time:new Date('2026-11-19T19:00:00Z') })
    await page.clock.pauseAt(new Date('2026-11-19T19:00:01Z'))
    await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/dkrBus-apps/',{waitUntil:'domcontentloaded'})
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
        assert.equal(await items.locator('.bus-estimate').count(),n)
        assert((await items.locator('.bus-estimate strong').allTextContents()).every(v=>/^Vers \d{2}:\d{2}$/.test(v)))
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
        return
      }
      const before = await timers.allTextContents(); assert(before.every(v => /^[1-9]\d* min$/.test(v)))
      assert.equal(await timers.locator('svg').count(),n)
      assert.equal(await timers.first().evaluate(el=>getComputedStyle(el).color),green)
      const seconds = items.locator('time.passage-remaining'); assert.equal(await seconds.count(), n)
      await tick(seconds.first(), green)
      await page.clock.fastForward(60_000)
      const after = await timers.allTextContents(); assert(after.every(v => /^[1-9]\d* min$/.test(v))); assert.notDeepEqual(before,after)
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
    await inspect('7',2,27,/Gare Palais/,green); await inspect('7',3,29,/Rue Okm 60, 67/,green)
    await inspect('319',0,27,/Arrivée au terminus/,green); await estimates.check(); await inspect('319',1,26,/Arrivée au terminus/,green)
    await network('aftu_tata').click(); await estimates.uncheck(); await input.fill('42')
    await wrapper.locator('.station-board-direction-toggle').last().click()
    assert.equal(await wrapper.locator('.bus-occurrences li').count(),68)
    assert.equal(await wrapper.locator('.bus-occurrences time').count(),68)
    await tick(wrapper.locator('.bus-occurrences time').first(),green)
    await input.fill('84'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    assert.equal(await wrapper.locator('.bus-occurrences time').count(),0); assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Relevé non daté : 05:49/)
    await estimates.check(); await inspect('84',0,73,/Arrivée au terminus/,null); await inspect('84',1,73,/Jaxaay2 Route Du 84/,null)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await inspect('60',0,8,/Arrivée au terminus/,null); await inspect('60',1,8,/Dernier secteur/,null)
    await wrapper.getByRole('button',{name:'AFTU',exact:true}).click(); await input.fill('80'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    assert.equal(await wrapper.locator('.station-board-direction-toggle').nth(1).locator('time').count(),0); assert.equal(await wrapper.locator('.bus-occurrences li').count(),0); assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Retour non confirmé/)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await input.fill('60'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    const note=wrapper.locator('.bus-survey-note'); await note.locator('summary').click()
    assert.equal(await note.getByRole('link').getAttribute('href'),'https://www.openstreetmap.org/way/639363334')
    assert.match(await note.innerText(),/ne confirment pas cette correspondance/)
    assert.equal(await note.locator('time').count(),0)
    await wrapper.getByRole('button',{name:'AFTU',exact:true}).click(); await estimates.uncheck()
    await input.fill('65'); await wrapper.locator('.station-board-direction-toggle').last().click()
    await page.clock.pauseAt(new Date('2026-11-20T05:10:58Z')); await page.clock.runFor(1000)
    const rankTime = rank => wrapper.locator('.bus-occurrences li').nth(rank-1).locator('time')
    assert.equal(await rankTime(56).textContent(),'0:01'); await page.clock.runFor(1000); assert.equal(await rankTime(56).textContent(),'13:00')
    await input.fill('75'); await wrapper.locator('.station-board-direction-toggle').last().click()
    assert.equal(await rankTime(1).textContent(),'5:00'); await tick(rankTime(1),green)
    await input.fill('73')
    // The undated summary is not a service-day board. Its two possible
    // starts must not replace the independent Lac Rose weekly sheet.
    await page.clock.pauseAt(new Date('2026-11-20T05:30:59Z')); await page.clock.runFor(1000)
    const sides = wrapper.locator('.station-board-direction-toggle')
    assert.equal(await sides.count(),2)
    assert.match(await sides.nth(0).innerText(),/Dès 05:55/); assert.match(await sides.nth(1).innerText(),/Dès 05:50/)
    assert.equal(await sides.locator('time').count(),0)
    await page.clock.pauseAt(new Date('2026-11-20T06:51:59Z')); await page.clock.runFor(1000)
    for (const [side, wording] of [/après Cem Thiaroye/, /Le même quai n’est pas confirmé/].entries()) {
      await wrapper.locator('.station-board-direction-toggle').nth(side).click(); await note.locator('summary').click()
      assert.match(await note.innerText(), wording); assert.equal(await note.locator('time, [role=timer]').count(),0)
      assert.match(await note.getByRole('link', {name:/Grille de la 73 vers/}).getAttribute('href'),side ? /4256343-0$/ : /4256342-0$/)
      const rows=wrapper.locator('.bus-occurrences li'); assert.equal(await rows.count(),75)
      const remaining = i => rows.nth(i).locator('time.passage-remaining').textContent()
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
    const terminal = wrapper.locator('.bus-occurrences li').last(), clock = terminal.locator('time.passage-remaining')
    await page.clock.pauseAt(new Date('2026-11-20T23:37:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); assert.match(await terminal.innerText(),/1 min/)
    await page.clock.runFor(1000); assert.equal(await clock.count(),0); assert.match(await terminal.innerText(), /Fin de service/)
    await sides.nth(1).click()
    await page.clock.pauseAt(new Date('2026-11-20T23:49:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000); assert.match(await terminal.innerText(), /Fin de service/)
    // Friday's final *printed* Palais arrival is 00:53, not Thursday's 01:08.
    await network('ddd').click(); await estimates.check(); await input.fill('16B'); await sides.nth(2).click()
    await page.clock.pauseAt(new Date('2026-11-20T23:59:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'8:01'); await page.clock.runFor(1000); assert.equal(await clock.textContent(),'8:00')
    await page.clock.pauseAt(new Date('2026-11-21T00:52:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000)
    assert.equal(await clock.count(),0); assert.match(await terminal.innerText(),/Dès 06:43/)
    await estimates.uncheck(); await input.fill('311'); await sides.nth(2).click()
    await page.clock.pauseAt(new Date('2026-11-21T20:14:58Z')); await page.clock.runFor(1000)
    assert.equal(await clock.textContent(),'0:01'); await page.clock.runFor(1000); assert.match(await terminal.innerText(),/Fin de service/)
    await sides.nth(1).click(); assert.equal(await clock.textContent(),'11:00'); await tick(clock,green)
    assert.deepEqual(errors,[]); console.log(`393 × 852 · ${theme} : TER, BRT, DDD, AFTU, TATA : deux sens, rangs, secondes vertes sur fiche, modèles sans timer, 65/75 matin, fins 73 et 311 samedi, minuit et retour absent OK`)
  } finally { await browser.close() }
}
