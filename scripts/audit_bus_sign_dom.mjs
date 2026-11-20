#!/usr/bin/env node
// Render the same open React panel used by Explorer. The cell-by-cell audit
// separately compares its selector to transcribed source columns, including
// passage boundaries. Here a correct time in memory alone is not sufficient.
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const app = await createServer({configFile:false, appType:'custom',logLevel:'error', esbuild:{jsx:'automatic'},
  optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null,ws:false}})
try {
  const { BusDirectionPanel } = await app.ssrLoadModule('/src/components/EstimatedLineScheduleBoard.tsx')
  const { BUS_BOARD_LINES } = await app.ssrLoadModule('/src/domain/busBoardCatalog.ts')
  const { compileSign } = await app.ssrLoadModule('/src/domain/busSignReading.ts')
  for (const iso of ['2026-11-19T05:10:59Z','2026-11-19T19:00:00Z']) for (const estimates of [false,true]) {
    const now = Date.parse(iso), day = Date.parse(iso.slice(0,10)+'T00:00Z')
    let panels=0, occurrences=0, timers=0, projections=0
    for (const [family, lines] of Object.entries(BUS_BOARD_LINES)) for (const line of lines) if (!line.aliasOf) {
      for (const [idx,d] of line.directions.entries()) {
        const sign=compileSign(d,day,estimates), id=line.key+'/'+(idx+1), name=family.toUpperCase()+' '+line.code
        const html = renderToStaticMarkup(createElement(BusDirectionPanel,{d,sign,estimates,now,name,open:true,toggle(){},id}))
        const doc = JSDOM.fragment(html), rows = [...doc.querySelectorAll('.bus-occurrences li')]
        const check=(el,rank) => {
          const {kind,passage:p} = sign.at(rank,now), loc=`${id} r${rank} ${iso} estimations=${estimates}`
          const secs=el.querySelector('time'),value=el.querySelector('.station-board-passage strong')?.textContent
          const active = p.state==='active' && (kind==='dated'||kind==='weekly')
          assert.equal(!!secs,active,loc);assert.equal(!!el.querySelector('[role=timer]'),active,loc)
          assert.equal(!!el.querySelector('svg.station-board-double-apostrophe'),active,loc)
          if(active) {
            const t=Math.ceil((p.at-now)/1000);assert(t>0,loc);assert.equal(secs.dateTime,`PT${t}S`,loc)
            assert.equal(value,`${Math.ceil(t/60)} min`,loc);assert.equal(secs.textContent,`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`,loc)
          } else if (kind==='model' && 'at' in p) assert.equal(value,`Vers ${new Date(p.at).toISOString().slice(11,16)}`,loc)
          return {active,estimate:kind==='model' && 'at' in p}
        }
        const toggle=doc.querySelector('.station-board-direction-toggle');assert.equal(toggle.getAttribute('aria-controls'),id);check(toggle,1)
        assert.equal(rows.length,d.points.length,id);panels++
        for (const [i,el] of rows.entries()) {
          assert.equal(el.querySelector('.bus-rank').textContent,`${i+1}.`,id);assert.equal(el.querySelector('.station-board-stop strong').textContent,d.points[i],id)
          const r=check(el,i+1);occurrences++;timers+=Number(r.active);projections+=Number(r.estimate)
        }
      }
    }
    console.log(JSON.stringify({iso,estimates,panels,occurrences,timers,projections}))
  }
} finally { await app.close() }
