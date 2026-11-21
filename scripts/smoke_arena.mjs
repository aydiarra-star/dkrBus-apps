#!/usr/bin/env node
// All browser checks consume the *same* built SPA. No reliance on a previous
// vite process on 4173 (which could be serving a different commit).
import { preview } from 'vite'
const server = await preview({ preview:{host:'127.0.0.1',port:0,open:false}, logLevel:'error' })
process.env.PREVIEW_URL = `http://127.0.0.1:${server.httpServer.address().port}/dkrBus-apps/`
try {
  for (const name of ['map_points','map_selections','bus_boards_mobile','bus_journeys_mobile','passenger_change_mobile']) {
    console.log(`\n=== ${name} ===`)
    await import(`./smoke_${name}.mjs`)
  }
} finally { await new Promise(done => server.httpServer.close(done)) }
