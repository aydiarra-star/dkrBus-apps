#!/usr/bin/env node
// Real hit testing on the production bundle; no tiles, operator calls or live feed required.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { createServer, preview } from 'vite'
const require = createRequire(resolve(process.env.BROWSER_TOOLS ?? '.', 'package.json'))
const { chromium } = require('playwright-core')
const binary = process.env.CHROMIUM_PATH ? null : (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
const sources = await createServer({ configFile:false, logLevel:'error', server:{ middlewareMode:true, watch:null, ws:false, hmr:false } })
const { ALL_CORRIDOR_STOPS:stops, INTERMODAL_TRANSFERS:links, haversineMeters } = await sources.ssrLoadModule('/src/domain/corridors.ts')
const { GREATER_DAKAR_BUS_COVERAGE_POINTS:coverage } = await sources.ssrLoadModule('/src/data/greaterDakarBusCoverage.ts')
const { busMapPoints:roads } = await sources.ssrLoadModule('/src/routing/busGeography.ts')
const { DDD_ARCGIS_MAP_QUERIES:allowed } = await sources.ssrLoadModule('/src/data/dddBanlieueArcgisRegistry.ts')
await sources.close()
const local = process.env.PREVIEW_URL ? null : await preview({ preview:{ host:'127.0.0.1', port:0, open:false }, logLevel:'error' })
const url = process.env.PREVIEW_URL ?? `http://127.0.0.1:${local.httpServer.address().port}/dkrBus-apps/`
const ref = id => stops.find(s => s.id === id)
const expected = stops.map(s=>`ref:${s.id}`).concat(coverage.map(p=>`landmark:${p.id}`),roads.map(r=>r.marker.id))
const pairKeys = links.flatMap(l => [`ref:${l.fromStopId}/${l.toStopId}`,`ref:${l.toStopId}/${l.fromStopId}`]).sort()
function fixture(id,stop) {return {properties:{OBJECTID:id,Nom_Arret:`Essai ${id}`}, geometry:{type:'Point',coordinates:[stop.lon, stop.lat]}}}
try {
  for (const [width,height,theme] of [[360,640,'light'],[393,852,'dark'],[768,1024,'light'],[1366,900,'dark']]) {
    const touch=width<821, browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH ?? await binary.executablePath(),args:binary?.args})
    try {
      const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,colorScheme:theme,locale:'fr',serviceWorkers:'block'})
      page.setDefaultTimeout(15000)
      const errors=[], requests=new Set()
      page.on('pageerror',e=>errors.push(e.message))
      await page.route(/^https:\/\//, r=>{
        const u=new URL(r.request().url()), service=u.origin+u.pathname
        if (u.origin === new URL(url).origin) return r.continue()
        if (!allowed.includes(service)) return r.abort()
        requests.add(service)
        const p=ref('brt-petersen'), c=ref('ter-colobane')
        const features = service.endsWith('Ligne_inter_urbain/FeatureServer/0/query') ? [fixture(1,p),fixture(2,p)] :
          service.endsWith('Ligne_inter_urbain/FeatureServer/8/query') ? [fixture(1,p)] :
          service.endsWith('Ligne_inter_urbain/FeatureServer/1/query') ? [fixture(4,{...c,lat:c.lat+0.00010})] :
          service.endsWith('Ligne_inter_urbain/FeatureServer/12/query') ? [{geometry:{type:'LineString',coordinates:[[c.lon,c.lat],[p.lon,p.lat]]}}] : []
        return r.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({features})})
      })
      await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}))
      await page.goto(url,{waitUntil:'domcontentloaded'})
      const pins=page.locator('.map-point-marker'), sheet=page.getByRole('dialog',{name:'Points sur la carte'})
      const tap=el=>touch ? el.tap() : el.click({noWaitAfter:true})
      const marker=title=>pins.and(page.getByTitle(title,{exact:true}))
      const row=id=>sheet.locator(`[data-point-key="${id}"]`)
      const close=async()=>{await tap(sheet.getByRole('button',{name:'Fermer les points'})); await sheet.waitFor({state:'detached'})}
      async function count(n) {await page.waitForFunction(n=>[...document.querySelectorAll('.map-point-marker')].reduce((sum,e)=>sum+1+Number(e.querySelector('.map-point-count')?.textContent??0),0)===n,n)}
      async function readPins() {
        return pins.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(); return {title:e.title,x:r.x,y:r.y,w:r.width,h:r.height,
          hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.map-point-marker')===e}}))
      }
      const collisions=items=>items.flatMap((a,i)=>items.slice(i+1).filter(b=> a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y).map(b=>[a.title,b.title]))
      // The four historical points are mocked on existing, CSP-permitted query URLs (not user data).
      await count(expected.length+4)
      const track=page.locator('path[stroke-dasharray="5 6"]'); await track.waitFor({state:'attached'})
      assert.deepEqual([...requests].sort(),[...allowed].sort())
      assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
      const initial=await readPins(); assert.deepEqual(collisions(initial),[])
      const owners=new Map(), peers=[]
      for (const pin of initial) {
        assert.ok(pin.hit,`${width}px · centre masqué : ${pin.title}`)
        await tap(marker(pin.title)); await sheet.waitFor().catch(async error => {
          console.error('Marqueur sans liste après activation',width,pin,await readPins(),errors); throw error
        })
        for (const record of await sheet.locator('li').evaluateAll(es=>es.map(e=>({key:e.dataset.pointKey,peers:[...e.querySelectorAll('[data-peer]')].map(p=>p.dataset.peer)})))) {
          assert.ok(!owners.has(record.key),`doublon ${record.key}`); owners.set(record.key,pin.title)
          peers.push(...record.peers.map(id=>record.key+'/'+id))
        }
        await close()
      }
      const historical=[...owners.keys()].filter(k=>k.startsWith('ddd-arcgis-stop-'))
      assert.equal(historical.length,4); assert.deepEqual([...owners.keys()].sort(),expected.concat(historical).sort()); assert.deepEqual(peers.sort(),pairKeys)
      await tap(page.getByRole('button',{name:'Couches',exact:true}))
      const layer=page.getByRole('checkbox',{name:'Dakar Dem Dikk'}), minibus=page.getByRole('checkbox',{name:'AFTU / TATA'})
      await layer.uncheck(); await minibus.uncheck(); await count(37); assert.equal(await track.count(),0)
      await layer.check(); await minibus.check(); await count(expected.length+4); await tap(page.getByRole('button',{name:'Couches',exact:true}))
      // Centre on a REAL member via its own action, not the group's coordinates.
      for (const [index,id] of ['brt-petersen','ter-colobane'].entries()) {
        if (index) {await page.reload(); await count(expected.length+4)}
        await tap(marker(owners.get(`ref:${id}`))); await sheet.waitFor(); const search=sheet.getByRole('searchbox')
        if (await search.count()) await search.fill(ref(id).name)
        await tap(row('ref:'+id).getByRole('button',{name:/^Centrer/})); await sheet.waitFor({state:'detached'})
        const own=pins.filter({hasText:id.startsWith('ter')?'TER':'BRT'}).and(page.getByTitle(new RegExp(`autour de ${ref(id).name}$`)))
        await own.waitFor(); await page.waitForFunction(()=>document.querySelector('.leaflet-map')?.getAttribute('aria-busy')==='false')
        if (!index) { // keyboard also on touch profiles, Enter, Escape, focus back on marker.
          await own.focus(); await own.press('Enter'); assert.equal(await sheet.getByRole('button',{name:'Fermer les points'}).evaluate(e=>document.activeElement===e),true)
          await sheet.getByRole('button',{name:'Fermer les points'}).press('Escape'); await sheet.waitFor({state:'detached'}); assert.ok(await own.evaluate(e=>e===document.activeElement))
        }
        // Open the list after every change of zoom, right up to the last level.
        await tap(own)
        for (let step=0; await sheet.getByRole('button',{name:'Zoomer ici'}).count(); step++) {
          assert.ok(step<5,'Le groupe doit rester sélectionnable au zoom maximal')
          await tap(sheet.getByRole('button',{name:'Zoomer ici'})); await sheet.waitFor({state:'detached'}); await tap(own); await sheet.waitFor()
        }
        assert.equal(await sheet.getByRole('button',{name:'Zoomer ici'}).count(),0)
        const ids=await sheet.locator('li').evaluateAll(es=>es.map(e=>e.dataset.pointKey))
        for (const bus of ['ddd','aftu']) assert.ok(ids.includes(`ref:${bus}-${id.split('-')[1]}`))
        if (!index) {assert.match(await row('ref:brt-petersen').innerText(),/Pôle commun déclaré : DDD/); assert.equal(ids.filter(k=>historical.includes(k)).length,3)}
        else {assert.equal(await row('ref:ter-colobane').locator('[data-peer="ddd-colobane"]').count(),0); assert.ok(!ids.includes('ddd-arcgis-stop-6-urban-1-oid4')); assert.equal(await marker('DDD — Essai 4 · ligne 6').count(),1)}
        await close(); assert.deepEqual(collisions(await readPins()),[])
      }
      // Detailed audit, on both a phone and a desktop: use the 37 actual board
      // buttons to recenter. Independent Web Mercator projection checks the
      // map's final position, rather than assuming that the UI finished a flyTo.
      if (width===393 || width===1366) {
        await page.reload(); await count(expected.length+4)
        const localBus = stops.filter(s=>! /^(ter|brt)-/.test(s.id)).map(s=>({...s,key:`ref:${s.id}`})).concat(
          coverage.map(p=>({...p,key:`landmark:${p.id}`})), roads.map(r=>({...r.marker,key:r.marker.id})))
        const project = p => [p.lon/360*2**23,-Math.asinh(Math.tan(p.lat*Math.PI/180))/(2*Math.PI)*2**23] // Leaflet zoom 15
        const airport=project(ref('ter-aibd')), airportTitle=`TER — ${ref('ter-aibd').name}`
        let audited=0, nearby=0
        for (const mode of ['ter','brt']) {
          await tap(page.getByRole('button',{name:`Voir le réseau ${mode.toUpperCase()}`,exact:true}))
          const board=page.locator('.station-board .station-direction-outbound').first()
          for (const hub of stops.filter(s=>s.id.startsWith(mode+'-'))) {
            await tap(board.getByText(hub.name,{exact:true}))
            const [hx,hy]=project(hub)
            await page.waitForFunction(({airportTitle,x,y})=>{
              const map=document.querySelector('.leaflet-map'); if(map.getAttribute('aria-busy')!=='false') return false
              const m=map.getBoundingClientRect(), p=[...document.querySelectorAll('.map-point-marker')].find(e=>e.title===airportTitle)?.getBoundingClientRect()
              return p && Math.abs(p.x+p.width/2-m.x-m.width/2-x)<2 && Math.abs(p.y+p.height/2-m.y-m.height/2-y)<2
            },{airportTitle,x:airport[0]-hx,y:airport[1]-hy})
            const m=await page.locator('.leaflet-map').boundingBox(), cx=m.x+m.width/2, cy=m.y+m.height/2
            const neighbors=localBus.filter(p=>haversineMeters(hub,p)<=300)
            const targets=[{...hub,key:`ref:${hub.id}`},...neighbors].map(p=>({key:p.key,x:cx+project(p)[0]-hx,y:cy+project(p)[1]-hy}))
            const needed=new Set(targets.map(t=>t.key)), items=await readPins(); assert.deepEqual(collisions(items),[])
            for(const pin of items.filter(p=>p.hit).sort((a,b)=>Math.hypot(a.x+a.w/2-cx,a.y+a.h/2-cy)-Math.hypot(b.x+b.w/2-cx,b.y+b.h/2-cy))) {
              if (!targets.some(t=>needed.has(t.key)&&Math.abs(pin.x+pin.w/2-t.x)<pin.w+6&&Math.abs(pin.y+pin.h/2-t.y)<pin.h+6)) continue
              await tap(marker(pin.title)); await sheet.waitFor()
              for (const id of await sheet.locator('li').evaluateAll(es=>es.map(e=>e.dataset.pointKey))) needed.delete(id)
              await close()
            }
            assert.deepEqual([...needed],[],`${width} px · ${hub.name} et voisins à l'échelle du quartier`); audited++; nearby+=neighbors.length
          }
        }
        assert.equal(audited,37); console.log(`${width} px · zoom 15 : ${audited} recentrages sur les coordonnées du référentiel, ${nearby} voisins du fonds local à ≤ 300 m ouverts sur la carte`)
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); assert.deepEqual(errors,[])
      console.log(`${width} × ${height} · ${theme} · ${initial.length} cibles régionales, ${owners.size} identités dont 14 TER / 23 BRT, ${peers.length} extrémités déclarées, 0 recouvrement ; filtres, clavier et sélection au zoom maximal OK`)
    } finally {await browser.close()}
  }
} finally {if(local) await new Promise(r=>local.httpServer.close(r))}
