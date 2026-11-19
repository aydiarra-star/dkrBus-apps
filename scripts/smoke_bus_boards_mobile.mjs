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
    await network('ddd').click(); await inspect('319',0,27,/Arrivée au terminus/,green); await inspect('319',1,26,/Arrivée au terminus/,green)
    await network('aftu_tata').click(); await inspect('84',0,73,/Arrivée au terminus/,green); await inspect('84',1,73,/Jaxaay2 Route Du 84/,green)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await inspect('60',0,8,/Arrivée au terminus/,green); await inspect('60',1,8,/Dernier secteur/,green)
    await wrapper.getByRole('button',{name:'AFTU',exact:true}).click(); await input.fill('80'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    assert.equal(await wrapper.locator('.station-board-direction-toggle').nth(1).locator('time').count(),0); assert.equal(await wrapper.locator('.bus-occurrences li').count(),0); assert.match(await wrapper.locator('.bus-occurrences').innerText(),/Retour non confirmé/)
    await wrapper.getByRole('button',{name:'TATA',exact:true}).click(); await input.fill('60'); await wrapper.locator('.station-board-direction-toggle').nth(1).click()
    const note=wrapper.locator('.bus-survey-note'); await note.locator('summary').click()
    assert.equal(await note.getByRole('link').getAttribute('href'),'https://www.openstreetmap.org/way/639363334')
    assert.match(await note.innerText(),/ne confirment pas cette correspondance/)
    assert.equal(await note.locator('time').count(),0)
    assert.deepEqual(errors,[]); console.log(`393 × 852 · ${theme} : TER, BRT, DDD, AFTU, TATA : deux sens, rangs, minutes et secondes vertes, fin et retour absent OK`)
  } finally { await browser.close() }
}
